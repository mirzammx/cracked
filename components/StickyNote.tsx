"use client";

import { useEffect, useState } from "react";
import { useGoals } from "./GoalsProvider";
import { TaskCheckbox } from "./TaskCheckbox";
import { branchColor, rootIndexOf, todayISODate } from "@/lib/goals";

const STORAGE_KEY = "cracked:stickyNoteExpanded";

function ExpandIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h6v6" />
      <path d="M9 21H3v-6" />
      <path d="M21 3l-7 7" />
      <path d="M3 21l7-7" />
    </svg>
  );
}

export function StickyNote() {
  const { goals, toggleComplete, justCompletedId, addGoal, openNewGoal } = useGoals();
  // Starts collapsed (matches the pre-mount server render) and only opens
  // if a prior session explicitly expanded it — avoids fighting with the
  // Goal Map's own detail panel for the same corner by default.
  const [expanded, setExpanded] = useState(false);
  const [quickTitle, setQuickTitle] = useState("");
  const [adding, setAdding] = useState(false);

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

  // Instant capture: title, Enter, done — no dialog. Everything else
  // (goal, schedule, recurrence) defaults silently; the expand button next
  // to the field is the deliberate opt-in path to change any of that.
  async function quickAdd() {
    const title = quickTitle.trim();
    if (!title || adding) return;
    setQuickTitle("");
    setAdding(true);
    try {
      await addGoal({
        title,
        why_note: "",
        level: "daily",
        parent_id: null,
        scheduled_date: today,
        is_template: false,
      });
    } finally {
      setAdding(false);
    }
  }

  if (!expanded) {
    return (
      <button
        onClick={toggle}
        aria-label="Open today's tasks"
        className="fixed top-20 right-4 z-40 w-12 h-12 rounded-full flex items-center justify-center text-[13px] font-medium bg-card border border-border-strong text-ink"
        style={{ boxShadow: "0 8px 20px -10px rgba(0,0,0,0.6)" }}
      >
        {doneCount}/{due.length}
      </button>
    );
  }

  return (
    <div
      className="fixed top-20 right-4 z-40 w-[260px] rounded-2xl bg-card/95 border border-border-strong backdrop-blur px-4 py-4 animate-fadeIn"
      style={{ boxShadow: "0 16px 32px -14px rgba(0,0,0,0.6)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="font-serif text-lg text-ink-2">Today</div>
        <button onClick={toggle} aria-label="Minimize" className="text-ink-faint text-sm leading-none hover:text-ink-dim">
          ✕
        </button>
      </div>

      <div className="flex items-center gap-[6px] mb-3">
        <input
          autoFocus
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") quickAdd();
          }}
          placeholder="Add a task…"
          className="flex-1 min-w-0 h-9 rounded-lg border border-border-strong bg-canvas px-3 text-[13px] text-ink outline-none"
        />
        <button
          onClick={() => openNewGoal("daily")}
          aria-label="Customize new task"
          title="Customize…"
          className="flex-none w-9 h-9 rounded-lg border border-border-strong text-ink-faint flex items-center justify-center hover:text-ink-dim hover:border-border"
        >
          <ExpandIcon />
        </button>
      </div>

      {due.length === 0 ? (
        <div className="text-[13px] text-ink-dim">Nothing today.</div>
      ) : (
        <div className="flex flex-col gap-[9px]">
          {due.map((g) => {
            const color = g.parent_id ? branchColor(rootIndexOf(goals, g.id)) : "#5b584c";
            const pulsing = g.id === justCompletedId;
            return (
              <div key={g.id} className="flex items-start gap-[9px]">
                <TaskCheckbox completed={g.completed} color={color} onClick={() => toggleComplete(g.id, !g.completed)} />
                <span
                  className="text-[13px] leading-tight mt-[6px]"
                  style={{
                    color: g.completed ? "#8f8a7a" : "#f2efe8",
                    textDecoration: g.completed ? "line-through" : "none",
                    animation: pulsing ? "chainPulse 900ms ease" : undefined,
                  }}
                >
                  {g.title}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
