"use client";

import { useState } from "react";

/** The single checkbox affordance shared by Today view, the Week Board, and
 * the sticky note — one place to redesign so all three surfaces stay
 * visually consistent. Filled color + a checkmark that draws itself in
 * (app/globals.css's `drawIn` keyframe, the same one GoalMap uses for its
 * edges) plus a tap bounce (`checkBounce`), restarted via boolean state +
 * timeout rather than remounting, matching GoalsProvider's justAddedId /
 * justCompletedId idiom elsewhere in the app. */
export function TaskCheckbox({
  completed,
  color,
  onClick,
  sizeClassName = "w-[26px] h-[26px]",
}: {
  completed: boolean;
  color: string;
  onClick: () => void;
  /** Tailwind width/height classes — the Week Board's narrow columns use a smaller, responsive size. */
  sizeClassName?: string;
}) {
  const [bouncing, setBouncing] = useState(false);

  function handleClick() {
    setBouncing(true);
    window.setTimeout(() => setBouncing(false), 340);
    onClick();
  }

  return (
    <button
      onClick={handleClick}
      aria-pressed={completed}
      className={`flex-none ${sizeClassName} mt-[1px] rounded-full flex items-center justify-center transition-all`}
      style={{
        border: `1.5px solid ${completed ? color : "#3b3f4f"}`,
        background: completed ? color : "transparent",
        boxShadow: completed ? `0 0 16px -2px ${color}` : "none",
        animation: bouncing ? "checkBounce 340ms cubic-bezier(0.34,1.56,0.64,1)" : "none",
      }}
    >
      <svg width="13" height="13" viewBox="0 0 13 13" aria-hidden>
        <path
          d="M2.6 6.8 L5.3 9.4 L10.3 3.6"
          fill="none"
          stroke="#0e0f13"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          style={{
            opacity: completed ? 1 : 0,
            strokeDasharray: 1,
            strokeDashoffset: completed ? 0 : 1,
            transition: "opacity 100ms",
            animation: completed ? "drawIn 320ms cubic-bezier(0.3,0.7,0.3,1) 40ms" : "none",
          }}
        />
      </svg>
    </button>
  );
}
