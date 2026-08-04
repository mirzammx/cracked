"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Goal, NewGoalInput } from "@/lib/types";
import { matchesRecurrence, todayISODate } from "@/lib/goals";
import { createGoal, deleteTemplate, reconsiderGoal, setCompleted, skipGoal, updateTemplate } from "@/lib/actions";

interface GoalsContextValue {
  goals: Goal[];
  demoMode: boolean;
  focusId: string | null;
  setFocusId: (id: string | null) => void;
  newGoalOpen: boolean;
  openNewGoal: () => void;
  closeNewGoal: () => void;
  skipTaskId: string | null;
  openSkip: (id: string) => void;
  closeSkip: () => void;
  recurringOpen: boolean;
  openRecurring: () => void;
  closeRecurring: () => void;
  addGoal: (input: NewGoalInput) => Promise<Goal>;
  toggleComplete: (id: string, completed: boolean) => Promise<void>;
  confirmSkip: (id: string, reason: string, note: string) => Promise<void>;
  reconsider: (id: string) => Promise<void>;
  editTemplate: (id: string, patch: Partial<Pick<Goal, "title" | "why_note" | "recurrence_rule">>) => Promise<void>;
  removeTemplate: (id: string) => Promise<void>;
  justAddedId: string | null;
}

const GoalsContext = createContext<GoalsContextValue | null>(null);

/** Builds today's instance of a template as a plain client-side row (demo mode only — real mode does this server-side in ensureTodaysInstances). */
function instantiate(template: Goal, today: string): Goal {
  return {
    ...template,
    id: crypto.randomUUID(),
    is_template: false,
    recurrence_rule: null,
    template_id: template.id,
    scheduled_date: today,
    completed: false,
    completed_at: null,
    skipped_reason: null,
    skipped_note: null,
    skipped_at: null,
    created_at: new Date().toISOString(),
  };
}

