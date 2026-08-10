"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useGoals } from "./GoalsProvider";

const TABS = [
  { href: "/map", label: "Map" },
  { href: "/today", label: "Today" },
  { href: "/history", label: "History" },
];

export function BottomNav() {
  const pathname = usePathname();
  const { openNewGoal } = useGoals();

  return (
    <div className="flex-none px-[22px] py-[14px] pb-5 flex gap-[10px] items-center justify-center">
      <div className="flex-1 max-w-[360px] flex bg-card border border-border rounded-full p-1">
        {TABS.map((t) => {
          const active = pathname?.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className="flex-1 h-11 rounded-full text-[13px] flex items-center justify-center transition-colors"
              style={{ background: active ? "#f2efe8" : "transparent", color: active ? "#14140f" : "#8f8a7a" }}
            >
              {t.label}
            </Link>
          );
        })}
      </div>
      <button
        onClick={() => openNewGoal(pathname?.startsWith("/today") ? "daily" : "quarterly")}
        aria-label="New goal"
        className="flex-none w-[52px] h-[52px] rounded-full bg-ink-2 text-canvas text-[22px] leading-none"
        style={{ boxShadow: "0 8px 22px -8px rgba(0,0,0,0.7)" }}
      >
        +
      </button>
    </div>
  );
}
