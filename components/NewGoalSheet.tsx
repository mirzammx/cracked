"use client";

import { useMemo, useState } from "react";
import { Sheet } from "./Sheet";
import { useGoals } from "./GoalsProvider";
import { horizonLabel, parentLevel } from "@/lib/goals";
import { GoalLevel, LEVEL_LABEL, LEVELS } from "@/lib/types";

export function NewGoalSheet() {
  const { goals, newGoalOpen, closeNewGoal, addGoal } = useGoals();
  const [level, setLevel] = useState<GoalLevel>("quarterly");
  const [parentId, setParentId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [why, setWhy] = useState("");
  const [saving, setSaving] = useState(false);

  const pLevel = parentLevel(level);
  const parentOptions = useMemo(
    () => (pLevel ? goals.filter((g) => g.level === pLevel) : []),
    [goals, pLevel]
  );

  function pickLevel(l: GoalLevel) {
    setLevel(l);
    const nextParentLevel = parentLevel(l);
    const options = nextParentLevel ? goals.filter((g) => g.level === nextParentLevel) : [];
    setParentId(options[0]?.id ?? "");
  }

  function close() {
    closeNewGoal();
    setTitle("");
    setWhy("");
    setSaving(false);
  }

  const canSave = title.trim().length > 0 && why.trim().length > 0 && (level === "yearly" || !!parentId);

  async function save() {
    if (!canSave) return;
    setSaving(true);
    try {
      await addGoal({
        title,
        why_note: why,
        level,
        parent_id: level === "yearly" ? null : parentId,
      });
      setTitle("");
      setWhy("");
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
            {parentOptions.length === 0 ? (
              <option value="">No {pLevel} goals yet — create one first</option>
            ) : (
              parentOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {horizonLabel(p.level)} · {p.title}
                </option>
              ))
            )}
          </select>
        </>
      ) : (
        <div className="mt-[18px] text-sm text-ink-dim">A new anchor on the map — no parent needed.</div>
      )}

      <div className="mt-[18px] text-[10px] tracking-[0.12em] uppercase text-ink-ghost mb-[9px]">Title</div>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Run a half marathon"
        className="w-full h-[46px] rounded-xl border border-border-strong bg-canvas px-[13px] text-sm text-ink outline-none"
      />

      <div className="mt-[18px] flex items-baseline justify-between mb-[9px]">
        <div className="text-[10px] tracking-[0.12em] uppercase text-ink-ghost">Why this matters</div>
        <div className="text-[10px] text-ink-fade">required</div>
      </div>
      <input
        value={why}
        onChange={(e) => setWhy(e.target.value)}
        placeholder="One line you'll believe on a bad day"
        className="w-full h-[46px] rounded-xl border bg-canvas px-[13px] text-sm text-ink outline-none"
        style={{ borderColor: why.trim() ? "#33332a" : "#4d4433" }}
      />

      <button
        onClick={save}
        disabled={!canSave || saving}
        className="mt-5 w-full h-[52px] rounded-full bg-ink-2 text-canvas text-[15px] disabled:opacity-40"
      >
        {saving ? "Drawing…" : "Draw it into the map"}
      </button>
    </Sheet>
  );
}
