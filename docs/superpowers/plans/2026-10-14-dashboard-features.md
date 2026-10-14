# Dashboard Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Habits tab, a daily summary strip, Overdue/Inbox filters, and goal deadlines to Cracked without bloating the UI.

**Architecture:** All new numbers are pure functions over the `goals` array already held by `GoalsProvider` (`lib/habits.ts`, `lib/deadlines.ts`, `lib/selectors.ts`), unit-tested with Vitest. UI components consume them; the only schema change is a nullable `goals.due_date`.

**Tech Stack:** Next.js 14 App Router, React 18, TypeScript, Tailwind, Supabase, Vitest (new, dev-only).

**Spec:** `docs/superpowers/specs/2026-10-14-dashboard-features-design.md`

## Global Constraints

- No new UI shows without data: chips with count 0 are hidden; the chip row is hidden when Overdue and Inbox are both 0.
- Weeks are Sunday–Saturday everywhere (matches `WeekView`/`MonthView`).
- Dates are local ISO `YYYY-MM-DD` via `toISODate()` — never `toISOString()`.
- Every pure function takes `todayISO: string` as a parameter (no `new Date()` inside) so tests are deterministic.
- Habit history window: never earlier than `HISTORY_WEEKS * 7` days before today (`HISTORY_WEEKS = 20`, `lib/goals.ts`).
- Colors: use existing tokens/hex from the current palette (`#5f6577` neutral, `#f5b942` amber, `#2a2d38` border, `branchColor()`); overdue red `#f87171`.
- Only one migration: `supabase/migrations/0007_goal_due_date.sql`.
- After every task: commit with `git -c user.name="mohammed mirza" -c user.email="jkudo87@gmail.com" commit` and `git push` (user preference).

## Review Focus

1. Template whose `created_at` is today (brand-new habit) — expect current 0, best 0, no "missed" dots, no crash. → Task 1 test `brand-new habit`.
2. Month/quarter/leap-year edges in `horizonEnd` (Feb in leap year, Dec 31 quarter, Sat/Sun week boundary) — expect correct last day. → Task 2 tests.
3. Overdue must exclude habit instances (`template_id` set) and skipped/completed tasks; a task scheduled exactly today is not overdue. → Task 3 tests.
4. Supabase without migration 0007: `goal.due_date` is `undefined` (column absent) — `effectiveDeadline` must treat `undefined` like `null`. → Task 2 test `missing column`.
5. Demo mode: templates created "now" would hide all history — demo templates must be backdated so the Habits tab shows real streaks. → Task 4 verification screenshot.

---

### Task 1: Vitest setup + habit streak logic

**Files:**
- Modify: `package.json` (devDependency `vitest@2.1.9`, script `"test": "vitest run"`)
- Create: `vitest.config.ts` (alias `@` → project root, environment `node`)
- Create: `lib/habits.ts`
- Test: `lib/__tests__/habits.test.ts`

**Interfaces:**
- Consumes: `matchesRecurrence(rule, date)`, `toISODate(d)`, `HISTORY_WEEKS` from `lib/goals.ts`; `Goal` from `lib/types.ts`.
- Produces:
  ```ts
  export type HabitDayStatus = "done" | "missed" | "skipped" | "pending" | "not-due" | "future";
  export interface HabitStats {
    current: number; best: number;
    weekDone: number; weekDue: number;           // Sun–Sat week containing today
    grid: { date: string; status: HabitDayStatus }[]; // 28 days, Sunday 3 weeks back → this Saturday
    todayInstance: Goal | null;                  // instance with template_id = template.id and scheduled_date = today
  }
  export function habitStats(template: Goal, goals: Goal[], todayISO: string): HabitStats;
  ```

Fixture for all tests: template `{ id: "h", is_template: true, recurrence_rule: "mon,wed,fri", created_at: "2026-09-01T12:00:00" }`, today `"2026-10-14"` (a Wednesday). Helper `inst(date, {completed?, skipped?})` builds an instance with `template_id: "h"`.

- [ ] **Step 1: Install Vitest and write the failing tests**

