import { randomUUID } from "crypto";
import { toISODate } from "./goals";
import {
  DEMO_HISTORY_PARENT_KEY,
  DEMO_HISTORY_TEMPLATE_KEY,
  DEMO_HISTORY_TITLE,
  DEMO_HISTORY_WHY,
  DEMO_TREE,
  buildDemoHistory,
} from "./demoTree";

function offsetDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/**
 * Seeded once into every new account (see app/auth/callback/route.ts),
 * tagged is_example so the owner can tell it apart from their own goals
 * and delete it once they've got the idea. Built from the same DEMO_TREE
 * that demo mode uses (lib/mockGoals.ts) — this is the real, full demo
 * data (three branches, standalone tasks, recurring templates, and two
 * backdated weeks of history for the Insights heatmap), not a shrunken
 * stand-in, so it actually shows what using the app looks like.
 */
export function buildExampleGoals(userId: string) {
  const ids = new Map<string, string>();
  for (const n of DEMO_TREE) ids.set(n.key, randomUUID());

  const treeRows = DEMO_TREE.map((n) => ({
    id: ids.get(n.key)!,
    user_id: userId,
    parent_id: n.parentKey ? ids.get(n.parentKey)! : null,
    level: n.level,
    title: `Example: ${n.title}`,
    why_note: n.why_note,
    is_example: true,
    scheduled_date: n.scheduleOffset !== undefined ? offsetDate(n.scheduleOffset) : null,
    completed: n.completed ?? false,
    is_template: n.isTemplate ?? false,
    recurrence_rule: n.recurrenceRule ?? null,
  }));

  const historyRows = buildDemoHistory().map((h) => {
    const iso = offsetDate(h.offset);
    return {
      id: randomUUID(),
      user_id: userId,
      parent_id: ids.get(DEMO_HISTORY_PARENT_KEY)!,
      level: "daily" as const,
      title: `Example: ${DEMO_HISTORY_TITLE}`,
      why_note: DEMO_HISTORY_WHY,
      is_example: true,
      scheduled_date: iso,
      template_id: ids.get(DEMO_HISTORY_TEMPLATE_KEY)!,
      completed: h.completed,
      skipped_reason: h.skipped ? "Ran out of time" : null,
      skipped_at: h.skipped ? `${iso}T20:00:00.000Z` : null,
    };
  });

  return [...treeRows, ...historyRows];
}
