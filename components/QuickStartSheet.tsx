"use client";

import { useState } from "react";
import { Sheet } from "./Sheet";
import { useGoals } from "./GoalsProvider";
import { todayISODate } from "@/lib/goals";

type Step = 1 | 2 | "done";

/**
 * The optional, never-forced alternative to top-down tree building: one
 * chain (yearly → …→ today's task), two real questions, ~60 seconds. The
 * levels in between (quarterly/monthly/weekly) are created automatically
 * with plain placeholder titles — the user never has to think about them
 * here, just like the schema still requires them to exist for a valid
 * chain. Full tree expansion stays a separate, later choice via New goal.
 */
export function QuickStartSheet() {
  const { quickStartOpen, closeQuickStart, addGoal } = useGoals();
  const [step, setStep] = useState<Step>(1);
  const [yearTitle, setYearTitle] = useState("");
  const [yearWhy, setYearWhy] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<{ task: string; goal: string } | null>(null);

  function reset() {
    setStep(1);
    setYearTitle("");
    setYearWhy("");
    setTaskTitle("");
    setSaving(false);
  }

  function close() {
    closeQuickStart();
    reset();
  }

  const step1Ready = yearTitle.trim().length > 0 && yearWhy.trim().length > 0;
  const step2Ready = taskTitle.trim().length > 0;

  async function finish() {
    if (!step2Ready) return;
    setSaving(true);
    try {
      const yearly = await addGoal({ title: yearTitle, why_note: yearWhy, level: "yearly", parent_id: null });
      const quarterly = await addGoal({ title: "This quarter", why_note: yearWhy, level: "quarterly", parent_id: yearly.id });
      const monthly = await addGoal({ title: "This month", why_note: "", level: "monthly", parent_id: quarterly.id });
      const weekly = await addGoal({ title: "This week", why_note: "", level: "weekly", parent_id: monthly.id });
      await addGoal({
        title: taskTitle,
        why_note: "",
        level: "daily",
        parent_id: weekly.id,
        scheduled_date: todayISODate(),
      });
      setCreated({ task: taskTitle, goal: yearTitle });
      setStep("done");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={quickStartOpen} onClose={close}>
      {step === 1 ? (
        <>
          <div className="font-serif text-2xl text-ink-2">One goal, one step</div>
          <div className="mt-2 text-[13px] text-ink-dim leading-relaxed text-pretty">
            Two questions, about a minute — the full tree is always a separate, later choice.
          </div>

          <div className="mt-[18px] text-[10px] tracking-[0.12em] uppercase text-ink-ghost mb-[9px]">
            What&apos;s one thing you want to be true by end of this year?
          </div>
          <input
            autoFocus
            value={yearTitle}
            onChange={(e) => setYearTitle(e.target.value)}
            placeholder="Run a half marathon"
            className="w-full h-[46px] rounded-xl border border-border-strong bg-canvas px-[13px] text-sm text-ink outline-none"
          />

          <div className="mt-[18px] flex items-baseline justify-between mb-[9px]">
            <div className="text-[10px] tracking-[0.12em] uppercase text-ink-ghost">Why this matters</div>
            <div className="text-[10px] text-ink-fade">required</div>
          </div>
          <input
            value={yearWhy}
            onChange={(e) => setYearWhy(e.target.value)}
            placeholder="One line you'll believe on a bad day"
            className="w-full h-[46px] rounded-xl border bg-canvas px-[13px] text-sm text-ink outline-none"
            style={{ borderColor: yearWhy.trim() ? "#33332a" : "#4d4433" }}
          />

          <button
            onClick={() => setStep(2)}
            disabled={!step1Ready}
            className="mt-5 w-full h-[52px] rounded-full bg-ink-2 text-canvas text-[15px] disabled:opacity-40"
          >
            Next →
          </button>
        </>
      ) : null}

      {step === 2 ? (
        <>
          <div className="font-serif text-2xl text-ink-2">Almost there</div>
          <div className="mt-2 text-[13px] text-ink-dim leading-relaxed text-pretty">
            Toward &ldquo;<span className="text-ink">{yearTitle}</span>&rdquo; —
          </div>

          <div className="mt-[18px] text-[10px] tracking-[0.12em] uppercase text-ink-ghost mb-[9px]">
            What&apos;s one thing you could do this week toward it?
          </div>
          <input
            autoFocus
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            placeholder="Sign up for a 5k"
            className="w-full h-[46px] rounded-xl border border-border-strong bg-canvas px-[13px] text-sm text-ink outline-none"
          />

          <div className="mt-5 flex gap-2">
            <button
              onClick={() => setStep(1)}
              className="flex-none px-4 h-[52px] rounded-full border border-border-strong text-ink-muted text-sm"
            >
              ← Back
            </button>
            <button
              onClick={finish}
              disabled={!step2Ready || saving}
              className="flex-1 h-[52px] rounded-full bg-ink-2 text-canvas text-[15px] disabled:opacity-40"
            >
              {saving ? "Drawing…" : "Draw it in"}
            </button>
          </div>
        </>
      ) : null}

      {step === "done" && created ? (
        <>
          <div className="font-serif text-2xl text-ink-2">That&apos;s the whole chain</div>
          <div className="mt-3 text-[14px] text-ink-dim leading-relaxed text-pretty">
            &ldquo;{created.task}&rdquo; is on today&apos;s list, tracing straight up to &ldquo;{created.goal}.&rdquo;
            Complete it and watch the connection light up.
          </div>
          <button onClick={close} className="mt-6 w-full h-[52px] rounded-full bg-ink-2 text-canvas text-[15px]">
            See it in Today
          </button>
        </>
      ) : null}
    </Sheet>
  );
}