`npm i -D vitest@2.1.9`; add the script and config. Tests:
```ts
test("current streak counts back over due days, today pending is neutral", () => {
  const g = [inst("2026-10-12",{completed:true}), inst("2026-10-09",{completed:true}), inst("2026-10-07",{completed:true})];
  expect(habitStats(T, g, "2026-10-14").current).toBe(3); // 10-05 has no instance → missed → stop
});
test("skipped day is neutral", () => { /* 10-09 skipped, 10-12 & 10-07 done */ expect(...current).toBe(2); });
test("today done counts", () => { /* plus inst("2026-10-14",{completed:true}) */ expect(...current).toBe(4); });
test("best streak spans an earlier run", () => {
  // done 09-14,16,18,21,23,25; nothing on 09-28; done 10-07,09,12
  expect(s.best).toBe(6); expect(s.current).toBe(3);
});
test("days before created_at are not-due, not missed", () => {
  const t = { ...T, created_at: "2026-10-07T12:00:00" };
  const s = habitStats(t, [inst("2026-10-07",{completed:true}), inst("2026-10-09",{completed:true}), inst("2026-10-12",{completed:true})], "2026-10-14");
  expect(s.current).toBe(3);
  expect(s.grid.find(d => d.date === "2026-10-05")!.status).toBe("not-due");
});
test("grid is 28 days Sunday→Saturday with correct statuses", () => {
  expect(s.grid).toHaveLength(28);
  expect(s.grid[0].date).toBe("2026-09-20"); expect(s.grid[27].date).toBe("2026-10-17");
  expect(status("2026-10-14")).toBe("pending"); expect(status("2026-10-16")).toBe("future");
  expect(status("2026-10-13")).toBe("not-due"); expect(status("2026-10-05")).toBe("missed");
});
test("week progress", () => { /* only 10-12 done */ expect([s.weekDone, s.weekDue]).toEqual([1, 3]); });
test("todayInstance", () => { /* inst on 10-14 present */ expect(s.todayInstance?.scheduled_date).toBe("2026-10-14"); });
test("brand-new habit", () => {
  const s = habitStats({ ...T, created_at: "2026-10-14T09:00:00" }, [], "2026-10-14");
  expect([s.current, s.best]).toEqual([0, 0]);
  expect(s.grid.some(d => d.status === "missed")).toBe(false);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `Cannot find module '@/lib/habits'` (or `habitStats is not a function`).

- [ ] **Step 3: Implement `habitStats` in `lib/habits.ts`**

Status per date (local ISO compare as strings): before window start (`max(created_at local date, today − HISTORY_WEEKS*7)`) or not `matchesRecurrence` → `not-due`; after today → `future`; instance completed → `done`; instance `skipped_reason` → `skipped`; date === today → `pending`; else `missed`. Current: walk due dates backward from today, skip `pending`/`skipped`, count `done`, stop at `missed`. Best: forward scan, `done` +1, `missed` resets, `skipped`/`pending` neutral; `best = max(best, current)`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS, 9 tests in `habits.test.ts`.

- [ ] **Step 5: Commit and push**

`git add package.json package-lock.json vitest.config.ts lib/habits.ts lib/__tests__/habits.test.ts` → commit `Add Vitest and habit streak calculations` → `git push`.

---

### Task 2: Deadline logic

**Files:**
- Modify: `lib/types.ts` (add `due_date?: string | null` to `Goal` — optional so rows from an un-migrated DB type-check)
- Create: `lib/deadlines.ts`
- Test: `lib/__tests__/deadlines.test.ts`

**Interfaces:**
- Consumes: `Goal`, `GoalLevel`; `toISODate`, `progressOf(goals, id)` (returns 0–1) from `lib/goals.ts`.
- Produces:
  ```ts
  export function horizonEnd(level: GoalLevel, createdAt: string): string | null;
  export function effectiveDeadline(goal: Goal): string | null;           // due_date ?? horizonEnd(...)
  export function daysUntil(deadlineISO: string, todayISO: string): number; // negative = overdue
  export function deadlineChip(goal: Goal, todayISO: string, progress: number): { label: string; overdue: boolean } | null;
  export function taskCounts(goals: Goal[], id: string): { done: number; total: number }; // descendant non-template daily tasks
  ```

- [ ] **Step 1: Write the failing tests**

```ts
test.each([
  ["yearly", "2026-03-10T12:00:00", "2026-12-31"],
  ["quarterly", "2026-02-10T12:00:00", "2026-03-31"],
  ["quarterly", "2026-04-01T12:00:00", "2026-06-30"],
  ["quarterly", "2026-11-05T12:00:00", "2026-12-31"],
  ["monthly", "2026-02-10T12:00:00", "2026-02-28"],
  ["monthly", "2028-02-10T12:00:00", "2028-02-29"],
  ["weekly", "2026-10-14T12:00:00", "2026-10-17"],
  ["weekly", "2026-10-17T12:00:00", "2026-10-17"],
  ["weekly", "2026-10-18T12:00:00", "2026-10-24"],
  ["daily", "2026-10-14T12:00:00", null],
])("horizonEnd(%s, %s) = %s", (lvl, c, e) => expect(horizonEnd(lvl, c)).toBe(e));
test("override wins", () => expect(effectiveDeadline({ ...q, due_date: "2026-05-01" })).toBe("2026-05-01"));
test("missing column", () => expect(effectiveDeadline({ ...q, due_date: undefined })).toBe("2026-03-31"));
test("daysUntil", () => { expect(daysUntil("2026-10-26","2026-10-14")).toBe(12); expect(daysUntil("2026-10-14","2026-10-14")).toBe(0); expect(daysUntil("2026-10-11","2026-10-14")).toBe(-3); });
test("deadlineChip labels", () => {
  // goal whose effective deadline is 2026-10-26 / 2026-10-14 / 2026-10-11, today 2026-10-14
  expect(chip26).toEqual({ label: "12d", overdue: false });
  expect(chip14).toEqual({ label: "today", overdue: false });
  expect(chip11).toEqual({ label: "3d over", overdue: true });
});
test("no chip for daily, completed, or 100% progress", () => { /* each → null */ });
test("taskCounts counts descendant daily non-template tasks", () => { /* tree q→m→w→{t done, t open, template} */ expect(taskCounts(g,"q")).toEqual({ done: 1, total: 2 }); });
```
`q` = quarterly goal created `"2026-02-10T12:00:00"`, `due_date: null`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- deadlines`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `lib/deadlines.ts`**

