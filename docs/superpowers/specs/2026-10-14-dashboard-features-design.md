# Dashboard features: habits, daily summary, overdue/inbox, goal deadlines

Date: 2026-10-14 · Status: approved in chat, pending spec review

## Intent

Bring the useful parts of a Notion "Productivity Vault" dashboard (habit
streaks, a daily summary, overdue tracking, project-style deadlines) into
Cracked **without bloat**. Guiding rules:

- No new UI appears unless it has data to show (empty-count chips are hidden).
- Reuse existing surfaces; replace rather than add rows where possible.
- Exactly one schema change (`due_date`).

Out of scope: quick-action panels, separate navigation menus, a second
calendar (Cracked's +, Map/Today tabs, and Day/Week/Month already cover these).

## 1. Habits tab

**Route:** `app/(app)/habits/page.tsx`. `BottomNav` tabs become
Map · Today · Habits (+ button unchanged; on `/habits` it opens the new-goal
sheet at level `daily` with the recurring toggle on).

**Definition:** a habit is any template row (`is_template = true`,
`recurrence_rule` set). Its history is the set of instances with
`template_id = template.id`.

**Card contents (one per template, sorted by current streak desc, then title):**
- Title in branch color (`branchColor(rootIndexOf(...))`; standalone → neutral `#5f6577`), schedule via `recurrenceLabel()`.
- Current streak 🔥 and best streak.
- This week (Sun–Sat): `doneThisWeek / dueThisWeek` with a progress bar.
- 4-week dot grid (28 days ending on the current Saturday, 7 columns Sun–Sat):
  `done` = filled branch color, `missed` = outlined, `skipped` = amber outline,
  `pending` (due today, not done) = dashed outline, `future` / `not-due` = blank.
- If today's instance exists and isn't skipped: a `TaskCheckbox` toggling it via `toggleComplete`.

**Streak rules** (pure function, `lib/habits.ts`):
- Only **due days** count (`matchesRecurrence(rule, date)`), from the template's
  `created_at` date onward, and never earlier than the loaded window
  (`HISTORY_WEEKS` = 20 weeks before today).
- Day status: instance completed → `done`; instance skipped → `skipped`;
  date is today and not done → `pending`; otherwise (no instance or incomplete) → `missed`.
- **Current streak:** walk due days backward from today; `pending` and
  `skipped` are neutral (skip over, add nothing); `done` adds 1; `missed` stops.
- **Best streak:** longest run of `done` across the window, with `skipped`
  neutral and `missed` resetting. Best ≥ current always.

**Empty state:** "Make any task repeat to track it as a habit." + button
opening the new-task sheet preset to daily + recurring.

## 2. Daily summary strip (Day view, today only)

Replaces the existing Done/Left/Skipped row when `isToday`:
**"3 left today · 2 overdue · 5 this week"**.
- *left today* = today's tasks not completed and not skipped.
- *overdue* = count from §3 (segment omitted when 0).
- *this week* = incomplete, unskipped, non-template daily tasks scheduled
  tomorrow through this Saturday (segment omitted when 0).
- Tapping "overdue" switches the filter (§3) to Overdue.

Non-today Day views keep the current Done/Left/Skipped row unchanged.

## 3. Overdue / Inbox filters (Day view, today only)

Chip row under the summary: **Today · Overdue (n) · Inbox (n)**. Today is
always shown when any other chip is; a chip with count 0 is hidden; if both
counts are 0 the whole row is hidden. Selection is local state, default Today.

- **Overdue:** `level = daily`, not template, `template_id = null`,
  `scheduled_date < today`, not completed, not skipped. Sorted oldest first.
  Row = existing task row style + "→ Today" (`carryToToday`) + delete.
  Header button "Carry all to today" (sequential `carryToToday` per task).
- **Inbox:** `level = daily`, not template, `parent_id = null`, not completed,
  not skipped, any date (including unscheduled). Uses the existing "Other
  tasks" row with the inline goal picker. Shows its date label when not today.

Habit instances are excluded from Overdue; misses surface on the Habits tab.

## 4. Goal deadlines

**Migration** `supabase/migrations/0007_goal_due_date.sql`:
`alter table public.goals add column if not exists due_date date;` and the
same column added to `supabase/schema.sql`. `Goal.due_date: string | null`.

**Effective deadline** (`lib/deadlines.ts`): `due_date ?? horizonEnd(level, created_at)`:
- yearly → Dec 31 of the created year; quarterly → last day of the created quarter;
  monthly → last day of the created month; weekly → Saturday of the created week
  (Sun-start); daily → none.

**Display:**
- Map node: small chip — `12d` (days remaining), `today`, or red `3d over`.
  Hidden for completed goals and daily level.
- `GoalDetailPanel`: "Due Mar 31 · 12 days to go · 4 of 9 tasks done"
  (descendant non-template daily tasks), a native date input to override, and
  "Reset to default" (sets `due_date = null`). Saved via a new
  `updateGoal` patch field `due_date`.
- New-goal form: unchanged.

**Compatibility:** if the migration hasn't been run, reads still work
(`select *` simply lacks the column → treated as null); saving an override
surfaces the Supabase error through the existing error path.

## Data & demo mode

- All derived numbers are pure functions over `goals` from `useGoals()`; no new fetches.
- Demo data (`lib/demoTree.ts` / `lib/mockGoals.ts`): generate past instances for
  the two demo templates over the last 4 weeks (mix of done/missed/skipped) so
  the Habits tab is populated; give one demo goal an explicit `due_date`.

## Testing

Add **Vitest** (dev dependency, `npm test`). Test-first unit tests for:
- `lib/habits.ts` — day statuses, current/best streak (pending/skipped neutral,
  missed breaks, created_at lower bound), week progress.
- `lib/deadlines.ts` — `horizonEnd` for every level incl. year/quarter edges, override, days-left/overdue.
- Overdue / Inbox / this-week selectors (`lib/selectors.ts`).

UI verified with headless-browser screenshots at 390px and 1280px, plus
`typecheck`, `lint`, `build`.
