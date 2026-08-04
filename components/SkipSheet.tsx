"use client";

import { useState } from "react";
import { Sheet } from "./Sheet";
import { useGoals } from "./GoalsProvider";
import { findGoal } from "@/lib/goals";
import { SKIP_REASONS } from "@/lib/types";

export function SkipSheet() {
  const { goals, skipTaskId, closeSkip, confirmSkip } = useGoals();
  const [reason, setReason] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const task = skipTaskId ? findGoal(goals, skipTaskId) : undefined;

  function close() {
    closeSkip();
    setReason(null);
    setNote("");
    setSaving(false);
  }

  async function confirm() {
    if (!task || !reason) return;
    setSaving(true);
    await confirmSkip(task.id, reason, note);
    setReason(null);
    setNote("");
    setSaving(false);
  }

  return (
    <Sheet open={!!task} onClose={close}>
      {task ? (
        <div>
          <div className="font-serif text-2xl text-ink-2 leading-tight text-pretty">{task.title}</div>
          <div className="mt-6 text-[10px] tracking-[0.12em] uppercase text-ink-ghost mb-[10px]">
            What got in the way?
          </div>
          <div className="flex flex-wrap gap-2">
            {SKIP_REASONS.map((r) => {
              const active = reason === r;
              return (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className="rounded-full px-[14px] py-[10px] text-sm transition-colors"
                  style={{
                    border: `1px solid ${active ? "#f2efe8" : "#33332a"}`,
                    background: active ? "#f2efe8" : "transparent",
                    color: active ? "#14140f" : "#b9b4a4",
                  }}
                >
                  {r}
                </button>
              );
            })}
          </div>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note (optional)"
            className="mt-[14px] w-full h-[46px] rounded-xl border border-border-strong bg-canvas px-[13px] text-sm text-ink outline-none"
          />
          <button
            onClick={confirm}
            disabled={!reason || saving}
            className="mt-[14px] w-full h-[50px] rounded-full bg-ink-2 text-canvas text-sm disabled:opacity-40"
          >
            {saving ? "Logging…" : "Log the skip"}
          </button>
        </div>
      ) : null}
    </Sheet>
  );
}
