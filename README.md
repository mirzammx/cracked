# Cracked (Phase 1)

Goals and daily tasks stay visibly connected: every task on the Today
list traces back through its week → month → quarter → year, and the Goal
Map renders that whole tree as a connected, colored graph.

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
3. Sign up one user through the app once auth is live, then run
   `supabase/seed.sql` to seed that user's goals (or start empty and use
   the New Goal form).
4. Copy `.env.local.example` to `.env.local` and fill in
   `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` from
   Project Settings → API.
5. Restart `npm run dev` — the app switches from demo mode to real
   Supabase Auth + data automatically (see `lib/env.ts`).

## Structure

- `supabase/schema.sql` — the one `goals` table (self-referencing tree, RLS by `user_id`).
- `lib/goals.ts` — progress rollup, tree layout, and branch-color logic shared by the Goal Map.
- `components/GoalMap.tsx` — the pan/zoom node graph (primary screen).
- `components/TodayView.tsx`, `components/SkipSheet.tsx`, `components/NewGoalSheet.tsx` — the other three screens from the PRD.
- `lib/actions.ts` — Supabase mutations (Server Actions); demo mode short-circuits these in `components/GoalsProvider.tsx`.

## Design reference

The visual language (colors, branch-color cascade, node/edge treatment,
typography) is ported directly from `Throughline.html` — its bundle
ships the actual template and component logic as plain, readable
HTML/CSS/JS (only its asset manifest — fonts, React runtime — is
base64-encoded), so the exact values were read from there rather than
screenshotted.
