"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { Goal, NewGoalInput } from "@/lib/types";
import { createGoal, reconsiderGoal, setCompleted, skipGoal } from "@/lib/actions";

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
  addGoal: (input: NewGoalInput) => Promise<Goal>;
  toggleComplete: (id: string, completed: boolean) => Promise<void>;
  confirmSkip: (id: string, reason: string, note: string) => Promise<void>;
  reconsider: (id: string) => Promise<void>;
  justAddedId: string | null;
}

const GoalsContext = createContext<GoalsContextValue | null>(null);

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
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

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
            skipped_reason: null,
            skipped_note: null,
            skipped_at: null,
            is_today: input.is_today ?? false,
            created_at: new Date().toISOString(),
          } as Goal)
        : await createGoal(input);
      upsert(created);
      setNewGoalOpen(false);
      setFocusId(created.parent_id ?? created.id);
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
              ? { ...g, completed, skipped_reason: completed ? null : g.skipped_reason, skipped_note: completed ? null : g.skipped_note, skipped_at: completed ? null : g.skipped_at }
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
      addGoal,
      toggleComplete,
      confirmSkip,
      reconsider,
      justAddedId,
    }),
    [goals, demoMode, focusId, newGoalOpen, skipTaskId, addGoal, toggleComplete, confirmSkip, reconsider, justAddedId]
  );

  return <GoalsContext.Provider value={value}>{children}</GoalsContext.Provider>;
}

export function useGoals() {
  const ctx = useContext(GoalsContext);
  if (!ctx) throw new Error("useGoals must be used within GoalsProvider");
  return ctx;
}
