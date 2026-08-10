"use client";

import { useRouter } from "next/navigation";
import { branchColor, roots } from "@/lib/goals";
import { signOut } from "@/lib/actions";
import { useGoals } from "./GoalsProvider";
import { Logo } from "./Logo";

export function Header() {
  const { goals, focusId, setFocusId, demoMode } = useGoals();
  const router = useRouter();
  const rs = roots(goals);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  return (
    <div className="flex-none px-[22px] pt-5 pb-3 flex items-center justify-between gap-4">
      <div className="flex-none flex items-baseline gap-[9px] whitespace-nowrap">
        <div className="flex items-center gap-[7px]">
          <Logo size={22} />
          <div className="font-serif text-[25px] tracking-[-0.01em] text-ink-2">Cracked</div>
        </div>
        <div className="text-[10px] tracking-[0.14em] uppercase text-ink-ghost whitespace-nowrap">{today}</div>
        {demoMode ? (
          <div className="text-[10px] tracking-[0.1em] uppercase text-amber/80 border border-amber/30 rounded-full px-2 py-[3px] whitespace-nowrap">
            Demo data
          </div>
        ) : null}
      </div>
      {/* overflow-x-auto (not flex-wrap) keeps this a single, predictable-height
          row even with many root goals — StickyNote's fixed top offset assumes
          the header never grows taller than one line. */}
      <div className="flex-1 min-w-0 flex gap-[7px] overflow-x-auto">
        {rs.map((r, i) => {
          const color = branchColor(i);
          const active = focusId === r.id;
          const short = r.title.length > 16 ? r.title.slice(0, 15).replace(/\s+\S*$/, "") + "…" : r.title;
          return (
            <button
              key={r.id}
              onClick={() => {
                setFocusId(active ? null : r.id);
                router.push("/map");
              }}
              className="flex-none whitespace-nowrap flex items-center gap-[7px] rounded-full px-[11px] py-[6px] text-[11px] transition-all"
              style={{
                border: `1px solid ${active ? color : "#2e2e25"}`,
                background: active ? "rgba(255,255,255,0.06)" : "#1c1c16",
                color: active ? "#f2efe8" : "#8f8a7a",
              }}
            >
              <span
                className="w-[7px] h-[7px] rounded-full"
                style={{ background: color, boxShadow: `0 0 8px ${color}` }}
              />
              {short}
            </button>
          );
        })}
        {!demoMode ? (
          <button
            onClick={async () => {
              await signOut();
              router.push("/login");
            }}
            className="flex-none self-center text-[11px] text-ink-faint underline decoration-dotted underline-offset-4"
          >
            Sign out
          </button>
        ) : null}
      </div>
    </div>
  );
}
