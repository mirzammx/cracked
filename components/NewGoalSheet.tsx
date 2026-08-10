"use client";

import { useEffect, useMemo, useState } from "react";
import { Sheet } from "./Sheet";
import { useGoals } from "./GoalsProvider";
import { horizonLabel, parentLevel, todayISODate } from "@/lib/goals";
import { DAY_CODES, DayCode, GoalLevel, LEVEL_LABEL, LEVELS, RECURRENCE_PRESETS, RecurrencePreset } from "@/lib/types";

export function NewGoalSheet() {
  const { goals, newGoalOpen, newGoalDefaultLevel, closeNewGoal, addGoal, openQuickStart } = useGoals();
  const [level, setLevel] = useState<GoalLevel>("quarterly");
  const [parentId, setParentId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [why, setWhy] = useState("");
  const [scheduledDate, setScheduledDate] = useState(todayISODate());
  const [isTemplate, setIsTemplate] = useState(false);
  const [recurrenceMode, setRecurrenceMode] = useState<RecurrencePreset | "custom">("daily");
  const [customDays, setCustomDays] = useState<Set<DayCode>>(new Set());
  const [saving, setSaving] = useState(false);

  const pLevel = parentLevel(level);
  const isDaily = level === "daily";
  // Required where drift actually happens (yearly/quarterly); optional at
  // the more granular levels so fast capture isn't taxed for a reason.
  const whyRequired = level === "yearly" || level === "quarterly";
  const parentOptions = useMemo(
    () => (pLevel ? goals.filter((g) => g.level === pLevel) : []),
    [goals, pLevel]
  );

  function pickLevel(l: GoalLevel) {
    setLevel(l);
    const nextParentLevel = parentLevel(l);
    const options = nextParentLevel ? goals.filter((g) => g.level === nextParentLevel) : [];
    // Daily defaults to standalone (""); everything else needs a real parent picked.
    setParentId(l === "daily" ? "" : options[0]?.id ?? "");
    setIsTemplate(false);
  }

  function toggleCustomDay(code: DayCode) {
    setCustomDays((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  function close() {
    closeNewGoal();
    setTitle("");
    setWhy("");
    setIsTemplate(false);
    setRecurrenceMode("daily");
    setCustomDays(new Set());
    setScheduledDate(todayISODate());
    setSaving(false);
  }

  // The sheet is a single persistent instance (toggled, never remounted),
  // so each open needs to re-apply the caller's requested horizon — e.g.
  // the "+" button defaults to Daily from Today, Quarterly elsewhere.
  useEffect(() => {
    if (newGoalOpen) {
      pickLevel(newGoalDefaultLevel);
      setScheduledDate(todayISODate());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newGoalOpen, newGoalDefaultLevel]);

  // "Draw it into the map" is only true when something actually lands on
  // the map — a standalone daily task doesn't, so the button should say so.
  const standaloneDaily = isDaily && !parentId;
  const parentRequired = level !== "yearly" && level !== "daily";
  const recurrenceRule = recurrenceMode === "custom" ? Array.from(customDays).join(",") : recurrenceMode;
  const recurrenceReady = recurrenceMode !== "custom" || customDays.size > 0;

  const canSave =
    title.trim().length > 0 &&
    (!whyRequired || why.trim().length > 0) &&
    (!parentRequired || !!parentId) &&
    (!isTemplate || recurrenceReady);

  async function save() {
    if (!canSave) return;
    setSaving(true);
    try {
      await addGoal({
        title,
        why_note: why,
        level,
        parent_id: level === "yearly" ? null : parentId || null,
        scheduled_date: isDaily && !isTemplate ? scheduledDate : null,
        is_template: isDaily && isTemplate,
        recurrence_rule: isDaily && isTemplate ? recurrenceRule : null,
      });
      setTitle("");
      setWhy("");
      setIsTemplate(false);
      setRecurrenceMode("daily");
      setCustomDays(new Set());
      setScheduledDate(todayISODate());
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={newGoalOpen} onClose={close}>
      <div className="font-serif text-2xl text-ink-2">New goal</div>

      <div className="mt-[18px] text-[10px] tracking-[0.12em] uppercase text-ink-ghost mb-[9px]">Horizon</div>
      <div className="flex gap-[5px] bg-canvas rounded-xl p-1">
        {LEVELS.map((l) => {
          const active = level === l;
          return (
            <button
              key={l}
              onClick={() => pickLevel(l)}
              className="flex-1 h-[38px] rounded-[9px] text-xs transition-colors"
              style={{
                background: active ? "#1e1e17" : "transparent",
                color: active ? "#f2efe8" : "#6d6a5c",
              }}
            >
              {LEVEL_LABEL[l]}
            </button>
          );
        })}
      </div>

      {level !== "yearly" ? (
        <>
          <div className="mt-[18px] text-[10px] tracking-[0.12em] uppercase text-ink-ghost mb-[9px]">
            Attaches to
          </div>
          <select
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className="w-full h-[46px] rounded-xl border border-border-strong bg-canvas px-[11px] text-sm text-ink outline-none"
          >
            {isDaily ? <option value="">No goal — standalone task</option> : null}
            {parentOptions.length === 0 && !isDaily ? (
              <option value="">No {pLevel} goals yet — create one first</option>
            ) : (
              parentOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {horizonLabel(p.level)} · {p.title}
                </option>
              ))
            )}
          </select>
          {isDaily && !parentId ? (
            <div className="mt-2 text-[11px] text-ink-fade leading-relaxed">
              Every task can trace up to a goal — link one now, or later from Today.
            </div>
          ) : null}
        </>
      ) : (
        <>
          <div className="mt-[18px] text-sm text-ink-dim">A new anchor on the map — no parent needed.</div>
          <button
            onClick={() => {
              closeNewGoal();
              openQuickStart();
            }}
            className="mt-2 text-[11px] text-ink-faint underline decoration-dotted underline-offset-4"
          >
            ✨ Or use the 60-second quick start →
          </button>
        </>
      )}

      {isDaily ? (
        <>
          <button
            onClick={() => setIsTemplate((v) => !v)}
            className="mt-[18px] w-full flex items-center justify-between rounded-xl border border-border-strong px-[13px] h-[46px]"
          >
            <span className="text-sm text-ink">Make this recurring</span>
            <span
              className="w-9 h-5 rounded-full relative transition-colors"
              style={{ background: isTemplate ? "oklch(0.74 0.13 155)" : "#33332a" }}
            >
              <span
                className="absolute top-[3px] w-[14px] h-[14px] rounded-full bg-white transition-all"
                style={{ left: isTemplate ? 19 : 3 }}
              />
            </span>
          </button>

          {isTemplate ? (
            <>
              <div className="mt-[18px] text-[10px] tracking-[0.12em] uppercase text-ink-ghost mb-[9px]">
                Repeats
              </div>
              <div className="flex flex-wrap gap-[6px]">
                {RECURRENCE_PRESETS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setRecurrenceMode(p.value)}
                    className="rounded-full px-[13px] py-2 text-xs"
                    style={{
                      border: `1px solid ${recurrenceMode === p.value ? "#f2efe8" : "#33332a"}`,
                      background: recurrenceMode === p.value ? "#f2efe8" : "transparent",
                      color: recurrenceMode === p.value ? "#14140f" : "#b9b4a4",
                    }}
                  >
                    {p.label}
                  </button>
                ))}
                <button
                  onClick={() => setRecurrenceMode("custom")}
                  className="rounded-full px-[13px] py-2 text-xs"
                  style={{
                    border: `1px solid ${recurrenceMode === "custom" ? "#f2efe8" : "#33332a"}`,
                    background: recurrenceMode === "custom" ? "#f2efe8" : "transparent",
                    color: recurrenceMode === "custom" ? "#14140f" : "#b9b4a4",
                  }}
                >
                  Custom days
                </button>
              </div>
              {recurrenceMode === "custom" ? (
                <div className="mt-[10px] flex flex-wrap gap-[6px]">
                  {DAY_CODES.map((d) => {
                    const active = customDays.has(d.code);
                    return (
                      <button
                        key={d.code}
                        onClick={() => toggleCustomDay(d.code)}
                        className="w-10 h-9 rounded-lg text-xs"
                        style={{
                          border: `1px solid ${active ? "oklch(0.74 0.13 155)" : "#33332a"}`,
                          background: active ? "rgba(255,255,255,0.06)" : "transparent",
                          color: active ? "#f2efe8" : "#8f8a7a",
                        }}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              ) : null}
              <div className="mt-2 text-[11px] text-ink-fade leading-relaxed">
                This row is a generator, not a task — an instance gets created for each day it&apos;s due.
              </div>
            </>
          ) : (
            <>
              <div className="mt-[18px] text-[10px] tracking-[0.12em] uppercase text-ink-ghost mb-[9px]">When</div>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full h-[46px] rounded-xl border border-border-strong bg-canvas px-[13px] text-sm text-ink outline-none"
              />
            </>
          )}
        </>
      ) : null}

      <div className="mt-[18px] text-[10px] tracking-[0.12em] uppercase text-ink-ghost mb-[9px]">Title</div>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Run a half marathon"
        className="w-full h-[46px] rounded-xl border border-border-strong bg-canvas px-[13px] text-sm text-ink outline-none"
      />

      <div className="mt-[18px] flex items-baseline justify-between mb-[9px]">
        <div className="text-[10px] tracking-[0.12em] uppercase text-ink-ghost">Why this matters</div>
        <div className="text-[10px] text-ink-fade">{whyRequired ? "required" : "optional"}</div>
      </div>
      <input
        value={why}
        onChange={(e) => setWhy(e.target.value)}
        placeholder="One line you'll believe on a bad day"
        className="w-full h-[46px] rounded-xl border bg-canvas px-[13px] text-sm text-ink outline-none"
        style={{ borderColor: !whyRequired || why.trim() ? "#33332a" : "#4d4433" }}
      />

      <button
        onClick={save}
        disabled={!canSave || saving}
        className="mt-5 w-full h-[52px] rounded-full bg-ink-2 text-canvas text-[15px] disabled:opacity-40"
      >
        {saving ? (standaloneDaily ? "Adding…" : "Drawing…") : standaloneDaily ? "Add to Today" : "Draw it into the map"}
      </button>
    </Sheet>
  );
}
