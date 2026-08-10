export type GoalLevel = "yearly" | "quarterly" | "monthly" | "weekly" | "daily";

export interface Goal {
  id: string;
  user_id: string;
  parent_id: string | null;
  title: string;
  why_note: string;
  level: GoalLevel;
  completed: boolean;
  /** Set/cleared by the DB trigger alongside `completed` — never write this directly. */
  completed_at: string | null;
  skipped_reason: string | null;
  skipped_note: string | null;
  skipped_at: string | null;
  /** ISO date (YYYY-MM-DD). Only meaningful on `daily` goals; null on templates. */
  scheduled_date: string | null;
  /** True for a recurring generator row — never itself a real task. */
  is_template: boolean;
  /** Only set on templates: see RECURRENCE_PRESETS / DAY_CODES below. */
  recurrence_rule: string | null;
  /** Which template generated this instance, if any. */
  template_id: string | null;
  /** Seeded onboarding walkthrough data, not the user's own goal. */
  is_example: boolean;
  created_at: string;
}

export type NewGoalInput = {
  title: string;
  why_note: string;
  level: GoalLevel;
  parent_id: string | null;
  scheduled_date?: string | null;
  is_template?: boolean;
  recurrence_rule?: string | null;
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

// --- Recurrence -------------------------------------------------------
// recurrence_rule is either one of the two presets below, or a
// comma-separated list of DayCode values (e.g. "mon,wed,fri").

export const RECURRENCE_PRESETS = [
  { value: "daily", label: "Every day" },
  { value: "weekdays", label: "Weekdays" },
] as const;

export type RecurrencePreset = (typeof RECURRENCE_PRESETS)[number]["value"];

export const DAY_CODES = [
  { code: "mon", label: "Mon" },
  { code: "tue", label: "Tue" },
  { code: "wed", label: "Wed" },
  { code: "thu", label: "Thu" },
  { code: "fri", label: "Fri" },
  { code: "sat", label: "Sat" },
  { code: "sun", label: "Sun" },
] as const;

export type DayCode = (typeof DAY_CODES)[number]["code"];
