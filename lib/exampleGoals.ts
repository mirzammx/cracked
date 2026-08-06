import { randomUUID } from "crypto";
import { toISODate } from "./goals";

/**
 * Seeded once into every new account (see app/auth/callback/route.ts),
 * tagged is_example so the owner can tell it apart from their own goals
 * and delete it once they've got the idea. A full yearly→quarterly→
 * monthly→weekly→daily chain, not a shortcut — the whole point is
 * demonstrating the throughline from a daily task up to a yearly goal,
 * which a partial chain wouldn't show.
 */
export function buildExampleGoals(userId: string) {
  const yearlyId = randomUUID();
  const quarterlyId = randomUUID();
  const monthlyId = randomUUID();
  const weeklyId = randomUUID();

  const today = toISODate(new Date());
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = toISODate(yesterdayDate);

  const base = { user_id: userId, is_example: true };

  return [
    {
      ...base,
      id: yearlyId,
      parent_id: null,
      level: "yearly" as const,
      title: "Example: Run a 5K",
      why_note: 'A concrete finish line beats a vague intention to "get in shape."',
    },
    {
      ...base,
      id: quarterlyId,
      parent_id: yearlyId,
      level: "quarterly" as const,
      title: "Example: Build a running habit",
      why_note: "Consistency for one quarter proves it's sustainable before chasing distance.",
    },
    {
      ...base,
      id: monthlyId,
      parent_id: quarterlyId,
      level: "monthly" as const,
      title: "Example: Run three times a week",
      why_note: "Frequency first — pace and distance can wait.",
    },
    {
      ...base,
      id: weeklyId,
      parent_id: monthlyId,
      level: "weekly" as const,
      title: "Example: This week's runs",
      why_note: "Three short runs, nothing heroic.",
    },
    {
      ...base,
      id: randomUUID(),
      parent_id: weeklyId,
      level: "daily" as const,
      title: "Example: 20-minute easy run",
      why_note: "This is the task that shows up in Today View — try checking it off.",
      scheduled_date: today,
    },
    {
      ...base,
      id: randomUUID(),
      parent_id: weeklyId,
      level: "daily" as const,
      title: "Example: Stretch after yesterday's run",
      why_note: "This is what a finished task looks like — see it reflected on the Insights heatmap.",
      scheduled_date: yesterday,
      completed: true,
    },
  ];
}
