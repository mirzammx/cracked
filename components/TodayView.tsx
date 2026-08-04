"use client";

import { useGoals } from "./GoalsProvider";
import { branchColor, chainOf, rootIndexOf } from "@/lib/goals";
import { sideBorder } from "@/lib/uiStyle";
import { Goal } from "@/lib/types";

function Crumb({ goal, goals }: { goal: Goal; goals: Goal[] }) {
  const chain = chainOf(goals, goal.id);
  return (
    <div className="text-[10px] tracking-[0.01em] text-ink-faint flex flex-wrap gap-1 items-center mb-[5px]">
      {chain.map((n, i) => (
        <span key={n.id} className="whitespace-nowrap">
          {n.title.length > 24 ? n.title.slice(0, 23) + "…" : n.title}
          {i < chain.length - 1 ? <span className="text-ink-fog px-1">→</span> : null}
        </span>
      ))}
    </div>
  );
}

export function TodayView() {
  const { goals, toggleComplete, openSkip, reconsider } = useGoals();
  const today = goals.filter((g) => g.level === "daily" && g.is_today);
  const active = today.filter((g) => !g.completed && !g.skipped_reason);
  const done = today.filter((g) => g.completed);
  const skipped = today.filter((g) => !g.completed && g.skipped_reason);

  return (
    <div className="flex-1 overflow-auto px-[22px] pb-6 pt-1 flex justify-center">
      <div className="w-full max-w-[560px]">
        <div className="flex items-baseline gap-3 py-2 pb-5">
          <div className="font-serif text-[40px] leading-none tracking-[-0.02em] text-ink-2">
            {done.length}
            <span className="text-ink-fade">/{today.length}</span>
          </div>
          <div className="text-[13px] text-ink-dim leading-relaxed text-pretty">
            closed today. Each one lights a line further up the map.
          </div>
        </div>

        {today.length === 0 ? (
          <div className="text-sm text-ink-dim">No goals marked for today yet — attach one from the map.</div>
        ) : null}

        {[...active, ...done].map((g) => {
          const color = branchColor(rootIndexOf(goals, g.id));
          return (
            <div
              key={g.id}
              className="bg-card rounded-[13px] px-[15px] py-[13px] mb-[9px] flex gap-[13px] items-start"
              style={sideBorder("#2e2e25", color)}
            >
              <button
                onClick={() => toggleComplete(g.id, !g.completed)}
                className="flex-none w-[26px] h-[26px] mt-[1px] rounded-full text-[13px] flex items-center justify-center transition-all"
                style={{
                  border: `1.5px solid ${g.completed ? color : "#3a3a2e"}`,
                  background: g.completed ? color : "transparent",
                  color: "#14140f",
                  boxShadow: g.completed ? `0 0 16px -2px ${color}` : "none",
                }}
              >
                {g.completed ? "✓" : ""}
              </button>
              <div className="flex-1 min-w-0">
                <Crumb goal={g} goals={goals} />
                <div
                  className="text-[15px] leading-tight"
                  style={{ color: g.completed ? "#7d7869" : "#f2efe8", textDecoration: g.completed ? "line-through" : "none" }}
                >
                  {g.title}
                </div>
              </div>
              {!g.completed ? (
                <button
                  onClick={() => openSkip(g.id)}
                  className="flex-none text-xs text-ink-faint border border-border rounded-full px-3 py-1.5 mt-0.5"
                >
                  Skip
                </button>
              ) : null}
            </div>
          );
        })}

        {skipped.length ? (
          <div className="mt-6">
            <div className="text-[10px] tracking-[0.12em] uppercase text-ink-ghost mb-2">Skipped today</div>
            {skipped.map((g) => {
              const color = branchColor(rootIndexOf(goals, g.id));
              return (
                <div
                  key={g.id}
                  className="rounded-[13px] px-[15px] py-[13px] mb-[9px] flex gap-[13px] items-start opacity-70"
                  style={sideBorder("#2e2e25", color)}
                >
                  <div className="flex-1 min-w-0">
                    <Crumb goal={g} goals={goals} />
                    <div className="text-[15px] leading-tight text-ink-dim">{g.title}</div>
                    <div
                      className="mt-[7px] text-[11px] rounded-[7px] px-2 py-1 inline-block"
                      style={{ color: "#c9a86a", background: "rgba(201,168,106,0.1)" }}
                    >
                      Skipped — {g.skipped_reason}
                      {g.skipped_note ? `: ${g.skipped_note}` : ""}
                    </div>
                  </div>
                  <button
                    onClick={() => reconsider(g.id)}
                    className="flex-none text-xs text-ink-faint border border-border rounded-full px-3 py-1.5 mt-0.5"
                  >
                    Reconsider
                  </button>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
