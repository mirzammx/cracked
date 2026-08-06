"use client";

import { useEffect, useState } from "react";
import { Caveat } from "next/font/google";
import { useGoals } from "./GoalsProvider";
import { branchColor, rootIndexOf, todayISODate } from "@/lib/goals";

const caveat = Caveat({ subsets: ["latin"], weight: ["600", "700"] });

const STORAGE_KEY = "cracked:stickyNoteExpanded";
const PAPER = "#f3dd8c";
const PAPER_DARK = "#4a3a1a";

function ScratchLine({ active }: { active: boolean }) {
  return (
    <svg
      className="absolute left-0 top-1/2 w-full h-[10px] pointer-events-none"
      style={{ transform: "translateY(-50%)" }}
      viewBox="0 0 100 10"
      preserveAspectRatio="none"
    >
      <path
        d="M1 5 Q 10 1, 20 5 T 40 5 T 60 5 T 80 5 T 99 5"
        fill="none"
        stroke={PAPER_DARK}
        strokeWidth={1.8}
        strokeLinecap="round"
        pathLength={1}
        style={{
          strokeDasharray: 1,
          strokeDashoffset: active ? 0 : 1,
          transition: "stroke-dashoffset 480ms cubic-bezier(0.3,0.7,0.3,1)",
        }}
      />
    </svg>
  );
}

export function StickyNote() {
  const { goals, toggleComplete } = useGoals();
  // Starts collapsed (matches the pre-mount server render) and only opens
  // if a prior session explicitly expanded it — avoids fighting with the
  // Goal Map's own detail panel for the same corner by default.
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setExpanded(window.localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  function toggle() {
    setExpanded((v) => {
      const next = !v;
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }

  const today = todayISODate();
  const due = goals.filter((g) => g.level === "daily" && !g.is_template && g.scheduled_date === today);
  const doneCount = due.filter((g) => g.completed).length;

  if (!expanded) {
    return (
      <button
        onClick={toggle}
        aria-label="Open today's sticky note"
        className={`${caveat.className} fixed top-20 right-4 z-40 w-12 h-12 rounded-[6px] flex items-center justify-center text-[15px] font-bold`}
        style={{
          background: PAPER,
          color: PAPER_DARK,
          transform: "rotate(-4deg)",
          boxShadow: "0 8px 16px -8px rgba(0,0,0,0.6)",
        }}
      >
        {doneCount}/{due.length}
      </button>
    );
  }

  return (
    <div
      className={`${caveat.className} fixed top-20 right-4 z-40 w-[230px] rounded-[3px] px-4 pb-4 pt-7`}
      style={{ background: PAPER, color: PAPER_DARK, transform: "rotate(-2deg)", boxShadow: "0 16px 32px -14px rgba(0,0,0,0.6)" }}
    >
      <div
        className="absolute -top-[10px] left-1/2 w-16 h-5"
        style={{
          background: "rgba(255,255,255,0.5)",
          transform: "translateX(-50%) rotate(-3deg)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }}
      />
      <button
        onClick={toggle}
        aria-label="Minimize sticky note"
        className="absolute top-[6px] right-[9px] text-[13px] leading-none opacity-60 hover:opacity-100"
      >
        ✕
      </button>

      <div className="text-[22px] font-bold leading-none mb-2">Today</div>

      {due.length === 0 ? (
        <div className="text-[16px] opacity-70">nothing today ✎</div>
      ) : (
        <div className="flex flex-col gap-[7px]">
          {due.map((g) => {
            const dotColor = g.parent_id ? branchColor(rootIndexOf(goals, g.id)) : PAPER_DARK;
            return (
              <button key={g.id} onClick={() => toggleComplete(g.id, !g.completed)} className="text-left flex items-start gap-[7px]">
                <span className="w-[7px] h-[7px] rounded-full mt-[8px] flex-none" style={{ background: dotColor, opacity: g.parent_id ? 1 : 0.5 }} />
                <span className="relative inline-block text-[16px] leading-[1.15]" style={{ opacity: g.completed ? 0.6 : 1 }}>
                  {g.title}
                  <ScratchLine active={g.completed} />
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