export function GoalsProvider({
  initialGoals,
  demoMode = false,
  children,
}: {
  initialGoals: Goal[];
  demoMode?: boolean;
  children: React.ReactNode;
}) {
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [newGoalOpen, setNewGoalOpen] = useState(false);
  const [skipTaskId, setSkipTaskId] = useState<string | null>(null);
  const [recurringOpen, setRecurringOpen] = useState(false);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  // Demo mode has no server to run ensureTodaysInstances() on page load,
  // so it does the equivalent locally, once, on mount.
  useEffect(() => {
    if (!demoMode) return;
    const today = todayISODate();
    setGoals((prev) => {
      const due = prev.filter(
        (g) => g.is_template && g.recurrence_rule && matchesRecurrence(g.recurrence_rule, new Date())
      );
      if (!due.length) return prev;
      const alreadyGenerated = new Set(
        prev.filter((g) => g.template_id && g.scheduled_date === today).map((g) => g.template_id)
      );
      const toCreate = due.filter((t) => !alreadyGenerated.has(t.id));
      if (!toCreate.length) return prev;
      return [...prev, ...toCreate.map((t) => instantiate(t, today))];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoMode]);

  const upsert = useCallback((goal: Goal) => {
    setGoals((prev) => {
      const idx = prev.findIndex((g) => g.id === goal.id);
      if (idx === -1) return [...prev, goal];
      const next = prev.slice();
      next[idx] = goal;
      return next;
    });
  }, []);

  const addGoal = useCallback(
    async (input: NewGoalInput) => {
      const created = demoMode
        ? ({
            id: crypto.randomUUID(),
            user_id: "demo-user",
            parent_id: input.parent_id,
            title: input.title.trim(),
            why_note: input.why_note.trim(),
            level: input.level,
            completed: false,
            completed_at: null,
            skipped_reason: null,
            skipped_note: null,
            skipped_at: null,
            scheduled_date: input.scheduled_date ?? null,
            is_template: input.is_template ?? false,
            recurrence_rule: input.recurrence_rule ?? null,
            template_id: null,
            created_at: new Date().toISOString(),
          } as Goal)
        : await createGoal(input);
      upsert(created);
      setNewGoalOpen(false);
      // Standalone daily tasks/templates (parent_id null, level "daily")
      // are never Goal Map nodes — focusing one would dim the whole map
      // around nothing visible. Only focus a real map node: the new
      // goal's parent if it has one, or itself if it's a new yearly root.
      const focusTarget = created.parent_id ?? (created.level === "yearly" ? created.id : null);
      if (focusTarget) setFocusId(focusTarget);
      setJustAddedId(created.id);
      window.setTimeout(() => setJustAddedId(null), 900);
      return created;
    },
    [upsert, demoMode]
  );

  const toggleComplete = useCallback(
    async (id: string, completed: boolean) => {
      if (demoMode) {
        setGoals((prev) =>
          prev.map((g) =>
            g.id === id
              ? {
                  ...g,
                  completed,
                  completed_at: completed ? new Date().toISOString() : null,
                  skipped_reason: completed ? null : g.skipped_reason,
                  skipped_note: completed ? null : g.skipped_note,
                  skipped_at: completed ? null : g.skipped_at,
                }
              : g
          )
        );
        return;
      }
      const updated = await setCompleted(id, completed);
      upsert(updated);
    },
    [upsert, demoMode]
  );

  const confirmSkip = useCallback(
    async (id: string, reason: string, note: string) => {
      if (demoMode) {
        setGoals((prev) =>
          prev.map((g) =>
            g.id === id
              ? { ...g, completed: false, skipped_reason: reason, skipped_note: note.trim() || null, skipped_at: new Date().toISOString() }
              : g
          )
        );
        setSkipTaskId(null);
        return;
      }
      const updated = await skipGoal(id, reason, note);
      upsert(updated);
      setSkipTaskId(null);
    },
    [upsert, demoMode]
  );

  const reconsider = useCallback(
    async (id: string) => {
      if (demoMode) {
        setGoals((prev) =>
          prev.map((g) => (g.id === id ? { ...g, skipped_reason: null, skipped_note: null, skipped_at: null } : g))
        );
        return;
      }
      const updated = await reconsiderGoal(id);
      upsert(updated);
    },
    [upsert, demoMode]
  );

  const editTemplate = useCallback(
    async (id: string, patch: Partial<Pick<Goal, "title" | "why_note" | "recurrence_rule">>) => {
      if (demoMode) {
        setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)));
        return;
      }
      const updated = await updateTemplate(id, patch);
      upsert(updated);
    },
    [upsert, demoMode]
  );

  const removeTemplate = useCallback(
    async (id: string) => {
      if (demoMode) {
        setGoals((prev) => prev.filter((g) => g.id !== id));
        return;
      }
      await deleteTemplate(id);
      setGoals((prev) => prev.filter((g) => g.id !== id));
    },
    [demoMode]
  );

  const value = useMemo<GoalsContextValue>(
    () => ({
      goals,
      demoMode,
      focusId,
      setFocusId,
      newGoalOpen,
      openNewGoal: () => setNewGoalOpen(true),
      closeNewGoal: () => setNewGoalOpen(false),
      skipTaskId,
      openSkip: (id: string) => setSkipTaskId(id),
      closeSkip: () => setSkipTaskId(null),
      recurringOpen,
      openRecurring: () => setRecurringOpen(true),
      closeRecurring: () => setRecurringOpen(false),
      addGoal,
      toggleComplete,
      confirmSkip,
      reconsider,
      editTemplate,
      removeTemplate,
      justAddedId,
    }),
    [
      goals,
      demoMode,
      focusId,
      newGoalOpen,
      skipTaskId,
      recurringOpen,
      addGoal,
      toggleComplete,
      confirmSkip,
      reconsider,
      editTemplate,
      removeTemplate,
      justAddedId,
    ]
  );

  return <GoalsContext.Provider value={value}>{children}</GoalsContext.Provider>;
}

export function useGoals() {
  const ctx = useContext(GoalsContext);
  if (!ctx) throw new Error("useGoals must be used within GoalsProvider");
  return ctx;
}
