import { Goal } from "./types";
import { toISODate, todayISODate } from "./goals";

// Demo-mode seed data — the same shape as supabase/seed.sql, kept in
// sync by hand since one is SQL and the other is a plain object literal.
// Used only when NEXT_PUBLIC_SUPABASE_URL / ANON_KEY aren't set (see lib/env.ts).

const USER_ID = "demo-user";
const NOW = new Date().toISOString();
const TODAY = todayISODate();

function offsetDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

type Seed = Pick<Goal, "id" | "parent_id" | "level" | "title" | "why_note"> &
  Partial<Omit<Goal, "id" | "parent_id" | "level" | "title" | "why_note" | "user_id" | "created_at">>;

const seed: Seed[] = [
  { id: "y1", parent_id: null, level: "yearly", title: "Build a business that outlives the job", why_note: "So my hours compound into something that is mine." },
  { id: "q1", parent_id: "y1", level: "quarterly", title: "Launch the product", why_note: "Nothing is real until strangers can pay." },
  { id: "m1", parent_id: "q1", level: "monthly", title: "Ship the MVP", why_note: "Momentum needs a finish line." },
  { id: "w1", parent_id: "m1", level: "weekly", title: "Wire up billing", why_note: "Users cannot pay for a product with no checkout." },
  { id: "t1", parent_id: "w1", level: "daily", title: "Stripe test-mode checkout", why_note: "Ship the smallest working payment path first.", scheduled_date: TODAY },
  { id: "t2", parent_id: "w1", level: "daily", title: "Pricing page copy", why_note: "People pay for what they understand.", scheduled_date: TODAY },
  { id: "t3", parent_id: "w1", level: "daily", title: "Trial expiry logic", why_note: "A trial that never ends is not a trial.", scheduled_date: offsetDate(-1), completed: true },
  { id: "w2", parent_id: "m1", level: "weekly", title: "Onboarding flow", why_note: "The first five minutes decide if they come back." },
  { id: "t4", parent_id: "w2", level: "daily", title: "First-run empty states", why_note: "A blank screen reads as broken, not new.", scheduled_date: offsetDate(-2), completed: true },
  { id: "t5", parent_id: "w2", level: "daily", title: "Welcome email sequence", why_note: "Most people never come back on their own.", scheduled_date: offsetDate(1) },
  { id: "m2", parent_id: "q1", level: "monthly", title: "First 50 real users", why_note: "Fifty honest opinions beat fifty guesses." },
  { id: "w3", parent_id: "m2", level: "weekly", title: "Ten beta calls", why_note: "Watching someone use it beats asking them about it." },
  { id: "t6", parent_id: "w3", level: "daily", title: "DM five waitlist people", why_note: "The list is worthless until it becomes conversations.", scheduled_date: TODAY },
  { id: "q2", parent_id: "y1", level: "quarterly", title: "Reach $2k monthly revenue", why_note: "Enough to buy another quarter of runway." },
  { id: "m3", parent_id: "q2", level: "monthly", title: "Landing page into a funnel", why_note: "Traffic without a funnel is just visits." },
  { id: "w4", parent_id: "m3", level: "weekly", title: "Draft the launch note", why_note: "The story has to exist before it can spread." },
  { id: "t7", parent_id: "w4", level: "daily", title: "Outline the story, not features", why_note: "Nobody forwards a changelog.", scheduled_date: offsetDate(2) },

  { id: "y2", parent_id: null, level: "yearly", title: "Be stronger at forty than at thirty", why_note: "The body is the container for everything else." },
  { id: "q3", parent_id: "y2", level: "quarterly", title: "Finish a half marathon", why_note: "A date on a calendar beats intentions." },
  { id: "m4", parent_id: "q3", level: "monthly", title: "Build the aerobic base", why_note: "Speed without a base just breaks down." },
  { id: "w5", parent_id: "m4", level: "weekly", title: "Three runs, 24km", why_note: "Consistency beats any single heroic run." },
  { id: "t8", parent_id: "w5", level: "daily", title: "Easy 6km before work", why_note: "Done before the day can talk me out of it.", scheduled_date: TODAY },
  { id: "t9", parent_id: "w5", level: "daily", title: "Hill intervals", why_note: "Strength on hills is speed everywhere else.", scheduled_date: offsetDate(-1), completed: true },
  { id: "t10", parent_id: "w5", level: "daily", title: "Long run, 12km", why_note: "The distance the race actually asks for.", scheduled_date: offsetDate(3) },
  { id: "m5", parent_id: "q3", level: "monthly", title: "Fix the sleep window", why_note: "Training without recovery is just damage." },
  { id: "w6", parent_id: "m5", level: "weekly", title: "Lights out by eleven", why_note: "Every good habit is downstream of sleep." },
  { id: "t11", parent_id: "w6", level: "daily", title: "Phone out of the bedroom", why_note: "The scroll is the thing that steals the hour.", scheduled_date: TODAY, completed: true },

  // A goal-linked recurring template: it's never itself a task, so it
  // carries no scheduled_date — the generation effect creates today's
  // instance from it (see GoalsProvider).
  { id: "run-template", parent_id: "w5", level: "daily", title: "Easy 6km run", why_note: "Base miles compound; heroics don't.", is_template: true, recurrence_rule: "mon,wed,fri" },

  { id: "y3", parent_id: null, level: "yearly", title: "Read more than I scroll", why_note: "I want my attention back before I lose the habit of depth." },
  { id: "q4", parent_id: "y3", level: "quarterly", title: "Six books, no skimming", why_note: "Depth over a longer list." },
  { id: "m6", parent_id: "q4", level: "monthly", title: "Finish the nightstand book", why_note: "One unfinished book quietly kills the next one." },
  { id: "w7", parent_id: "m6", level: "weekly", title: "Thirty pages a night", why_note: "Small and repeatable beats ambitious and rare." },
  { id: "t12", parent_id: "w7", level: "daily", title: "Thirty pages after dinner", why_note: "Same slot every night, no negotiating.", scheduled_date: TODAY },

  // Standalone recurring template: a weekday errand with no goal attached.
  { id: "email-template", parent_id: null, level: "daily", title: "Check email inbox to zero", why_note: "An overflowing inbox is a hidden task list.", is_template: true, recurrence_rule: "weekdays" },

  // Standalone one-off tasks (not linked to any goal).
  { id: "t13", parent_id: null, level: "daily", title: "Renew car registration", why_note: "It expires this week.", scheduled_date: TODAY },
  { id: "t14", parent_id: null, level: "daily", title: "Call the dentist", why_note: "Overdue for a cleaning.", scheduled_date: offsetDate(1) },
];

function withDefaults(g: Seed): Goal {
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
    ...g,
    completed_at: g.completed ? NOW : null,
  };
}

// Two backdated weeks of the "Easy 6km run" template's instances (as if
// it had already been generating for a while), mixed done/skipped/open,
// so the Insights heatmap has real variation to render.
const DAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const history: Seed[] = [];
for (let offset = -13; offset <= -1; offset++) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  if (!["Mon", "Wed", "Fri"].includes(DAY_ABBR[d.getDay()])) continue;
  const r = Math.random();
  const iso = toISODate(d);
  history.push({
    id: `run-hist-${offset}`,
    parent_id: "w5",
    level: "daily",
    title: "Easy 6km run",
    why_note: "Base miles compound; heroics don't.",
    scheduled_date: iso,
    template_id: "run-template",
    completed: r < 0.65,
    skipped_reason: r >= 0.65 && r < 0.85 ? "Ran out of time" : null,
    skipped_at: r >= 0.65 && r < 0.85 ? `${iso}T20:00:00.000Z` : null,
  });
}

export const MOCK_GOALS: Goal[] = [...seed, ...history].map(withDefaults);
