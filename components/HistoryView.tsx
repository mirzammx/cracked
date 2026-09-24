"use client";

import { useMemo, useState } from "react";
import { useGoals } from "./GoalsProvider";
import {
  aggregateByDate,
  branchColor,
  branchHue,
  chainOf,
  formatDateLabel,
  HISTORY_WEEKS,
  lastNDates,
  periodScore,
  rootIndexOf,
  toISODate,
  todayISODate,
} from "@/lib/goals";
import { sideBorder } from "@/lib/uiStyle";
import { Goal } from "@/lib/types";

const WEEKS = HISTORY_WEEKS;
const DAY_ROW_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];
const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function buildGrid(weeks: number): Date[][] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + (6 - today.getDay()));
  const start = new Date(endOfWeek);
  start.setDate(endOfWeek.getDate() - weeks * 7 + 1);

  const cols: Date[][] = [];
  for (let w = 0; w < weeks; w++) {
    const col: Date[] = [];
    for (let d = 0; d < 7; d++) {
      const day = new Date(start);
      day.setDate(start.getDate() + w * 7 + d);
      col.push(day);
    }
    cols.push(col);
  }
  return cols;
}

const NO_DATA_COLOR = "#2a2a22";

function cellColor(score: number, hue: number): string {
  // Floor kept well above NO_DATA_COLOR's lightness so a real 0%-score day
  // never gets mistaken for "nothing was scheduled" at a glance.
  const L = 0.32 + score * 0.4;
  const C = 0.05 + score * 0.15;
  return `oklch(${L.toFixed(3)} ${C.toFixed(3)} ${hue})`;
}

function StatChip({ label, completed, total }: { label: string; completed: number; total: number }) {
  const pct = total ? Math.round((completed / total) * 100) : null;
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 flex-1 min-w-[140px]">
      <div className="text-[10px] tracking-[0.12em] uppercase text-ink-ghost mb-1">{label}</div>
      <div className="flex items-baseline gap-2">
        <div className="font-serif text-2xl text-ink-2">
          {completed}
          <span className="text-ink-fade">/{total}</span>
        </div>
        <div className="text-xs text-ink-dim">{pct === null ? "—" : `${pct}%`}</div>
      </div>
    </div>
  );
}

