"use client";

import { useGoals } from "./GoalsProvider";
import { branchColor, rootIndexOf, toISODate } from "@/lib/goals";
import { sideBorder } from "@/lib/uiStyle";

function yesterdayISODate(): string {
  return toISODate(new Date(Date.now() - 86400000));
}

/** Surfaces yesterday's leftover tasks with an explicit one-tap choice
 * instead of either auto-rolling them forward silently or leaving them to
 * nag forever. A task drops out of this list the instant it's resolved,
 * since both actions change the fields the filter below checks. */
export function YesterdayCarryOver() {
  const { goals, carryToToday, confirmSkip } = useGoals();
  const yesterday = yesterdayISODate();
  const leftover = goals.filter(
    (g) => g.level === "daily" && !g.is_template && g.scheduled_date === yesterday && !g.completed && !g.skipped_reason
  );

  if (!leftover.length) return null;

  return (
    <div className="mb-7">
      <div className="text-[10px] tracking-[0.12em] uppercase text-ink-ghost mb-2">Left open yesterday</div>
      {leftover.map((g) => {
        const color = g.parent_id ? branchColor(rootIndexOf(goals, g.id)) : "#5b584c";
        return (
          <div
            key={g.id}
            className="bg-card rounded-[13px] px-[15px] py-[13px] mb-[9px] flex gap-[13px] items-center"
            style={sideBorder("#2e2e25", color)}
          >
            <div className="flex-1 min-w-0 text-[15px] leading-tight text-ink">{g.title}</div>
            <button
              onClick={() => carryToToday(g.id)}
              className="flex-none text-xs text-ink-2 bg-ink-2/10 border border-border-strong rounded-full px-3 py-1.5"
              style={{ color, borderColor: color }}
            >
              Carry to today
            </button>
            <button
              onClick={() => confirmSkip(g.id, "Ran out of time", "")}
              className="flex-none text-xs text-ink-faint border border-border rounded-full px-3 py-1.5"
            >
              Skip it
            </button>
          </div>
        );
      })}
    </div>
  );
}
