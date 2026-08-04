"use client";

import { useEffect, useRef, useState } from "react";
import {
  NODE_WIDTH_BY_DEPTH,
  branchColor,
  chainOf,
  descendantsOf,
  horizonLabel,
  layoutGoals,
  progressOf,
  rootIndexOf,
} from "@/lib/goals";
import { useGoals } from "./GoalsProvider";
import { GoalDetailPanel } from "./GoalDetailPanel";
import { sideBorder } from "@/lib/uiStyle";

const DEPTH_OPTIONS = [
  { d: 1, label: "Q" },
  { d: 2, label: "M" },
  { d: 3, label: "W" },
  { d: 4, label: "D" },
];

export function GoalMap() {
  const { goals, focusId, setFocusId, justAddedId } = useGoals();
  const stageRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);

  const [maxDepth, setMaxDepth] = useState(4);
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(24);
  const [ty, setTy] = useState(0);

  const layout = layoutGoals(goals, maxDepth);

  function fitView(depth = maxDepth) {
    const el = stageRef.current;
    if (!el) return;
    const l = layoutGoals(goals, depth);
    const r = el.getBoundingClientRect();
    const s = Math.min(1, Math.max(0.34, Math.min(r.width / l.width, r.height / l.height)));
    setScale(s);
    setTx(Math.max(8, (r.width - l.width * s) / 2));
    setTy(Math.max(0, (r.height - l.height * s) / 2));
  }

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const r = stageRef.current?.getBoundingClientRect();
      if (r && (r.width < 1100 || r.height < 520)) {
        setMaxDepth(3);
        fitView(3);
      } else {
        fitView(4);
      }
    });
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onResize = () => fitView();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxDepth, goals]);

  function onPointerDown(e: React.PointerEvent) {
    dragRef.current = { x: e.clientX, y: e.clientY, tx, ty };
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragRef.current) return;
    setTx(dragRef.current.tx + (e.clientX - dragRef.current.x));
    setTy(dragRef.current.ty + (e.clientY - dragRef.current.y));
  }
  function onPointerUp() {
    dragRef.current = null;
  }
  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.08 : 0.926;
    const ns = Math.min(1.6, Math.max(0.3, scale * factor));
    const r = stageRef.current!.getBoundingClientRect();
    const mx = e.clientX - r.left;
    const my = e.clientY - r.top;
    setTx(mx - (mx - tx) * (ns / scale));
    setTy(my - (my - ty) * (ns / scale));
    setScale(ns);
  }

  const lit = focusId ? [focusId, ...chainOf(goals, focusId).map((n) => n.id), ...descendantsOf(goals, focusId)] : null;
  const isOn = (id: string) => !lit || lit.includes(id);

  const edges = Object.keys(layout.pos)
    .map((id) => {
      const node = goals.find((g) => g.id === id)!;
      if (!node.parent_id || !layout.pos[node.parent_id]) return null;
      const a = layout.pos[node.parent_id];
      const b = layout.pos[id];
      const x1 = a.x + NODE_WIDTH_BY_DEPTH[a.depth];
      const y1 = a.y;
      const x2 = b.x;
      const y2 = b.y;
      const mid = x1 + (x2 - x1) * 0.5;
      const p = progressOf(goals, id);
      const color = branchColor(rootIndexOf(goals, id));
      return {
        id,
        d: `M${x1} ${y1} C${mid} ${y1} ${mid} ${y2} ${x2} ${y2}`,
        color,
        width: p >= 0.999 ? 2.4 : 1.9,
        dash: Math.max(0.001, p),
        glow: p >= 0.999 ? `drop-shadow(0 0 5px ${color})` : p > 0 ? `drop-shadow(0 0 2px ${color})` : "none",
        anim: justAddedId === id ? "drawIn 600ms ease" : "none",
        opacity: isOn(id) ? 1 : 0.1,
      };
    })
    .filter(Boolean) as {
    id: string;
    d: string;
    color: string;
    width: number;
    dash: number;
    glow: string;
    anim: string;
    opacity: number;
  }[];

  return (
    <div className="flex-1 relative min-h-0">
      <div
        ref={stageRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        className="absolute inset-0 overflow-hidden cursor-grab touch-none"
      >
        <div
          className="absolute left-0 top-0"
          style={{
            width: layout.width,
            height: layout.height,
            transform: `translate(${tx}px,${ty}px) scale(${scale})`,
            transformOrigin: "0 0",
          }}
        >
          <svg width={layout.width} height={layout.height} className="absolute left-0 top-0 overflow-visible">
            {edges.map((e) => (
              <g key={e.id} style={{ opacity: e.opacity, transition: "opacity 300ms ease" }}>
                <path d={e.d} fill="none" stroke="#3a3a2e" strokeWidth={1.5} strokeLinecap="round" />
                <path
                  d={e.d}
                  fill="none"
                  stroke={e.color}
                  strokeWidth={e.width}
                  strokeLinecap="round"
                  pathLength={1}
                  strokeDasharray={`${e.dash} 1`}
                  style={{
                    filter: e.glow,
                    animation: e.anim,
                    transition: "stroke-dasharray 700ms cubic-bezier(0.3,0.8,0.3,1), filter 500ms ease",
                  }}
                />
              </g>
            ))}
          </svg>

          {Object.keys(layout.pos).map((id) => {
            const n = goals.find((g) => g.id === id)!;
            const p = layout.pos[id];
            const color = branchColor(rootIndexOf(goals, id));
            const pct = progressOf(goals, id);
            const isYear = n.level === "yearly";
            const kidsCut = p.depth === maxDepth;
            const w = NODE_WIDTH_BY_DEPTH[p.depth];
            const flatPct =
              n.level === "daily"
                ? n.completed
                  ? "done"
                  : n.skipped_reason
                    ? "skipped"
                    : "open"
                : `${Math.round(pct * 100)}%`;
            const active = focusId === id;

            return (
              <div
                key={id}
                onClick={() => setFocusId(active ? null : id)}
                style={{
                  position: "absolute",
                  left: p.x,
                  top: p.y,
                  width: w,
                  transform: "translateY(-50%)",
                  opacity: isOn(id) ? 1 : 0.16,
                  background: isYear ? color : "#1e1e17",
                  ...sideBorder(active ? color : isYear ? "transparent" : "#2e2e25", color),
                  borderRadius: 12,
                  padding: isYear ? "11px 13px" : "10px 12px",
                  cursor: "pointer",
                  transition: "opacity 300ms ease, box-shadow 300ms ease, border-color 300ms ease",
                  boxShadow:
                    active
                      ? `0 0 0 1px ${color}, 0 0 30px -6px ${color}`
                      : isYear
                        ? `0 10px 26px -14px ${color}`
                        : "none",
                  animation: justAddedId === id ? "popIn 420ms cubic-bezier(0.2,0.9,0.2,1)" : "none",
                }}
              >
                <div className="flex items-center gap-[9px]">
                  {isYear ? (
                    <div className="relative flex-none w-[38px] h-[38px]">
                      <svg width={38} height={38} viewBox="0 0 38 38" style={{ transform: "rotate(-90deg)" }}>
                        <circle cx={19} cy={19} r={15.5} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth={3} />
                        <circle
                          cx={19}
                          cy={19}
                          r={15.5}
                          fill="none"
                          stroke="#14140f"
                          strokeWidth={3}
                          strokeLinecap="round"
                          pathLength={1}
                          strokeDasharray={`${pct} 1`}
                          style={{ transition: "stroke-dasharray 700ms cubic-bezier(0.3,0.8,0.3,1)" }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center text-[10px]" style={{ color: "#14140f" }}>
                        {Math.round(pct * 100)}%
                      </div>
                    </div>
                  ) : null}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-[6px]">
                      <div
                        className="text-[8px] tracking-[0.12em] uppercase"
                        style={{ color: isYear ? "rgba(20,20,15,0.62)" : "#6d6a5c" }}
                      >
                        {kidsCut ? `${horizonLabel(n.level)} · below` : horizonLabel(n.level)}
                      </div>
                      {!isYear ? (
                        <div className="text-[10px]" style={{ color: "#6d6a5c" }}>
                          {flatPct}
                        </div>
                      ) : null}
                    </div>
                    <div
                      className="leading-[1.2] text-pretty"
                      style={{
                        fontSize: isYear ? 17 : p.depth === 1 ? 14 : 13,
                        letterSpacing: "-0.01em",
                        color: isYear ? "#14140f" : n.completed || n.skipped_reason ? "#7d7869" : "#eeebe2",
                        fontFamily: isYear ? "var(--font-instrument-serif), Georgia, serif" : "inherit",
                        textDecoration: n.completed ? "line-through" : "none",
                      }}
                    >
                      {n.title}
                    </div>
                    {n.level !== "daily" ? (
                      <div className="mt-[6px] h-[2px] rounded bg-white/10">
                        <div
                          className="h-full rounded transition-all"
                          style={{
                            width: `${Math.round(pct * 100)}%`,
                            background: color,
                            boxShadow: `0 0 6px ${color}`,
                            transitionDuration: "700ms",
                          }}
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="absolute left-4 bottom-[14px] flex flex-col gap-2">
        <div className="flex bg-card/90 border border-border-strong rounded-full p-[3px] backdrop-blur">
          {DEPTH_OPTIONS.map((o) => (
            <button
              key={o.d}
              onClick={() => {
                setMaxDepth(o.d);
                requestAnimationFrame(() => fitView(o.d));
              }}
              className="min-w-[38px] h-[30px] rounded-full text-[11px] transition-colors"
              style={{ background: maxDepth === o.d ? "#f2efe8" : "transparent", color: maxDepth === o.d ? "#14140f" : "#8f8a7a" }}
            >
              {o.label}
            </button>
          ))}
        </div>
        <div className="flex gap-[6px]">
          <button
            onClick={() => setScale((s) => Math.max(0.3, s / 1.18))}
            className="w-[34px] h-[34px] rounded-[10px] border border-border-strong bg-card/90 text-ink-muted text-base"
          >
            −
          </button>
          <button
            onClick={() => setScale((s) => Math.min(1.6, s * 1.18))}
            className="w-[34px] h-[34px] rounded-[10px] border border-border-strong bg-card/90 text-ink-muted text-base"
          >
            +
          </button>
          <button
            onClick={() => fitView()}
            className="h-[34px] px-3 rounded-[10px] border border-border-strong bg-card/90 text-ink-muted text-[11px]"
          >
            Fit
          </button>
        </div>
      </div>

      <GoalDetailPanel />
    </div>
  );
}
