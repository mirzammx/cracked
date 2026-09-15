"use client";

import { useEffect, useState } from "react";
import { useGoals } from "./GoalsProvider";
import { branchColor, childrenOf, findGoal, formatDateLabel, horizonLabel, mapVisible, progressOf, rootIndexOf } from "@/lib/goals";

export function GoalDetailPanel() {
  const { goals: allGoals, focusId, setFocusId, toggleComplete, openSkip, reconsider, updateGoal } = useGoals();
  // Recurring templates aren't map nodes, so they can't show up as
  // children here either — otherwise a weekly goal's "below" list would
  // include its own generator alongside the tasks it produces.
  const goals = mapVisible(allGoals);
  const [busy, setBusy] = useState(false);

  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editWhy, setEditWhy] = useState("");
  const [saving, setSaving] = useState(false);

  const node = focusId ? findGoal(goals, focusId) : undefined;

  // A persistent panel (not remounted per node) needs to drop any
  // in-progress edit when the user focuses a different node — otherwise
  // switching cards mid-edit could carry stale text over or silently
  // save it to the wrong one.
  useEffect(() => {
    setEditing(false);
  }, [node?.id]);

  if (!node) return null;

  const color = branchColor(rootIndexOf(goals, node.id));
  const pct = Math.round(progressOf(goals, node.id) * 100);
  const kids = childrenOf(goals, node.id);
  const isDaily = node.level === "daily";
  // Same rule as New goal / quick-capture: required where drift actually
  // happens (yearly/quarterly), optional everywhere else.
  const whyRequired = node.level === "yearly" || node.level === "quarterly";
  const canSaveEdit = editTitle.trim().length > 0 && (!whyRequired || editWhy.trim().length > 0);

  function startEdit() {
    setEditTitle(node!.title);
    setEditWhy(node!.why_note);
    setEditing(true);
  }

  async function saveEdit() {
    if (!canSaveEdit) return;
    setSaving(true);
    try {
      await updateGoal(node!.id, { title: editTitle.trim(), why_note: editWhy.trim() });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="absolute right-4 bottom-4 w-full max-w-[300px] max-h-[calc(100%-32px)] bg-card/95 border border-border-strong rounded-2xl backdrop-blur p-4 overflow-auto animate-fadeIn">
      <div className="flex items-start justify-between gap-2">
        <div className="text-[9px] tracking-[0.12em] uppercase text-ink-ghost">{horizonLabel(node.level)}</div>
        <div className="flex items-center gap-3">
          {!editing ? (
            <button onClick={startEdit} className="text-ink-dim text-xs">
              Edit
            </button>
          ) : null}
          <button onClick={() => setFocusId(null)} className="text-ink-dim text-xs">
            Close ✕
          </button>
        </div>
      </div>

      {editing ? (
        <>
          <input
            autoFocus
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="mt-2 w-full h-10 rounded-lg border border-border-strong bg-canvas px-3 font-serif text-[16px] text-ink outline-none"
          />
          <div className="mt-3 flex items-baseline justify-between mb-[7px]">
            <div className="text-[10px] tracking-[0.12em] uppercase text-ink-ghost">Why this matters</div>
            <div className="text-[10px] text-ink-fade">{whyRequired ? "required" : "optional"}</div>
          </div>
          <input
            value={editWhy}
            onChange={(e) => setEditWhy(e.target.value)}
            placeholder="One line you'll believe on a bad day"
            className="w-full h-10 rounded-lg border bg-canvas px-3 text-xs text-ink outline-none"
            style={{ borderColor: !whyRequired || editWhy.trim() ? "#33332a" : "#4d4433" }}
          />
          <div className="mt-3 flex gap-2">
            <button
              onClick={saveEdit}
              disabled={!canSaveEdit || saving}
              className="flex-1 h-9 rounded-full bg-ink-2 text-canvas text-xs disabled:opacity-40"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="flex-none px-4 h-9 rounded-full border border-border-strong text-ink-muted text-xs"
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          <div
            className="mt-2 font-serif text-[22px] leading-tight text-ink-2"
            style={{ textDecoration: node.completed ? "line-through" : "none" }}
          >
            {node.title}
          </div>

          {!isDaily ? (
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 h-[3px] rounded bg-white/10">
                <div
                  className="h-full rounded transition-all"
                  style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}` }}
                />
              </div>
              <div className="text-xs text-ink-dim">{pct}%</div>
            </div>
          ) : (
            <div className="mt-3 flex items-center gap-2 text-xs">
              <span style={{ color }}>
                {node.completed ? "Done" : node.skipped_reason ? `Skipped — ${node.skipped_reason}` : "Open"}
              </span>
              {node.scheduled_date ? (
                <span className="text-ink-ghost">· {formatDateLabel(node.scheduled_date)}</span>
              ) : null}
            </div>
          )}

          {node.why_note ? (
            <div className="mt-4 text-[13px] italic leading-relaxed text-ink-dim text-pretty">{node.why_note}</div>
          ) : null}

          {isDaily ? (
            <div className="mt-5">
              {node.skipped_reason ? (
                <button
                  onClick={async () => {
                    setBusy(true);
                    await reconsider(node.id);
                    setBusy(false);
                  }}
                  disabled={busy}
                  className="w-full h-11 rounded-full border border-border-strong text-ink-muted text-sm disabled:opacity-40"
                >
                  Reconsider
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      setBusy(true);
                      await toggleComplete(node.id, !node.completed);
                      setBusy(false);
                    }}
                    disabled={busy}
                    className="flex-1 h-11 rounded-full text-sm disabled:opacity-40"
                    style={{ background: node.completed ? "transparent" : color, color: node.completed ? color : "#14140f", border: `1px solid ${color}` }}
                  >
                    {node.completed ? "Mark not done" : "Done"}
                  </button>
                  {!node.completed ? (
                    <button
                      onClick={() => openSkip(node.id)}
                      className="flex-none px-4 h-11 rounded-full border border-border-strong text-ink-muted text-sm"
                    >
                      Skip
                    </button>
                  ) : null}
                </div>
              )}
            </div>
          ) : null}

          {kids.length ? (
            <div className="mt-5">
              <div className="text-[10px] tracking-[0.12em] uppercase text-ink-ghost mb-2">
                {horizonLabel(kids[0].level)} · {kids.length} below
              </div>
              <div className="flex flex-col gap-1.5">
                {kids.map((k) => {
                  const kPct = Math.round(progressOf(goals, k.id) * 100);
                  return (
                    <button
                      key={k.id}
                      onClick={() => setFocusId(k.id)}
                      className="text-left rounded-lg border border-border px-3 py-2 hover:border-border-strong transition-colors"
                    >
                      <div
                        className="text-[13px] text-ink"
                        style={{ textDecoration: k.completed ? "line-through" : "none" }}
                      >
                        {k.title}
                      </div>
                      <div className="text-[10px] text-ink-ghost mt-0.5">
                        {k.level === "daily" ? (k.completed ? "done" : k.skipped_reason ? "skipped" : "open") : `${kPct}%`}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