Parse `createdAt` with `new Date(createdAt)` and use local getters. `daysUntil` via `Date.UTC(y,m-1,d)` difference / 86400000 to avoid DST drift.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS (all habits + deadlines tests).

- [ ] **Step 5: Commit and push** — `Add goal deadline calculations`.

---

### Task 3: Day-view selectors

**Files:**
- Create: `lib/selectors.ts`
- Test: `lib/__tests__/selectors.test.ts`

**Interfaces:**
- Consumes: `Goal`, `toISODate`.
- Produces:
  ```ts
  export function overdueTasks(goals: Goal[], todayISO: string): Goal[];   // daily, !is_template, template_id null, scheduled_date < today, !completed, !skipped_reason; oldest first
  export function inboxTasks(goals: Goal[]): Goal[];                       // daily, !is_template, parent_id null, !completed, !skipped_reason; by scheduled_date asc, null last
  export function leftToday(goals: Goal[], todayISO: string): number;      // daily, !is_template, scheduled today, !completed, !skipped_reason
  export function comingThisWeek(goals: Goal[], todayISO: string): number; // same filter, scheduled tomorrow..this Saturday
  ```

- [ ] **Step 1: Write the failing tests** (today `"2026-10-14"`, Wed)

```ts
test("overdue: past open task, oldest first", () => expect(overdueTasks(g, T).map(x => x.id)).toEqual(["old", "yday"]));
test("overdue excludes habit instances, completed, skipped, and today", () => { /* ids "habitInst","doneOld","skippedOld","today" absent */ });
test("inbox: unlinked open tasks incl. unscheduled, null date last", () => expect(inboxTasks(g).map(x=>x.id)).toEqual([..., "unscheduled"]));
test("leftToday excludes done and skipped", () => expect(leftToday(g, T)).toBe(2));
test("comingThisWeek counts Thu–Sat only", () => expect(comingThisWeek(g, T)).toBe(2)); // 10-15, 10-17 in; 10-18 out
```

