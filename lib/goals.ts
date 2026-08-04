import { Goal, GoalLevel, LEVELS } from "./types";

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

export function branchColor(rootIndex: number, palette = "Signal") {
  const hues = HUE_PALETTES[palette] ?? HUE_PALETTES.Signal;
  const hue = hues[rootIndex % hues.length];
  return `oklch(0.74 0.13 ${hue})`;
}

export function childrenOf(goals: Goal[], id: string | null) {
  return goals.filter((g) => g.parent_id === id);
}

export function roots(goals: Goal[]) {
  return goals.filter((g) => g.parent_id === null);
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
