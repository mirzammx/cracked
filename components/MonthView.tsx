"use client";

import { useMemo, useState } from "react";
import { useGoals } from "./GoalsProvider";
import { aggregateByDate, branchHue, HISTORY_WEEKS, lastNDates, periodScore, toISODate, todayISODate } from "@/lib/goals";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const NO_DATA_COLOR = "#2a2a22";

function cellColor(score: number, hue: number): string {
  // Floor kept well above NO_DATA_COLOR's lightness so a real 0%-score day
  // never gets mistaken for "nothing was scheduled" at a glance.
  const L = 0.32 + score * 0.4;
  const C = 0.05 + score * 0.15;
  return `oklch(${L.toFixed(3)} ${C.toFixed(3)} ${hue})`;
}

/** A real calendar month grid (Google Calendar style) — Sun-start weeks,
 * padded with the leading/trailing days of adjacent months so every row is
 * a full 7 days. Different shape from a rolling N-week heatmap strip. */
function buildMonthGrid(monthDate: Date): Date[] {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const start = new Date(firstOfMonth);
  start.setDate(firstOfMonth.getDate() - firstOfMonth.getDay());

  const lastOfMonth = new Date(year, month + 1, 0);
  const end = new Date(lastOfMonth);
  end.setDate(lastOfMonth.getDate() + (6 - lastOfMonth.getDay()));

  const days: Date[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
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

export function MonthView({ focusDate, onZoomToDay }: { focusDate: string; onZoomToDay: (iso: string) => void }) {
  const { goals } = useGoals();
  const [monthOffset, setMonthOffset] = useState(0);
  const today = todayISODate();

  const anchor = new Date(focusDate + "T00:00:00");
  const anchorYear = anchor.getFullYear();
  const anchorMonth = anchor.getMonth();
  const monthDate = new Date(anchorYear, anchorMonth + monthOffset, 1);
  const gridYear = monthDate.getFullYear();
  const gridMonth = monthDate.getMonth();
  const grid = useMemo(() => buildMonthGrid(new Date(gridYear, gridMonth, 1)), [gridYear, gridMonth]);
  const stats = useMemo(() => aggregateByDate(goals), [goals]);

  const thisWeek = useMemo(() => periodScore(stats, lastNDates(7)), [stats]);
  const thisMonth = useMemo(() => periodScore(stats, lastNDates(30)), [stats]);

  // Approximate clamp matching the same HISTORY_WEEKS fetch window Week
  // view clamps against — a month grid further back than this would look
  // empty only because the data was never loaded, not because it's empty.
  const minMonthOffset = -Math.floor((HISTORY_WEEKS * 7) / 30);

  return (
    <div className="flex-1 overflow-auto px-[22px] pb-6 pt-1 flex justify-center">
      <div className="w-full max-w-[720px]">
        <div className="flex items-center justify-between py-2 pb-4">
          <button
            onClick={() => setMonthOffset((m) => Math.max(minMonthOffset, m - 1))}
            disabled={monthOffset <= minMonthOffset}
            className="text-xs text-ink-faint border border-border rounded-full px-3 py-1.5 disabled:opacity-30"
          >
            ← Prev
          </button>
          <div className="font-serif text-[20px] text-ink-2">
            {MONTH_NAMES[monthDate.getMonth()]} {monthDate.getFullYear()}
          </div>
          <button
            onClick={() => setMonthOffset((m) => m + 1)}
            className="text-xs text-ink-faint border border-border rounded-full px-3 py-1.5"
          >
            Next →
          </button>
        </div>

        <div className="grid grid-cols-7 gap-[3px] sm:gap-1 mb-1">
          {DAY_LABELS.map((l) => (
            <div key={l} className="text-[9px] sm:text-[10px] text-ink-ghost text-center uppercase tracking-[0.08em]">
              {l}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-[3px] sm:gap-1">
          {grid.map((date, i) => {
            const iso = toISODate(date);
            const inMonth = date.getMonth() === monthDate.getMonth();
            const isToday = iso === today;
            const isSelected = iso === focusDate;
            const isFuture = iso > today;
            const s = stats[iso];
            const hue = s && s.dominantRootIndex !== null ? branchHue(s.dominantRootIndex) : 155;
            const score = s && s.total > 0 ? s.completed / s.total : null;
            const bg = isFuture ? "transparent" : score === null ? NO_DATA_COLOR : cellColor(score, hue);

            return (
              <button
                key={i}
                onClick={() => onZoomToDay(iso)}
                className="aspect-square rounded-[8px] flex flex-col items-start justify-between p-1 sm:p-1.5"
                style={{
                  background: bg,
                  outline: isSelected ? "1.5px solid #f2efe8" : isToday ? "1.5px solid rgba(242,239,232,0.4)" : "1px solid rgba(255,255,255,0.05)",
                  outlineOffset: -1,
                  opacity: inMonth ? 1 : 0.35,
                }}
              >
                <span className="text-[10px] sm:text-[11px] text-ink-dim">{date.getDate()}</span>
                {s && s.total > 0 ? (
                  <span className="text-[8px] sm:text-[9px] text-ink-ghost">
                    {s.completed}/{s.total}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 mt-4 mb-6 text-[10px] text-ink-ghost">
          <span>Less</span>
          {[0, 0.25, 0.5, 0.75, 1].map((s) => (
            <span key={s} className="w-[12px] h-[12px] rounded-[3px]" style={{ background: cellColor(s, 155) }} />
          ))}
          <span>More</span>
          <span className="w-[12px] h-[12px] rounded-[3px] ml-3" style={{ background: NO_DATA_COLOR, border: "1px solid rgba(255,255,255,0.05)" }} />
          <span>No tasks scheduled</span>
        </div>

        <div className="flex gap-3 flex-wrap">
          <StatChip label="Last 7 days" completed={thisWeek.completed} total={thisWeek.total} />
          <StatChip label="Last 30 days" completed={thisMonth.completed} total={thisMonth.total} />
        </div>
      </div>
    </div>
  );
}
