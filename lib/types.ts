export type GoalLevel = "yearly" | "quarterly" | "monthly" | "weekly" | "daily";

export interface Goal {
  id: string;
  user_id: string;
  parent_id: string | null;
  title: string;
  why_note: string;
  level: GoalLevel;
  completed: boolean;
  skipped_reason: string | null;
  skipped_note: string | null;
  skipped_at: string | null;
  is_today: boolean;
  created_at: string;
}

export type NewGoalInput = {
  title: string;
  why_note: string;
  level: GoalLevel;
  parent_id: string | null;
  is_today?: boolean;
};

export const LEVELS: GoalLevel[] = ["yearly", "quarterly", "monthly", "weekly", "daily"];

export const LEVEL_LABEL: Record<GoalLevel, string> = {
  yearly: "Yearly",
  quarterly: "Quarterly",
  monthly: "Monthly",
  weekly: "Weekly",
  daily: "Daily",
};

export const SKIP_REASONS = [
  "Got pulled into something urgent",
  "Not feeling it",
  "Ran out of time",
  "No longer relevant",
] as const;

export type SkipReason = (typeof SKIP_REASONS)[number];
