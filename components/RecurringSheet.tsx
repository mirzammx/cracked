"use client";

import { useState } from "react";
import { Sheet } from "./Sheet";
import { useGoals } from "./GoalsProvider";
import { chainOf, recurrenceLabel } from "@/lib/goals";
import { DAY_CODES, DayCode, Goal, RECURRENCE_PRESETS, RecurrencePreset } from "@/lib/types";

function TemplateRow({ template, goals }: { template: Goal; goals: Goal[] }) {
  const { editTemplate, removeTemplate } = useGoals();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(template.title);
  const [why, setWhy] = useState(template.why_note);
  const [mode, setMode] = useState<RecurrencePreset | "custom">(
    template.recurrence_rule === "daily" || template.recurrence_rule === "weekdays" ? template.recurrence_rule : "custom"
  );
  const [customDays, setCustomDays] = useState<Set<DayCode>>(
    new Set((mode === "custom" ? template.recurrence_rule?.split(",") : []) as DayCode[])
  );
  const [busy, setBusy] = useState(false);

  const chain = template.parent_id ? chainOf(goals, template.id) : [];

  function toggleDay(code: DayCode) {
    setCustomDays((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  const rule = mode === "custom" ? Array.from(customDays).join(",") : mode;
  const canSave = title.trim() && why.trim() && (mode !== "custom" || customDays.size > 0);

  async function save() {
    if (!canSave) return;
    setBusy(true);
    try {
      await editTemplate(template.id, { title: title.trim(), why_note: why.trim(), recurrence_rule: rule });
      setEditing(false);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm(`Delete "${template.title}"? Past instances stay in your history.`)) return;
    setBusy(true);
    await removeTemplate(template.id);
  }

  if (!editing) {
    return (
      <div className="rounded-xl border border-border px-[13px] py-[11px] mb-[8px]">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[10px] text-ink-ghost mb-[3px]">
              {chain.length ? chain.map((c) => c.title).join(" → ") : "Standalone"}
            </div>
            <div className="text-[14px] text-ink">{template.title}</div>
            <div className="text-[11px] mt-[3px]" style={{ color: "oklch(0.74 0.13 155)" }}>
              {recurrenceLabel(template.recurrence_rule)}
            </div>
          </div>
          <div className="flex-none flex gap-[6px]">
            <button onClick={() => setEditing(true)} className="text-xs text-ink-muted border border-border rounded-full px-3 py-1.5">
              Edit
            </button>
            <button onClick={remove} disabled={busy} className="text-xs text-ink-faint border border-border rounded-full px-3 py-1.5 disabled:opacity-40">
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border-strong px-[13px] py-[13px] mb-[8px]">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full h-10 rounded-lg border border-border-strong bg-canvas px-3 text-sm text-ink outline-none mb-2"
      />
      <input
        value={why}
        onChange={(e) => setWhy(e.target.value)}
        className="w-full h-10 rounded-lg border border-border-strong bg-canvas px-3 text-sm text-ink outline-none mb-2"
      />
      <div className="flex flex-wrap gap-[6px] mb-2">
        {RECURRENCE_PRESETS.map((p) => (
          <button
            key={p.value}
            onClick={() => setMode(p.value)}
            className="rounded-full px-3 py-1.5 text-xs"
            style={{
              border: `1px solid ${mode === p.value ? "#f2efe8" : "#33332a"}`,
              background: mode === p.value ? "#f2efe8" : "transparent",
              color: mode === p.value ? "#14140f" : "#b9b4a4",
            }}
          >
            {p.label}
          </button>
        ))}
        <button
          onClick={() => setMode("custom")}
          className="rounded-full px-3 py-1.5 text-xs"
          style={{
            border: `1px solid ${mode === "custom" ? "#f2efe8" : "#33332a"}`,
            background: mode === "custom" ? "#f2efe8" : "transparent",
            color: mode === "custom" ? "#14140f" : "#b9b4a4",
          }}
        >
          Custom
        </button>
      </div>
      {mode === "custom" ? (
        <div className="flex flex-wrap gap-[6px] mb-2">
          {DAY_CODES.map((d) => {
            const active = customDays.has(d.code);
            return (
              <button
                key={d.code}
                onClick={() => toggleDay(d.code)}
                className="w-9 h-8 rounded-lg text-[11px]"
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
      <div className="flex gap-2">
        <button onClick={save} disabled={!canSave || busy} className="flex-1 h-9 rounded-full bg-ink-2 text-canvas text-xs disabled:opacity-40">
          Save
        </button>
        <button onClick={() => setEditing(false)} className="flex-none px-4 h-9 rounded-full border border-border-strong text-ink-muted text-xs">
          Cancel
        </button>
      </div>
    </div>
  );
}

export function RecurringSheet() {
  const { goals, recurringOpen, closeRecurring } = useGoals();
  const templates = goals.filter((g) => g.is_template);

  return (
    <Sheet open={recurringOpen} onClose={closeRecurring}>
      <div className="font-serif text-2xl text-ink-2 mb-1">Recurring</div>
      <div className="text-[13px] text-ink-dim mb-4">
        Generators, not tasks — each creates a fresh instance on the days it&apos;s due. Editing one only changes what
        gets generated from here on; past instances keep their own copy.
      </div>
      {templates.length === 0 ? (
        <div className="text-sm text-ink-dim">
          No recurring templates yet — toggle &quot;Make this recurring&quot; when creating a daily goal.
        </div>
      ) : (
        templates.map((t) => <TemplateRow key={t.id} template={t} goals={goals} />)
      )}
    </Sheet>
  );
}
