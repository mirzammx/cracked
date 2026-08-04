import { DAY_CODES, DayCode, Goal, GoalLevel, LEVELS } from "./types";

// Layout + branch-color constants ported 1:1 from the Throughline.html
// design reference (its embedded `layout()` / `branchOf()` logic), just
// renamed from the design's short level ids (year/quarter/month/week/task)
// to the schema's level enum (yearly/quarterly/monthly/weekly/daily).
export const NODE_WIDTH_BY_DEPTH = [212, 190, 176, 168, 172];
export const COL_SPACING = 246;
export const ROW_SPACING = 76;

const HUE_PALETTES: Record<string, number[]> = {
  Signal: [155, 248, 42, 320],
  Cool: [200, 250, 285, 165],
  Warm: [42, 22, 92, 330],
};

export function branchHue(rootIndex: number, palette = "Signal") {
  const hues = HUE_PALETTES[palette] ?? HUE_PALETTES.Signal;
  return hues[rootIndex % hues.length];
}

export function branchColor(rootIndex: number, palette = "Signal") {
  return `oklch(0.74 0.13 ${branchHue(rootIndex, palette)})`;
}

export function childrenOf(goals: Goal[], id: string | null) {
  return goals.filter((g) => g.parent_id === id);
}

/**
 * Map/branch roots. Deliberately `level === "yearly"`, not
 * `parent_id === null` — standalone daily tasks also have a null
 * parent_id now, and including them here would shift every other
 * branch's color index and pull them onto the Goal Map, which they're
 * explicitly not supposed to appear on.
 */
export function roots(goals: Goal[]) {
  return goals.filter((g) => g.level === "yearly");
}

/** Goals that should never appear as Goal Map nodes: recurring generators, not real tasks. */
export function mapVisible(goals: Goal[]): Goal[] {
  return goals.filter((g) => !g.is_template);
}

export function findGoal(goals: Goal[], id: string) {
  return goals.find((g) => g.id === id);
}

/** % of a node's direct children completed, recursive up the tree. Leaf `daily` goals are 0/1. */
export function progressOf(goals: Goal[], id: string): number {
  const node = findGoal(goals, id);
  if (!node) return 0;
  if (node.level === "daily") return node.completed ? 1 : 0;
  const kids = childrenOf(goals, id);
  if (!kids.length) return 0;
  return kids.reduce((sum, k) => sum + progressOf(goals, k.id), 0) / kids.length;
}

/** Ancestor chain, root-first, excluding the node itself. */
export function chainOf(goals: Goal[], id: string): Goal[] {
  const out: Goal[] = [];
  let cur = findGoal(goals, id);
  while (cur && cur.parent_id) {
    cur = findGoal(goals, cur.parent_id);
    if (cur) out.unshift(cur);
  }
  return out;
}

export function descendantsOf(goals: Goal[], id: string, acc: string[] = []): string[] {
  for (const k of childrenOf(goals, id)) {
    acc.push(k.id);
    descendantsOf(goals, k.id, acc);
  }
  return acc;
}

/** Root index (branch number) that `id` ultimately belongs to. */
export function rootIndexOf(goals: Goal[], id: string): number {
  let cur = findGoal(goals, id);
  while (cur && cur.parent_id) cur = findGoal(goals, cur.parent_id);
  const rs = roots(goals);
  const idx = cur ? rs.findIndex((r) => r.id === cur!.id) : 0;
  return Math.max(0, idx);
}

export interface LayoutPos {
  x: number;
  y: number;
  depth: number;
}

export interface LayoutResult {
  pos: Record<string, LayoutPos>;
  width: number;
  height: number;
}

/** Tree layout: root goals stacked vertically, children fanned out to the right, capped at maxDepth. */
export function layoutGoals(goals: Goal[], maxDepth: number): LayoutResult {
  const pos: Record<string, LayoutPos> = {};
  let slot = 0;

  function place(node: Goal, depth: number): LayoutPos {
    const kids = depth < maxDepth ? childrenOf(goals, node.id) : [];
    if (!kids.length) {
      const p = { x: 20 + depth * COL_SPACING, y: 46 + slot * ROW_SPACING, depth };
      pos[node.id] = p;
      slot += 1;
      return p;
    }
    const ys = kids.map((k) => place(k, depth + 1).y);
    const p = { x: 20 + depth * COL_SPACING, y: (Math.min(...ys) + Math.max(...ys)) / 2, depth };
    pos[node.id] = p;
    return p;
  }

  const rs = roots(goals);
  rs.forEach((r, i) => {
    if (i) slot += 0.65;
    place(r, 0);
  });

  const widthCap = NODE_WIDTH_BY_DEPTH[Math.min(maxDepth, NODE_WIDTH_BY_DEPTH.length - 1)];
  return {
    pos,
    width: 40 + maxDepth * COL_SPACING + widthCap,
    height: 40 + slot * ROW_SPACING,
  };
}

