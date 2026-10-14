"use client";

import { TaskCheckbox } from "./TaskCheckbox";
import { useContextMenu } from "./ContextMenu";
import { branchColor, rootIndexOf } from "@/lib/goals";
import { sideBorder } from "@/lib/uiStyle";
import { Goal } from "@/lib/types";

/** Compact version of Today's TaskRow for a narrow Week Board column — same
 * checkbox, same coloring, but without the breadcrumb/"link to a goal"
 * affordance (no room for it here, and it's already available from
 * Today/Map). All seven columns share one frame, so they're narrow at every
 * width: controls sit on a row above the title, which gets the full card
 * width. */
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
  const color = goal.parent_id ? branchColor(rootIndexOf(goals, goal.id)) : "#5f6577";
  const skipped = !goal.completed && !!goal.skipped_reason;
  const { openMenu, node: contextMenuNode } = useContextMenu();

  return (
    <div
      className="bg-card rounded-[9px] sm:rounded-[11px] px-[3px] py-1 sm:px-[10px] sm:py-[9px] mb-1 sm:mb-[7px] flex flex-col gap-[5px] sm:gap-[7px]"
      style={{ ...sideBorder("#2a2d38", color), opacity: skipped ? 0.7 : 1 }}
      onContextMenu={(e) => openMenu(e, onDelete)}
    >
      {contextMenuNode}
      <div className="flex items-center gap-[2px] sm:gap-1">
        {!skipped ? <TaskCheckbox completed={goal.completed} color={color} onClick={onToggle} sizeClassName="w-4 h-4 sm:w-5 sm:h-5" /> : null}
        <div className="flex-1" />
        {/* Skip needs room; on phone-width columns it stays in Day view. */}
        {!goal.completed && !skipped ? (
          <button
            onClick={onSkip}
            className="hidden sm:block flex-none text-[10px] text-ink-faint border border-border rounded-full px-2 py-0.5"
          >
            Skip
          </button>
        ) : null}
        <button
          onClick={onDelete}
          aria-label="Delete task"
          className="flex-none text-ink-faint hover:text-red-400 text-[10px] sm:text-xs leading-none sm:px-1"
        >
          ✕
        </button>
      </div>
      <div className="min-w-0">
        <div
          className="text-[10.5px] sm:text-[13px] leading-tight break-words"
          style={{ color: goal.completed ? "#868c9e" : "#f5f6fa", textDecoration: goal.completed ? "line-through" : "none" }}
        >
          {goal.title}
        </div>
        {skipped ? (
          <button
            onClick={onReconsider}
            className="mt-[6px] max-w-full text-[9px] sm:text-[10px] rounded-[6px] px-0.5 sm:px-1.5 py-0.5 inline-block"
            style={{ color: "#f5b942", background: "rgba(245,185,66,0.12)" }}
          >
            Skipped<span className="hidden sm:inline"> →</span>
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
    </div>
  );
}
