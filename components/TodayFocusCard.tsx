"use client";

import { TaskCheckbox } from "./TaskCheckbox";
import { branchColor, chainOf, rootIndexOf } from "@/lib/goals";
import { Goal } from "@/lib/types";

/** A single high-contrast "up next" hero card for Today view's active
 * goal-linked task — Knot-inspired: the same "what to do next" info
 * ChainStrip used to surface as a thin breadcrumb, promoted into its own
 * prominent block. The task still appears in its normal section below;
 * this is a highlighted duplicate, not a replacement. */
export function TodayFocusCard({
  task,
  goals,
  pulsing,
  onToggle,
  onSkip,
  onOpenMap,
}: {
  task: Goal;
  goals: Goal[];
  pulsing: boolean;
  onToggle: () => void;
  onSkip: () => void;
  onOpenMap: (focusId: string) => void;
}) {
  const chain = chainOf(goals, task.id);
  const color = branchColor(rootIndexOf(goals, task.id));
  const parent = chain[chain.length - 1];

  return (
    <div
      className="mb-6 rounded-[16px] px-5 py-5"
      style={{ background: "#1e1e17", border: `1px solid ${color}`, boxShadow: `0 10px 26px -14px ${color}` }}
    >
      <div className="text-[10px] tracking-[0.12em] uppercase text-ink-ghost mb-3">Up next</div>

      {chain.length ? (
        <button
          onClick={() => onOpenMap(parent?.id ?? task.id)}
          className="mb-3 block w-full text-left text-[11px] flex flex-wrap items-center gap-1"
        >
          {chain.map((n, i) => (
            <span
              key={n.id}
              className="whitespace-nowrap"
              style={{ color, animation: pulsing ? `chainPulse 900ms ease ${i * 140}ms` : undefined }}
            >
              {n.title}
              <span className="text-ink-fog px-1">→</span>
            </span>
          ))}
        </button>
      ) : null}

      <div className="flex items-start gap-[13px]">
        <TaskCheckbox completed={task.completed} color={color} onClick={onToggle} />
        <div
          className="flex-1 min-w-0 text-[19px] leading-tight"
          style={{
            color: task.completed ? "#7d7869" : "#f7f4ec",
            textDecoration: task.completed ? "line-through" : "none",
          }}
        >
          {task.title}
        </div>
        {!task.completed ? (
          <button
            onClick={onSkip}
            className="flex-none text-xs text-ink-faint border border-border rounded-full px-3 py-1.5 mt-[3px]"
          >
            Skip
          </button>
        ) : null}
      </div>
    </div>
  );
}