export function HistoryView() {
  const { goals, toggleComplete, openSkip, reconsider } = useGoals();
  const [selected, setSelected] = useState(todayISODate());
  const today = todayISODate();

  const stats = useMemo(() => aggregateByDate(goals), [goals]);
  const grid = useMemo(() => buildGrid(WEEKS), []);

  const thisWeek = useMemo(() => periodScore(stats, lastNDates(7)), [stats]);
  const thisMonth = useMemo(() => periodScore(stats, lastNDates(30)), [stats]);

  const dayGoals = goals.filter(
    (g) => g.level === "daily" && !g.is_template && g.scheduled_date === selected
  );
  const dayGoalTasks = dayGoals.filter((g) => g.parent_id !== null);
  const dayOtherTasks = dayGoals.filter((g) => g.parent_id === null);

  let monthCursor = -1;

  return (
    <div className="flex-1 overflow-auto px-[22px] pb-6 pt-1 flex justify-center">
      <div className="w-full max-w-[720px]">
        <div className="py-2 pb-5">
          <div className="font-serif text-[28px] leading-tight text-ink-2 mb-1">Insights</div>
          <div className="text-[13px] text-ink-dim leading-relaxed text-pretty">
            Shaded by completion rate — not an average of daily percentages, so a light day doesn&apos;t outweigh a busy one.
          </div>
        </div>

        <div className="flex gap-3 mb-6 flex-wrap">
          <StatChip label="Last 7 days" completed={thisWeek.completed} total={thisWeek.total} />
          <StatChip label="Last 30 days" completed={thisMonth.completed} total={thisMonth.total} />
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="inline-flex gap-[3px]" style={{ minWidth: WEEKS * 17 }}>
            <div className="flex flex-col gap-[3px] mr-1 pt-[18px]">
              {DAY_ROW_LABELS.map((l, i) => (
                <div key={i} className="h-[14px] text-[9px] leading-[14px] text-ink-ghost text-right pr-1 w-8">
                  {l}
                </div>
              ))}
            </div>
            {grid.map((col, ci) => {
              const firstDay = col[0];
              const month = firstDay.getMonth();
              const showLabel = month !== monthCursor;
              const label = showLabel ? MONTH_ABBR[month] : "";
              if (showLabel) monthCursor = month;
              return (
                <div key={ci} className="flex flex-col gap-[3px]">
                  <div className="h-[14px] text-[9px] text-ink-ghost">{label}</div>
                  {col.map((date, di) => {
                    const iso = toISODate(date);
                    const isFuture = iso > today;
                    const s = stats[iso];
                    const isSelected = iso === selected;
                    if (isFuture) {
                      return <div key={di} className="w-[14px] h-[14px] rounded-[3px]" style={{ background: "transparent" }} />;
                    }
                    const hue = s && s.dominantRootIndex !== null ? branchHue(s.dominantRootIndex) : 155;
                    const score = s && s.total > 0 ? s.completed / s.total : null;
                    const bg = score === null ? NO_DATA_COLOR : cellColor(score, hue);
                    return (
                      <button
                        key={di}
                        onClick={() => setSelected(iso)}
                        title={`${date.toDateString()} — ${s ? `${s.completed}/${s.total}` : "no tasks"}`}
                        className="w-[14px] h-[14px] rounded-[3px] transition-transform hover:scale-125"
                        style={{
                          background: bg,
                          outline: isSelected ? "1.5px solid #f2efe8" : "1px solid rgba(255,255,255,0.05)",
                          outlineOffset: 1,
                        }}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3 mb-8 text-[10px] text-ink-ghost">
          <span>Less</span>
          {[0, 0.25, 0.5, 0.75, 1].map((s) => (
            <span key={s} className="w-[12px] h-[12px] rounded-[3px]" style={{ background: cellColor(s, 155) }} />
          ))}
          <span>More</span>
          <span className="w-[12px] h-[12px] rounded-[3px] ml-3" style={{ background: NO_DATA_COLOR, border: "1px solid rgba(255,255,255,0.05)" }} />
          <span>No tasks scheduled</span>
        </div>

        <div className="border-t border-border pt-5">
          <div className="text-[10px] tracking-[0.12em] uppercase text-ink-ghost mb-3">{formatDateLabel(selected)}</div>
          {dayGoals.length === 0 ? (
            <div className="text-sm text-ink-dim">Nothing scheduled this day.</div>
          ) : (
            <>
              {dayGoalTasks.map((g) => (
                <DayRow key={g.id} goal={g} goals={goals} showBreadcrumb onToggle={toggleComplete} onSkip={openSkip} onReconsider={reconsider} />
              ))}
              {dayOtherTasks.map((g) => (
                <DayRow key={g.id} goal={g} goals={goals} showBreadcrumb={false} onToggle={toggleComplete} onSkip={openSkip} onReconsider={reconsider} />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function DayRow({
  goal,
  goals,
  showBreadcrumb,
  onToggle,
  onSkip,
  onReconsider,
}: {
  goal: Goal;
  goals: Goal[];
  showBreadcrumb: boolean;
  onToggle: (id: string, completed: boolean) => void;
  onSkip: (id: string) => void;
  onReconsider: (id: string) => void;
}) {
  const chain = showBreadcrumb ? chainOf(goals, goal.id) : [];
  const color = showBreadcrumb ? branchColor(rootIndexOf(goals, goal.id)) : "#5b584c";

  return (
    <div className="rounded-[12px] px-[13px] py-[11px] mb-[7px] flex gap-3 items-start bg-card" style={sideBorder("#2e2e25", color)}>
      <button
        onClick={() => onToggle(goal.id, !goal.completed)}
        className="flex-none w-[22px] h-[22px] mt-[1px] rounded-full text-[11px] flex items-center justify-center"
        style={{
          border: `1.5px solid ${goal.completed ? color : "#3a3a2e"}`,
          background: goal.completed ? color : "transparent",
          color: "#14140f",
        }}
      >
        {goal.completed ? "✓" : ""}
      </button>
      <div className="flex-1 min-w-0">
        {chain.length ? (
          <div className="text-[10px] text-ink-faint mb-[3px]">{chain.map((c) => c.title).join(" → ")}</div>
        ) : null}
        <div
          className="text-[14px] leading-tight"
          style={{ color: goal.completed ? "#7d7869" : "#f2efe8", textDecoration: goal.completed ? "line-through" : "none" }}
        >
          {goal.title}
        </div>
        {goal.skipped_reason ? (
          <div className="mt-[5px] text-[11px] rounded-[7px] px-2 py-1 inline-block" style={{ color: "#c9a86a", background: "rgba(201,168,106,0.1)" }}>
            Skipped — {goal.skipped_reason}
          </div>
        ) : null}
      </div>
      {!goal.completed && !goal.skipped_reason ? (
        <button onClick={() => onSkip(goal.id)} className="flex-none text-xs text-ink-faint border border-border rounded-full px-3 py-1.5">
          Skip
        </button>
      ) : null}
      {goal.skipped_reason ? (
        <button onClick={() => onReconsider(goal.id)} className="flex-none text-xs text-ink-faint border border-border rounded-full px-3 py-1.5">
          Reconsider
        </button>
      ) : null}
    </div>
  );
}
