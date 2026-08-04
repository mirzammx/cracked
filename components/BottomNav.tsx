"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useGoals } from "./GoalsProvider";

export function BottomNav() {
  const pathname = usePathname();
  const { openNewGoal } = useGoals();
  const onMap = pathname?.startsWith("/map");
  const onToday = pathname?.startsWith("/today");

  return (
    <div className="flex-none px-[22px] py-[14px] pb-5 flex gap-[10px] items-center justify-center">
      <div className="flex-1 max-w-[300px] flex bg-card border border-border rounded-full p-1">
        <Link
          href="/map"
          className="flex-1 h-11 rounded-full text-[13px] flex items-center justify-center transition-colors"
          style={{ background: onMap ? "#f2efe8" : "transparent", color: onMap ? "#14140f" : "#8f8a7a" }}
        >
          Map
        </Link>
        <Link
          href="/today"
          className="flex-1 h-11 rounded-full text-[13px] flex items-center justify-center transition-colors"
          style={{ background: onToday ? "#f2efe8" : "transparent", color: onToday ? "#14140f" : "#8f8a7a" }}
        >
          Today
        </Link>
      </div>
      <button
        onClick={openNewGoal}
        aria-label="New goal"
        className="flex-none w-[52px] h-[52px] rounded-full bg-ink-2 text-canvas text-[22px] leading-none"
        style={{ boxShadow: "0 8px 22px -8px rgba(0,0,0,0.7)" }}
      >
        +
      </button>
    </div>
  );
}
