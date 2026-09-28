"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DayView } from "./DayView";
import { WeekView } from "./WeekView";
import { MonthView } from "./MonthView";
import { todayISODate } from "@/lib/goals";

type Zoom = "day" | "week" | "month";
const ZOOMS: { key: Zoom; label: string }[] = [
  { key: "day", label: "Day" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
];

/** One page, one Day/Week/Month zoom control — replaces the separate
 * Today/Week/History routes. Switching zoom levels crossfades+scales the
 * whole grid (Framer Motion) instead of a jarring screen swap; it's a
 * scale+fade crossfade, not a true per-cell shared-element morph. */
export function CalendarView() {
  const [zoom, setZoom] = useState<Zoom>("day");
  const [focusDate, setFocusDate] = useState(todayISODate());

  function zoomToDay(iso: string) {
    setFocusDate(iso);
    setZoom("day");
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-none flex justify-center px-[22px] pt-2 pb-1">
        <div className="flex bg-card/90 border border-border-strong rounded-full p-[3px] backdrop-blur">
          {ZOOMS.map((z) => {
            const active = zoom === z.key;
            return (
              <button
                key={z.key}
                onClick={() => setZoom(z.key)}
                className="min-w-[64px] h-[30px] rounded-full text-[11px] transition-colors"
                style={{ background: active ? "#f2efe8" : "transparent", color: active ? "#14140f" : "#8f8a7a" }}
              >
                {z.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 min-h-0 relative">
        <AnimatePresence>
          <motion.div
            key={zoom}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.03 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="absolute inset-0 flex flex-col"
          >
            {zoom === "day" ? (
              <DayView date={focusDate} />
            ) : zoom === "week" ? (
              <WeekView focusDate={focusDate} onZoomToDay={zoomToDay} />
            ) : (
              <MonthView focusDate={focusDate} onZoomToDay={zoomToDay} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
