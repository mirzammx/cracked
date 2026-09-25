"use client";

import { useState } from "react";
import { useGoals } from "./GoalsProvider";
import { WeekBoardCard } from "./WeekBoardCard";
import { HISTORY_WEEKS, toISODate } from "@/lib/goals";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Sunday-start week containing `today`, shifted by `weekOffset` whole
 * weeks — same boundary HistoryView's buildGrid uses, so "this week" means
 * the same thing everywhere in the app. */
function weekDays(weekOffset: number): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + weekOffset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });
}

export function WeekBoardView() {
  const { goals, toggleComplete, openSkip, reconsider } = useGoals();
  const [weekOffset, setWeekOffset] = useState(0);
  const days = weekDays(weekOffset);
  const todayISO = toISODate(new Date());

  // Prev is clamped to the same window loadGoals() actually fetches daily
  // instances for, so navigating further back can't silently land on a
  // week that looks empty only because its data was never loaded.
  const minWeekOffset = -Math.floor(HISTORY_WEEKS - 1);

  return (
    <div className="flex-1 overflow-auto px-[22px] pb-6 pt-1 flex flex-col items-center">
      <div className="w-full max-w-[900px]">
        <div className="flex items-center justify-between py-2 pb-4">
          <button
            onClick={() => setWeekOffset((w) => Math.max(minWeekOffset, w - 1))}
            disabled={weekOffset <= minWeekOffset}
            className="text-xs text-ink-faint border border-border rounded-full px-3 py-1.5 disabled:opacity-30"
          >
            ← Prev
          </button>
          <div className="text-[13px] text-ink-dim">
            {weekOffset === 0 ? "This week" : `${MONTH_ABBR[days[0].getMonth()]} ${days[0].getDate()} – ${MONTH_ABBR[days[6].getMonth()]} ${days[6].getDate()}`}
          </div>
          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            className="text-xs text-ink-faint border border-border rounded-full px-3 py-1.5"
          >
            Next →
          </button>
        </div>

        <div className="flex gap-[10px] overflow-x-auto pb-2">
          {days.map((day) => {
            const iso = toISODate(day);
            const isToday = iso === todayISO;
            const dayGoals = goals.filter((g) => g.level === "daily" && !g.is_template && g.scheduled_date === iso);
            const active = dayGoals.filter((g) => !g.completed && !g.skipped_reason);
            const done = dayGoals.filter((g) => g.completed);
            const skipped = dayGoals.filter((g) => !g.completed && g.skipped_reason);
            const ordered = [...active, ...done, ...skipped];

            return (
              <div
                key={iso}
                className="flex-none w-[210px] rounded-[13px] flex flex-col"
                style={{
                  background: isToday ? "rgba(242,239,232,0.04)" : "transparent",
                  border: `1px solid ${isToday ? "#f2efe8" : "#2e2e25"}`,
                }}
              >
                <div className="sticky top-0 px-3 py-2.5 text-center" style={{ borderBottom: "1px solid #2e2e25" }}>
                  <div className="text-[10px] tracking-[0.12em] uppercase" style={{ color: isToday ? "#f2efe8" : "#8f8a7a" }}>
                    {DAY_LABELS[day.getDay()]}
                  </div>
                  <div className="text-[13px] text-ink-dim">
                    {MONTH_ABBR[day.getMonth()]} {day.getDate()}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto max-h-[calc(100vh-320px)] p-2">
                  {ordered.length === 0 ? (
                    <div className="text-[11px] text-ink-ghost italic px-1 py-2">Nothing scheduled</div>
                  ) : (
                    ordered.map((g) => (
                      <WeekBoardCard
                        key={g.id}
                        goal={g}
                        goals={goals}
                        onToggle={() => toggleComplete(g.id, !g.completed)}
                        onSkip={() => openSkip(g.id)}
                        onReconsider={() => reconsider(g.id)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