- [ ] **Step 2: Run to verify failure** — `npm test -- selectors` → FAIL, module not found.
- [ ] **Step 3: Implement `lib/selectors.ts`.**
- [ ] **Step 4: Run to verify pass** — `npm test` → all PASS.
- [ ] **Step 5: Commit and push** — `Add overdue, inbox and week selectors`.

---

### Task 4: Habits tab

**Files:**
- Create: `app/(app)/habits/page.tsx` (renders `<HabitsView />`)
- Create: `components/HabitsView.tsx`, `components/HabitCard.tsx`
- Modify: `components/BottomNav.tsx` (TABS add `{ href: "/habits", label: "Habits" }`; + on `/habits` calls `openNewGoal("daily", { recurring: true })`)
- Modify: `components/GoalsProvider.tsx` — `openNewGoal(defaultLevel?: GoalLevel, opts?: { recurring?: boolean })`; expose `newGoalRecurring: boolean`
- Modify: `components/NewGoalSheet.tsx` — on open, `setIsTemplate(newGoalRecurring)`
- Modify: `lib/mockGoals.ts` (+ `buildDemoHistory` in `lib/demoTree.ts`, which only mockGoals calls) — demo templates `created_at` = 28 days ago; `buildDemoHistory(daysBack = 27)`; add history for `email-template` (weekdays) the same way. Don't change `DEMO_TREE` nodes (they also seed real accounts).

**Interfaces:**
- Consumes: `habitStats`, `HabitStats`, `HabitDayStatus` (Task 1); `useGoals()` (`goals`, `toggleComplete`, `openNewGoal`); `branchColor`, `rootIndexOf`, `recurrenceLabel`, `todayISODate`; `TaskCheckbox` (`sizeClassName` prop).
- Produces: `HabitCard({ template, stats }: { template: Goal; stats: HabitStats })`.

Card per spec §1: title in branch color (standalone `#5f6577`), `recurrenceLabel`, "🔥 {current} · best {best}", `{weekDone}/{weekDue} this week` + bar, 7×4 dot grid — `done` filled color, `missed` 1px outline `#3b3f4f`, `skipped` outline `#f5b942`, `pending` dashed outline in branch color, `not-due`/`future` 4px faint dot `#2a2d38`. Checkbox shown when `todayInstance` and not skipped. Sort cards by `current` desc then title. Grid: `grid-cols-1 sm:grid-cols-2`, max width 900px, page padding `px-[22px]`. Empty state copy exactly: "Make any task repeat to track it as a habit." + button "New repeating task".

- [ ] **Step 1: Build components and wire nav/provider/sheet/demo data as above.**
- [ ] **Step 2: Verify** — `npm run typecheck && npm run lint && npm test`. Expected: no errors, all tests PASS.
- [ ] **Step 3: Visual check** — dev server, headless screenshots of `/habits` at 390×844 and 1280×800. Expected: two habit cards with non-zero streak/best and mixed dot grid; no horizontal overflow (`scrollWidth === innerWidth`); + opens the sheet with Repeat on.
- [ ] **Step 4: Commit and push** — `Add Habits tab with streak cards`.

---

### Task 5: Daily summary strip + Overdue/Inbox filters

**Files:**
- Create: `components/DayFilters.tsx` (summary strip + chips), `components/OverdueList.tsx`
- Modify: `components/DayView.tsx:430-570` (today only: replace Done/Left/Skipped row with `DaySummary`; chips; render list by filter)

