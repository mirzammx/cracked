# Cracked

Goals and daily tasks stay visibly connected: every task on the Today
list traces back through its week → month → quarter → year, and the Goal
Map renders that whole tree as a connected, colored graph.

**Phase 1:** Goal Map, Today View, Skip flow, New Goal form, magic-link auth.
**Phase 2:** task scheduling (`scheduled_date`), standalone tasks,
recurring templates, History/Insights heatmap.
**Phase 3:** open signup + RLS-enforced multi-user auth, onboarding
example data on first sign-in, sticky-note widget. See
`supabase/migrations/0002_scheduling_templates_history.sql`,
`0003_invite_only_and_onboarding.sql`, and `0006_open_signup.sql` (which
removes the invite list `0003` added) for the schema diffs.

## Stack

Next.js 14 (App Router) + TypeScript + Tailwind, Supabase (Postgres + Auth).

## Getting started

```bash
npm install
npm run dev
```

Runs immediately in **demo mode** (seed data from `lib/mockGoals.ts`, no
login, nothing persists) so the UI is inspectable with zero setup.

## Connecting Supabase

1. Create a project at supabase.com.
2. Run `supabase/schema.sql` against it (SQL Editor, or `supabase db push`).
   Signup is open to anyone with a valid email — there's no invite list.
3. Copy `.env.local.example` to `.env.local` and fill in
   `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` from
   Project Settings → API.
4. **Before real people sign in:** configure custom SMTP under Project
   Settings → Auth → SMTP Settings. Supabase's built-in email sender is
   aggressively rate-limited and not meant for production traffic —
   magic links will start failing once more than a person or two tries
   to sign in.
5. Also set **Authentication → URL Configuration**'s Site URL and
   Redirect URLs to your real deployed domain — magic links silently
   fall back to whatever Site URL is configured if the requested
   redirect isn't on that allow-list.
6. Restart `npm run dev` — the app switches from demo mode to real
   Supabase Auth + data automatically (see `lib/env.ts`). Each new
   account gets a small tagged (`is_example = true`) walkthrough goal
   tree on first sign-in — see `lib/exampleGoals.ts`.
7. `supabase/seed.sql` is optional and separate from the above — it's
   the old single-account demo tree (now also used as `lib/mockGoals.ts`
   for zero-setup demo mode), not part of the onboarding flow.

## Structure

- `supabase/schema.sql` — the one `goals` table (self-referencing tree, RLS by `user_id`).
- `lib/goals.ts` — progress rollup, tree layout, branch-color, recurrence, and history-aggregation logic shared across screens.
- `components/GoalMap.tsx` — the pan/zoom node graph (primary screen). Templates never appear here (`mapVisible()` filters them out).
- `components/TodayView.tsx` — filters by `scheduled_date`, split into "Goal tasks" (breadcrumbed) and "Other tasks" (standalone).
- `components/SkipSheet.tsx`, `components/NewGoalSheet.tsx` — skip flow and goal/task creation, including the recurring-template toggle.
- `components/RecurringSheet.tsx` — manage existing templates (edit recurrence, delete); opened via "Recurring →" on Today.
- `components/HistoryView.tsx` — the Insights heatmap, with click-to-drill-down into any day's task list.
- `lib/actions.ts` — Supabase mutations (Server Actions), including `ensureTodaysInstances()` (generates due templates' instances, called from `app/(app)/layout.tsx` on every request). Demo mode short-circuits all of this client-side in `components/GoalsProvider.tsx`.
- `components/StickyNote.tsx` — persistent top-right widget showing today's tasks (goal + standalone combined); collapsed by default (localStorage-remembered) so it doesn't fight the Goal Map's own detail panel for the same corner.
- `app/login/actions.ts` — sends the magic link via `supabase.auth.signInWithOtp()`. Signup is open; there's no invite check.
- `app/auth/callback/route.ts` — on first sign-in (`user_metadata.onboarded` unset), seeds `lib/exampleGoals.ts`'s tree and marks the account onboarded.

## Design reference

The visual language (colors, branch-color cascade, node/edge treatment,
typography) is ported directly from `Throughline.html` — its bundle
ships the actual template and component logic as plain, readable
HTML/CSS/JS (only its asset manifest — fonts, React runtime — is
base64-encoded), so the exact values were read from there rather than
screenshotted.
