import { GoalLevel } from "./types";

/**
 * The one goal tree, described independent of environment — no real ids,
 * no absolute dates. Two consumers turn this into actual data:
 *   - lib/mockGoals.ts materializes it as client-side Goal[] for demo mode.
 *   - lib/exampleGoals.ts materializes it as real DB insert rows, seeded
 *     into every new account on first sign-in.
 * Both draw from this single definition so neither drifts from "the demo
 * data" — there's one tree, not two hand-maintained copies of one.
 * (supabase/seed.sql is still a separate hand-kept copy, in SQL, for
 * seeding a real project directly from the SQL Editor.)
 */
export interface DemoNode {
  key: string;
  parentKey: string | null;
  level: GoalLevel;
  title: string;
  why_note: string;
  /** Days relative to "today" (0 = today, -1 = yesterday, 2 = two days out). Daily-level only. */
  scheduleOffset?: number;
  completed?: boolean;
  isTemplate?: boolean;
  recurrenceRule?: string;
}

export const DEMO_TREE: DemoNode[] = [
  { key: "y1", parentKey: null, level: "yearly", title: "Build a business that outlives the job", why_note: "So my hours compound into something that is mine." },
  { key: "q1", parentKey: "y1", level: "quarterly", title: "Launch the product", why_note: "Nothing is real until strangers can pay." },
  { key: "m1", parentKey: "q1", level: "monthly", title: "Ship the MVP", why_note: "Momentum needs a finish line." },
  { key: "w1", parentKey: "m1", level: "weekly", title: "Wire up billing", why_note: "Users cannot pay for a product with no checkout." },
  { key: "t1", parentKey: "w1", level: "daily", title: "Stripe test-mode checkout", why_note: "Ship the smallest working payment path first.", scheduleOffset: 0 },
  { key: "t2", parentKey: "w1", level: "daily", title: "Pricing page copy", why_note: "People pay for what they understand.", scheduleOffset: 0 },
  { key: "t3", parentKey: "w1", level: "daily", title: "Trial expiry logic", why_note: "A trial that never ends is not a trial.", scheduleOffset: -1, completed: true },
  { key: "w2", parentKey: "m1", level: "weekly", title: "Onboarding flow", why_note: "The first five minutes decide if they come back." },
  { key: "t4", parentKey: "w2", level: "daily", title: "First-run empty states", why_note: "A blank screen reads as broken, not new.", scheduleOffset: -2, completed: true },
  { key: "t5", parentKey: "w2", level: "daily", title: "Welcome email sequence", why_note: "Most people never come back on their own.", scheduleOffset: 1 },
  { key: "m2", parentKey: "q1", level: "monthly", title: "First 50 real users", why_note: "Fifty honest opinions beat fifty guesses." },
  { key: "w3", parentKey: "m2", level: "weekly", title: "Ten beta calls", why_note: "Watching someone use it beats asking them about it." },
  { key: "t6", parentKey: "w3", level: "daily", title: "DM five waitlist people", why_note: "The list is worthless until it becomes conversations.", scheduleOffset: 0 },
  { key: "q2", parentKey: "y1", level: "quarterly", title: "Reach $2k monthly revenue", why_note: "Enough to buy another quarter of runway." },
  { key: "m3", parentKey: "q2", level: "monthly", title: "Landing page into a funnel", why_note: "Traffic without a funnel is just visits." },
  { key: "w4", parentKey: "m3", level: "weekly", title: "Draft the launch note", why_note: "The story has to exist before it can spread." },
  { key: "t7", parentKey: "w4", level: "daily", title: "Outline the story, not features", why_note: "Nobody forwards a changelog.", scheduleOffset: 2 },

  { key: "y2", parentKey: null, level: "yearly", title: "Be stronger at forty than at thirty", why_note: "The body is the container for everything else." },
  { key: "q3", parentKey: "y2", level: "quarterly", title: "Finish a half marathon", why_note: "A date on a calendar beats intentions." },
  { key: "m4", parentKey: "q3", level: "monthly", title: "Build the aerobic base", why_note: "Speed without a base just breaks down." },
  { key: "w5", parentKey: "m4", level: "weekly", title: "Three runs, 24km", why_note: "Consistency beats any single heroic run." },
  { key: "t8", parentKey: "w5", level: "daily", title: "Easy 6km before work", why_note: "Done before the day can talk me out of it.", scheduleOffset: 0 },
  { key: "t9", parentKey: "w5", level: "daily", title: "Hill intervals", why_note: "Strength on hills is speed everywhere else.", scheduleOffset: -1, completed: true },
  { key: "t10", parentKey: "w5", level: "daily", title: "Long run, 12km", why_note: "The distance the race actually asks for.", scheduleOffset: 3 },
  { key: "m5", parentKey: "q3", level: "monthly", title: "Fix the sleep window", why_note: "Training without recovery is just damage." },
  { key: "w6", parentKey: "m5", level: "weekly", title: "Lights out by eleven", why_note: "Every good habit is downstream of sleep." },
  { key: "t11", parentKey: "w6", level: "daily", title: "Phone out of the bedroom", why_note: "The scroll is the thing that steals the hour.", scheduleOffset: 0, completed: true },

  // A goal-linked recurring template: never itself a task, so no
  // scheduleOffset — the generation logic creates today's instance from it.
  { key: "run-template", parentKey: "w5", level: "daily", title: "Easy 6km run", why_note: "Base miles compound; heroics don't.", isTemplate: true, recurrenceRule: "mon,wed,fri" },

  { key: "y3", parentKey: null, level: "yearly", title: "Read more than I scroll", why_note: "I want my attention back before I lose the habit of depth." },
  { key: "q4", parentKey: "y3", level: "quarterly", title: "Six books, no skimming", why_note: "Depth over a longer list." },
  { key: "m6", parentKey: "q4", level: "monthly", title: "Finish the nightstand book", why_note: "One unfinished book quietly kills the next one." },
  { key: "w7", parentKey: "m6", level: "weekly", title: "Thirty pages a night", why_note: "Small and repeatable beats ambitious and rare." },
  { key: "t12", parentKey: "w7", level: "daily", title: "Thirty pages after dinner", why_note: "Same slot every night, no negotiating.", scheduleOffset: 0 },

  // Standalone recurring template: a weekday errand with no goal attached.
  { key: "email-template", parentKey: null, level: "daily", title: "Check email inbox to zero", why_note: "An overflowing inbox is a hidden task list.", isTemplate: true, recurrenceRule: "weekdays" },

  // Standalone one-off tasks (not linked to any goal).
  { key: "t13", parentKey: null, level: "daily", title: "Renew car registration", why_note: "It expires this week.", scheduleOffset: 0 },
  { key: "t14", parentKey: null, level: "daily", title: "Call the dentist", why_note: "Overdue for a cleaning.", scheduleOffset: 1 },
];

/** The template whose instances get backfilled with demo history. */
export const DEMO_HISTORY_TEMPLATE_KEY = "run-template";
export const DEMO_HISTORY_PARENT_KEY = "w5";
export const DEMO_HISTORY_TITLE = "Easy 6km run";
export const DEMO_HISTORY_WHY = "Base miles compound; heroics don't.";
export const DEMO_HISTORY_DAYS = ["Mon", "Wed", "Fri"];

/** Backdated instance descriptors for the last N days matching DEMO_HISTORY_DAYS, mixed done/skipped/open. */
export function buildDemoHistory(daysBack = 13) {
  const DAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const out: { offset: number; completed: boolean; skipped: boolean }[] = [];
  for (let offset = -daysBack; offset <= -1; offset++) {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    if (!DEMO_HISTORY_DAYS.includes(DAY_ABBR[d.getDay()])) continue;
    const r = Math.random();
    out.push({ offset, completed: r < 0.65, skipped: r >= 0.65 && r < 0.85 });
  }
  return out;
}
