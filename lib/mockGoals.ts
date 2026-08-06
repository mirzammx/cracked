import { Goal } from "./types";
import { toISODate } from "./goals";
import { DEMO_HISTORY_PARENT_KEY, DEMO_HISTORY_TEMPLATE_KEY, DEMO_HISTORY_TITLE, DEMO_HISTORY_WHY, DEMO_TREE, buildDemoHistory } from "./demoTree";

// Demo-mode data — built from the same DEMO_TREE that seeds new real
// accounts (lib/exampleGoals.ts), so "the demo" is one tree, not two
// hand-maintained copies of one. Used only when NEXT_PUBLIC_SUPABASE_URL /
// ANON_KEY aren't set (see lib/env.ts). supabase/seed.sql is still a
// separate hand-kept SQL copy, for seeding a real project directly.

const USER_ID = "demo-user";
const NOW = new Date().toISOString();

function offsetDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

function toGoal(partial: Partial<Goal> & Pick<Goal, "id" | "parent_id" | "level" | "title" | "why_note">): Goal {
  return {
    user_id: USER_ID,
    created_at: NOW,
    completed: false,
    skipped_reason: null,
    skipped_note: null,
    skipped_at: null,
    scheduled_date: null,
    is_template: false,
    recurrence_rule: null,
    template_id: null,
    ...partial,
    completed_at: partial.completed ? NOW : null,
  };
}

const treeGoals: Goal[] = DEMO_TREE.map((n) =>
  toGoal({
    id: n.key,
    parent_id: n.parentKey,
    level: n.level,
    title: n.title,
    why_note: n.why_note,
    scheduled_date: n.scheduleOffset !== undefined ? offsetDate(n.scheduleOffset) : null,
    completed: n.completed ?? false,
    is_template: n.isTemplate ?? false,
    recurrence_rule: n.recurrenceRule ?? null,
  })
);

// Two backdated weeks of the running template's instances, so the
// Insights heatmap has real variation to render in demo mode.
const historyGoals: Goal[] = buildDemoHistory().map((h) => {
  const iso = offsetDate(h.offset);
  return toGoal({
    id: `run-hist-${h.offset}`,
    parent_id: DEMO_HISTORY_PARENT_KEY,
    level: "daily",
    title: DEMO_HISTORY_TITLE,
    why_note: DEMO_HISTORY_WHY,
    scheduled_date: iso,
    template_id: DEMO_HISTORY_TEMPLATE_KEY,
    completed: h.completed,
    skipped_reason: h.skipped ? "Ran out of time" : null,
    skipped_at: h.skipped ? `${iso}T20:00:00.000Z` : null,
  });
});

export const MOCK_GOALS: Goal[] = [...treeGoals, ...historyGoals];