**Interfaces:**
- Consumes: `overdueTasks`, `inboxTasks`, `leftToday`, `comingThisWeek` (Task 3); `carryToToday`, `deleteGoal`, `relink` from `useGoals()`; existing `TaskSection` in `DayView.tsx` (reuse for Inbox with `showBreadcrumb={false}` and the linking props); `formatDateLabel`.
- Produces: `type DayFilter = "today" | "overdue" | "inbox"`; `DaySummary({ left, overdue, week, onOverdue })`; `FilterChips({ value, onChange, overdue, inbox })`; `OverdueList({ items })`.

Copy exactly: "{left} left today", "{n} overdue", "{n} this week", separator " · "; omit overdue/week segments when 0; "overdue" segment is a button → filter `overdue`. Chips "Today", "Overdue {n}", "Inbox {n}". Overdue header button "Carry all to today" (awaits `carryToToday` sequentially). Overdue rows show `formatDateLabel(scheduled_date)`, "→ Today", ✕. Inbox shows date label when not today. Non-today dates: unchanged view. When the active filter's count drops to 0, fall back to `today`.

- [ ] **Step 1: Build components and wire into `DayView`.**
- [ ] **Step 2: Verify** — `npm run typecheck && npm run lint && npm test`. Expected: clean, PASS.
- [ ] **Step 3: Visual check** — screenshot `/today` at 390 and 1280; click "Overdue" chip, screenshot; click "Carry all to today", confirm overdue chip disappears and tasks appear under Today. Demo data note: demo `t3`, `t4`, `t9` are completed, so add one open past task (2 days ago, standalone, "Book the car service") to exercise Overdue — in `lib/mockGoals.ts` only, NOT `DEMO_TREE` (which also seeds real new accounts via `lib/exampleGoals.ts`).
- [ ] **Step 4: Commit and push** — `Add daily summary strip and Overdue/Inbox filters`.

---

### Task 6: Goal deadlines (migration, Map chip, detail panel)

**Files:**
- Create: `supabase/migrations/0007_goal_due_date.sql` — `alter table public.goals add column if not exists due_date date;`
- Modify: `supabase/schema.sql` (add `due_date date,` with a one-line comment in the goals table)
- Modify: `lib/actions.ts` `updateGoal` patch type → `Partial<Pick<Goal, "title" | "why_note" | "due_date">>`; also revalidate as today
- Modify: `components/GoalsProvider.tsx` `updateGoal` signature to match
- Modify: `components/GoalMap.tsx` (~line 207-300: chip next to the progress label)
- Modify: `components/GoalDetailPanel.tsx` (below progress bar: due line, `<input type="date">`, "Reset to default")
- Modify: `lib/mockGoals.ts` only — `q2` gets `due_date` 10 days from today; others default. Never in `DEMO_TREE`/`exampleGoals.ts`: inserting `due_date` for new real accounts would fail on a DB without migration 0007.

**Interfaces:**
- Consumes: `deadlineChip`, `effectiveDeadline`, `daysUntil`, `taskCounts` (Task 2); `progressOf`; `updateGoal(id, { due_date })`.

Detail panel copy exactly: "Due {Mon D} · {n} days to go · {done} of {total} tasks done" (`today` → "Due today", overdue → "{n} days overdue" in `#f87171`; `1 day` singular). Hidden for daily level. "Reset to default" only when `due_date` is set. Map chip: `text-[10px]`, rounded-full, `#f87171` text + `rgba(248,113,113,0.12)` background when overdue, else `text-ink-dim` on `rgba(255,255,255,0.06)`.

- [ ] **Step 1: Migration + schema + types/actions/provider changes.**
- [ ] **Step 2: Map chip + detail panel UI + demo due date.**
- [ ] **Step 3: Verify** — `npm run typecheck && npm run lint && npm test && npm run build`. Expected: all clean.
- [ ] **Step 4: Visual check** — screenshot `/map` at 1280 with a quarterly node focused: chip visible on nodes, panel shows due line; change date in panel → chip updates; "Reset to default" restores. 390px: no overflow.
- [ ] **Step 5: Commit and push** — `Add goal deadlines with horizon defaults`. Tell the user to run `0007_goal_due_date.sql` in the Supabase SQL editor.