export function horizonLabel(level: GoalLevel, now = new Date()): string {
  switch (level) {
    case "yearly":
      return String(now.getFullYear());
    case "quarterly":
      return `Q${Math.floor(now.getMonth() / 3) + 1}`;
    case "monthly":
      return now.toLocaleString("en-US", { month: "long" });
    case "weekly":
      return `Week ${isoWeek(now)}`;
    case "daily":
      return "Daily";
  }
}

function isoWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function childLevel(level: GoalLevel): GoalLevel | null {
  const i = LEVELS.indexOf(level);
  return i >= 0 && i < LEVELS.length - 1 ? LEVELS[i + 1] : null;
}

export function parentLevel(level: GoalLevel): GoalLevel | null {
  const i = LEVELS.indexOf(level);
  return i > 0 ? LEVELS[i - 1] : null;
}

// --- Scheduling + recurrence -------------------------------------------

/** Local-date ISO string (YYYY-MM-DD) — deliberately not toISOString(), which is UTC and can land on the wrong day. */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayISODate(): string {
  return toISODate(new Date());
}

const DAY_CODE_BY_JS_INDEX: DayCode[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

/** Whether a template's recurrence_rule is due on the given date. */
export function matchesRecurrence(rule: string, date: Date): boolean {
  const code = DAY_CODE_BY_JS_INDEX[date.getDay()];
  if (rule === "daily") return true;
  if (rule === "weekdays") return code !== "sat" && code !== "sun";
  return rule
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .includes(code);
}

const DAY_LABEL_BY_CODE: Record<string, string> = Object.fromEntries(DAY_CODES.map((d) => [d.code, d.label]));

/** Friendly label for a scheduled_date value: "Today" / "Tomorrow" / "Yesterday" / "Mon, Aug 5". */
export function formatDateLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((date.getTime() - today.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export function recurrenceLabel(rule: string | null): string {
  if (!rule) return "";
  if (rule === "daily") return "Every day";
  if (rule === "weekdays") return "Weekdays";
  return rule
    .split(",")
    .map((c) => DAY_LABEL_BY_CODE[c.trim()] ?? c.trim())
    .join(", ");
}

// --- History / Insights -------------------------------------------------

export interface DayStats {
  completed: number;
  total: number;
  /** Root index with the most completions that day, among goal-linked tasks — null if none. */
  dominantRootIndex: number | null;
}

/**
 * Per-day completion stats, keyed by scheduled_date. Standalone and
 * goal-linked tasks both count toward completed/total; only goal-linked
 * completions vote for a day's dominant branch color.
 */
export function aggregateByDate(goals: Goal[]): Record<string, DayStats> {
  const stats: Record<string, DayStats> = {};
  const branchTally: Record<string, Record<number, number>> = {};

  for (const g of goals) {
    if (g.level !== "daily" || g.is_template || !g.scheduled_date) continue;
    const day = g.scheduled_date;
    const s = (stats[day] ??= { completed: 0, total: 0, dominantRootIndex: null });
    s.total += 1;
    if (g.completed) {
      s.completed += 1;
      if (g.parent_id) {
        const idx = rootIndexOf(goals, g.id);
        const tally = (branchTally[day] ??= {});
        tally[idx] = (tally[idx] ?? 0) + 1;
      }
    }
  }

  for (const day of Object.keys(stats)) {
    const tally = branchTally[day];
    if (!tally) continue;
    let best = -1;
    let bestIdx: number | null = null;
    for (const [idxStr, count] of Object.entries(tally)) {
      if (count > best) {
        best = count;
        bestIdx = Number(idxStr);
      }
    }
    stats[day].dominantRootIndex = bestIdx;
  }

  return stats;
}

/** Sum-based score across a set of dates — NOT an average of daily percentages, which skews toward light days. */
export function periodScore(stats: Record<string, DayStats>, dates: string[]): { completed: number; total: number } {
  let completed = 0;
  let total = 0;
  for (const d of dates) {
    const s = stats[d];
    if (s) {
      completed += s.completed;
      total += s.total;
    }
  }
  return { completed, total };
}

/** ISO dates for the last N days, oldest first, inclusive of today. */
export function lastNDates(n: number): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(toISODate(d));
  }
  return out;
}
