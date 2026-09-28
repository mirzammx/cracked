"use client";

import { TaskCheckbox } from "./TaskCheckbox";
import { branchColor, rootIndexOf } from "@/lib/goals";
import { sideBorder } from "@/lib/uiStyle";
import { Goal } from "@/lib/types";

/** Compact version of Today's TaskRow for a narrow Week Board column — same
 * checkbox, same coloring, but without the breadcrumb/"link to a goal"
 * affordance (no room for it here, and it's already available from
 * Today/Map). */
export function WeekBoardCard({
  goal,
  goals,
  showCarry,
  onToggle,
  onSkip,
  onReconsider,
  onCarryToToday,
  onDelete,
}: {
  goal: Goal;
  goals: Goal[];
  /** True when this card is on a past, non-today column — the carry-forward
   * mechanic now lives here as a direct tap, replacing the old separate
   * "yesterday's leftovers" prompt. */
  showCarry: boolean;
  onToggle: () => void;
  onSkip: () => void;
  onReconsider: () => void;
  onCarryToToday: () => void;
  onDelete: () => void;
}) {
  const color = goal.parent_id ? branchColor(rootIndexOf(goals, goal.id)) : "#5b584c";
  const skipped = !goal.completed && !!goal.skipped_reason;

  return (
    <div
      className="bg-card rounded-[11px] px-[11px] py-[10px] mb-[7px] flex gap-[9px] items-start"
      style={{ ...sideBorder("#2e2e25", color), opacity: skipped ? 0.7 : 1 }}
    >
      {!skipped ? <TaskCheckbox completed={goal.completed} color={color} onClick={onToggle} /> : null}
      <div className="flex-1 min-w-0">
        <div
          className="text-[13px] leading-tight"
          style={{ color: goal.completed ? "#7d7869" : "#f2efe8", textDecoration: goal.completed ? "line-through" : "none" }}
        >
          {goal.title}
        </div>
        {skipped ? (
          <button
            onClick={onReconsider}
            className="mt-[6px] text-[10px] rounded-[6px] px-1.5 py-0.5 inline-block"
            style={{ color: "#c9a86a", background: "rgba(201,168,106,0.1)" }}
          >
            Skipped →
          </button>
        ) : null}
        {showCarry && !goal.completed && !skipped ? (
          <button
            onClick={onCarryToToday}
            className="mt-[6px] text-[10px] text-ink-faint underline decoration-dotted underline-offset-4"
          >
            → Today
          </button>
        ) : null}
      </div>
      {!goal.completed && !skipped ? (
        <button onClick={onSkip} className="flex-none text-[10px] text-ink-faint border border-border rounded-full px-2 py-1 mt-0.5">
          Skip
        </button>
      ) : null}
      <button
        onClick={onDelete}
        aria-label="Delete task"
        className="flex-none text-ink-faint hover:text-red-400 text-xs leading-none px-1 mt-0.5"
      >
        ✕
      </button>
    </div>
  );
}
