"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useGoals } from "./GoalsProvider";
import { branchColor, chainOf, findGoal, parentLevel, progressOf, rootIndexOf, todayISODate } from "@/lib/goals";
import { sideBorder } from "@/lib/uiStyle";
import { Goal, GoalLevel, LEVEL_LABEL } from "@/lib/types";

function Crumb({ goal, goals, pulsing }: { goal: Goal; goals: Goal[]; pulsing: boolean }) {
  const chain = chainOf(goals, goal.id);
  const color = branchColor(rootIndexOf(goals, goal.id));
  return (
    <div className="text-[10px] tracking-[0.01em] text-ink-faint flex flex-wrap gap-1 items-center mb-[5px]">
      {chain.map((n, i) => (
        <span
          key={n.id}
          className="whitespace-nowrap"
          style={pulsing ? { color, animation: `chainPulse 900ms ease ${i * 140}ms` } : undefined}
        >
          {n.title.length > 24 ? n.title.slice(0, 23) + "…" : n.title}
          {i < chain.length - 1 ? <span className="text-ink-fog px-1">→</span> : null}
        </span>
      ))}
    </div>
  );
}

/** Small always-visible line above "Goal tasks" — the map's ambient "sliver"
 * inside Today: the active task's full chain to root, with the immediate
 * parent's live progress. Lighting up here (via justCompletedId) is the same
 * "small action moves a big goal" hit every time a linked task closes, not
 * just during onboarding. */
function ChainStrip({
  goals,
  activeId,
  pulsing,
  onOpenMap,
}: {
  goals: Goal[];
  activeId: string | null;
  pulsing: boolean;
  onOpenMap: (focusId: string) => void;
}) {
  const task = activeId ? findGoal(goals, activeId) : undefined;
  if (!task) {
    return (
      <div className="mb-5 text-[11px] text-ink-ghost italic">Nothing linked to a goal today yet.</div>
    );
  }
  const chain = chainOf(goals, task.id);
  const color = branchColor(rootIndexOf(goals, task.id));
  const parent = chain[chain.length - 1];
  const pct = parent ? Math.round(progressOf(goals, parent.id) * 100) : null;

  return (
    <button
      onClick={() => onOpenMap(parent?.id ?? task.id)}
      className="mb-5 w-full text-left flex flex-wrap items-center gap-1 text-[11px]"
    >
      {chain.map((n, i) => (
        <span
          key={n.id}
          className="whitespace-nowrap text-ink-faint"
          style={{ color, animation: pulsing ? `chainPulse 900ms ease ${i * 140}ms` : undefined }}
        >
          {n.title}
          <span className="text-ink-fog px-1">→</span>
        </span>
      ))}
      <span
        className="whitespace-nowrap text-ink-dim"
        style={{ color, animation: pulsing ? `chainPulse 900ms ease ${chain.length * 140}ms` : undefined }}
      >
        {task.title}
      </span>
      {pct !== null ? <span className="ml-1 text-ink-ghost">· {pct}%</span> : null}
    </button>
  );
}

/** Points a first-time user at the seeded example chain and spells out the
 * payoff explicitly — the "small task powers a big goal" aha, made an
 * explicit first suggested action instead of something they might never
 * stumble into. Disappears for good the moment any example task is ever
 * completed (checked goals-wide, not per-task, so it doesn't reappear on a
 * later day if a different example task happens to be due). */
function TeachingMoment({ goals, task, onOpenMap }: { goals: Goal[]; task: Goal; onOpenMap: (focusId: string) => void }) {
  const chain = chainOf(goals, task.id);
  const root = chain[0];
  const color = branchColor(rootIndexOf(goals, task.id));
  return (
    <div
      className="mb-5 rounded-[13px] px-[15px] py-[13px] flex items-start gap-3"
      style={{ border: `1px solid ${color}`, background: "rgba(255,255,255,0.03)" }}
    >
      <span className="text-[18px] leading-none flex-none">👋</span>
      <div className="text-[13px] text-ink-dim leading-relaxed text-pretty">
        Try this: complete <span style={{ color }}>{task.title}</span> below and watch it move{" "}
        {root ? (
          <button onClick={() => onOpenMap(root.id)} className="underline decoration-dotted underline-offset-2" style={{ color }}>
            {root.title}
          </button>
        ) : (
          "its goal"
        )}{" "}
        up above — that&apos;s the whole idea.
      </div>
    </div>
  );
}

/** A soft, static "thread going nowhere" — reads as an invitation, not a warning. */
function DanglingThread() {
  return (
    <svg width="14" height="26" viewBox="0 0 14 26" className="flex-none mt-[7px]" aria-hidden>
      <line x1="7" y1="0" x2="7" y2="7" stroke="#5b584c" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      <line x1="7" y1="10" x2="7" y2="15" stroke="#5b584c" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      <line x1="7" y1="18" x2="7" y2="21" stroke="#5b584c" strokeWidth="1.5" strokeLinecap="round" opacity="0.2" />
    </svg>
  );
}

/** Creates a goal at `level`. If its own parent level doesn't exist yet
 * either, drops into InlineGoalPicker for that level instead of demanding
 * the whole chain up front — the tree accretes upward one step at a time,
 * without ever leaving Today for a separate flow. */
function InlineGoalCreator({
  level,
  goals,
  onCreated,
  onCancel,
}: {
  level: GoalLevel;
  goals: Goal[];
  onCreated: (goal: Goal) => void;
  onCancel: () => void;
}) {
  const { addGoal } = useGoals();
  const parentLvl = parentLevel(level);
  const [title, setTitle] = useState("");
  const [why, setWhy] = useState("");
  const [parentId, setParentId] = useState("");
  const [pickingParent, setPickingParent] = useState(false);
  const [saving, setSaving] = useState(false);

  const whyRequired = level === "yearly" || level === "quarterly";
  const canSave = title.trim().length > 0 && (!whyRequired || why.trim().length > 0) && (!parentLvl || !!parentId);
  const parentTitle = parentId ? findGoal(goals, parentId)?.title : null;

  if (pickingParent && parentLvl) {
    return (
      <InlineGoalPicker
        level={parentLvl}
        goals={goals}
        onPicked={(id) => {
          setParentId(id);
          setPickingParent(false);
        }}
        onCancel={() => setPickingParent(false)}
      />
    );
  }

  async function save() {
    if (!canSave) return;
    setSaving(true);
    try {
      const created = await addGoal({
        title: title.trim(),
        why_note: why.trim(),
        level,
        parent_id: parentLvl ? parentId : null,
      });
      onCreated(created);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-2 flex flex-col gap-[6px] rounded-lg border border-border-strong bg-canvas p-3">
      <div className="text-[10px] tracking-[0.1em] uppercase text-ink-ghost">New {LEVEL_LABEL[level].toLowerCase()} goal</div>
      {parentLvl ? (
        <button
          onClick={() => setPickingParent(true)}
          className="text-left h-9 rounded-lg border border-border-strong px-2 text-xs text-ink-dim"
        >
          {parentTitle ?? `Under which ${LEVEL_LABEL[parentLvl].toLowerCase()} goal? →`}
        </button>
      ) : null}
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className="h-9 rounded-lg border border-border-strong bg-canvas px-2 text-xs text-ink outline-none"
      />
      <input
        value={why}
        onChange={(e) => setWhy(e.target.value)}
        placeholder={whyRequired ? "Why this matters" : "Why this matters (optional)"}
        className="h-9 rounded-lg border bg-canvas px-2 text-xs text-ink outline-none"
        style={{ borderColor: !whyRequired || why.trim() ? "#33332a" : "#4d4433" }}
      />
      <div className="flex gap-2">
        <button
          onClick={save}
          disabled={!canSave || saving}
          className="flex-1 h-8 rounded-full bg-ink-2 text-canvas text-xs disabled:opacity-40"
        >
          {saving ? "Creating…" : "Create"}
        </button>
        <button onClick={onCancel} className="px-3 h-8 rounded-full border border-border-strong text-ink-muted text-xs">
          Cancel
        </button>
      </div>
    </div>
  );
}

/** Pick an existing goal at `level`, or — if none exist yet — drop straight
 * into InlineGoalCreator instead of showing a dropdown with nothing in it. */
function InlineGoalPicker({
  level,
  goals,
  onPicked,
  onCancel,
}: {
  level: GoalLevel;
  goals: Goal[];
  onPicked: (id: string) => void;
  onCancel: () => void;
}) {
  const options = goals.filter((g) => g.level === level);
  const [creating, setCreating] = useState(options.length === 0);

  if (creating) {
    return (
      <InlineGoalCreator
        level={level}
        goals={goals}
        onCreated={(g) => onPicked(g.id)}
        onCancel={options.length ? () => setCreating(false) : onCancel}
      />
    );
  }

  return (
    <select
      autoFocus
      defaultValue=""
      onChange={(e) => {
        if (e.target.value === "__create__") setCreating(true);
        else if (e.target.value) onPicked(e.target.value);
      }}
      onBlur={onCancel}
      className="mt-2 h-8 rounded-lg border border-border-strong bg-canvas px-2 text-xs text-ink outline-none"
    >
      <option value="" disabled>
        Pick a {level} goal…
      </option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.title}
        </option>
      ))}
      <option value="__create__">+ Create a new {level} goal</option>
    </select>
  );
}

function TaskRow({
  goal,
  goals,
  showBreadcrumb,
  pulsing,
  onToggle,
  onSkip,
  onHover,
  linking,
  onStartLink,
  onCancelLink,
  onPickParent,
}: {
  goal: Goal;
  goals: Goal[];
  showBreadcrumb: boolean;
  pulsing: boolean;
  onToggle: () => void;
  onSkip: () => void;
  onHover?: (id: string | null) => void;
  linking?: boolean;
  onStartLink?: () => void;
  onCancelLink?: () => void;
  onPickParent?: (parentId: string) => void;
}) {
  const dangling = !showBreadcrumb;
  const color = showBreadcrumb ? branchColor(rootIndexOf(goals, goal.id)) : "#5b584c";
  return (
    <div
      className="bg-card rounded-[13px] px-[15px] py-[13px] mb-[9px] flex gap-[13px] items-start"
      style={sideBorder("#2e2e25", color)}
      onMouseEnter={() => onHover?.(goal.id)}
      onMouseLeave={() => onHover?.(null)}
    >
      {dangling ? <DanglingThread /> : null}
      <button
        onClick={onToggle}
        className="flex-none w-[26px] h-[26px] mt-[1px] rounded-full text-[13px] flex items-center justify-center transition-all"
        style={{
          border: `1.5px solid ${goal.completed ? color : "#3a3a2e"}`,
          background: goal.completed ? color : "transparent",
          color: "#14140f",
          boxShadow: goal.completed ? `0 0 16px -2px ${color}` : "none",
        }}
      >
        {goal.completed ? "✓" : ""}
      </button>
      <div className="flex-1 min-w-0">
        {showBreadcrumb ? <Crumb goal={goal} goals={goals} pulsing={pulsing} /> : null}
        <div
          className="text-[15px] leading-tight"
          style={{ color: goal.completed ? "#7d7869" : "#f2efe8", textDecoration: goal.completed ? "line-through" : "none" }}
        >
          {goal.title}
        </div>
        {dangling && !goal.completed ? (
          linking ? (
            <InlineGoalPicker
              level="weekly"
              goals={goals}
              onPicked={(id) => onPickParent?.(id)}
              onCancel={() => onCancelLink?.()}
            />
          ) : (
            <button
              onClick={onStartLink}
              className="mt-2 text-[11px] text-ink-faint underline decoration-dotted underline-offset-4"
            >
              🔗 link to a goal
            </button>
          )
        ) : null}
      </div>
      {!goal.completed ? (
        <button onClick={onSkip} className="flex-none text-xs text-ink-faint border border-border rounded-full px-3 py-1.5 mt-0.5">
          Skip
        </button>
      ) : null}
    </div>
  );
}

function SkippedRow({
  goal,
  goals,
  showBreadcrumb,
  onReconsider,
}: {
  goal: Goal;
  goals: Goal[];
  showBreadcrumb: boolean;
  onReconsider: () => void;
}) {
  const color = showBreadcrumb ? branchColor(rootIndexOf(goals, goal.id)) : "#5b584c";
  return (
    <div
      className="rounded-[13px] px-[15px] py-[13px] mb-[9px] flex gap-[13px] items-start opacity-70"
      style={sideBorder("#2e2e25", color)}
    >
      <div className="flex-1 min-w-0">
        {showBreadcrumb ? <Crumb goal={goal} goals={goals} pulsing={false} /> : null}
        <div className="text-[15px] leading-tight text-ink-dim">{goal.title}</div>
        <div
          className="mt-[7px] text-[11px] rounded-[7px] px-2 py-1 inline-block"
          style={{ color: "#c9a86a", background: "rgba(201,168,106,0.1)" }}
        >
          Skipped — {goal.skipped_reason}
          {goal.skipped_note ? `: ${goal.skipped_note}` : ""}
        </div>
      </div>
      <button onClick={onReconsider} className="flex-none text-xs text-ink-faint border border-border rounded-full px-3 py-1.5 mt-0.5">
        Reconsider
      </button>
    </div>
  );
}

function TaskSection({
  title,
  caption,
  goals,
  items,
  showBreadcrumb,
  justCompletedId,
  onToggle,
  onSkip,
  onReconsider,
  onHover,
  linkingId,
  onStartLink,
  onCancelLink,
  onPickParent,
}: {
  title: string;
  caption?: string;
  goals: Goal[];
  items: Goal[];
  showBreadcrumb: boolean;
  justCompletedId: string | null;
  onToggle: (id: string, completed: boolean) => void;
  onSkip: (id: string) => void;
  onReconsider: (id: string) => void;
  onHover?: (id: string | null) => void;
  linkingId?: string | null;
  onStartLink?: (id: string) => void;
  onCancelLink?: () => void;
  onPickParent?: (id: string, parentId: string) => void;
}) {
  if (!items.length) return null;
  const active = items.filter((g) => !g.completed && !g.skipped_reason);
  const done = items.filter((g) => g.completed);
  const skipped = items.filter((g) => !g.completed && g.skipped_reason);

  return (
    <div className="mb-7">
      <div className="text-[10px] tracking-[0.12em] uppercase text-ink-ghost mb-2">{title}</div>
      {caption ? <div className="text-[11px] italic text-ink-fade mb-2 -mt-1">{caption}</div> : null}
      {[...active, ...done].map((g) => (
        <TaskRow
          key={g.id}
          goal={g}
          goals={goals}
          showBreadcrumb={showBreadcrumb}
          pulsing={g.id === justCompletedId}
          onToggle={() => onToggle(g.id, !g.completed)}
          onSkip={() => onSkip(g.id)}
          onHover={onHover}
          linking={linkingId === g.id}
          onStartLink={() => onStartLink?.(g.id)}
          onCancelLink={onCancelLink}
          onPickParent={(parentId) => onPickParent?.(g.id, parentId)}
        />
      ))}
      {skipped.length ? (
        <div className="mt-1">
          {skipped.map((g) => (
            <SkippedRow key={g.id} goal={g} goals={goals} showBreadcrumb={showBreadcrumb} onReconsider={() => onReconsider(g.id)} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function TodayView() {
  const { goals, toggleComplete, openSkip, reconsider, openRecurring, openQuickStart, relink, justCompletedId, setFocusId } =
    useGoals();
  const router = useRouter();
  const today = todayISODate();
  const due = goals.filter((g) => g.level === "daily" && !g.is_template && g.scheduled_date === today);
  const goalTasks = due.filter((g) => g.parent_id !== null);
  const otherTasks = due.filter((g) => g.parent_id === null);
  const done = due.filter((g) => g.completed);

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [linkingId, setLinkingId] = useState<string | null>(null);

  const hasCompletedExample = goals.some((g) => g.is_example && g.completed);
  const exampleTaskToday = goalTasks.find((g) => g.is_example && !g.completed);
  const showTeachingMoment = !hasCompletedExample && !!exampleTaskToday;
  const hasOwnYearlyGoal = goals.some((g) => g.level === "yearly" && !g.is_example);

  const activeId: string | null =
    justCompletedId && goalTasks.some((g) => g.id === justCompletedId)
      ? justCompletedId
      : hoveredId && goalTasks.some((g) => g.id === hoveredId)
        ? hoveredId
        : (goalTasks.find((g) => !g.completed)?.id ?? goalTasks[0]?.id ?? null);

  function openMap(focusId: string) {
    setFocusId(focusId);
    router.push("/map");
  }

  function pickParent(taskId: string, parentId: string) {
    relink(taskId, parentId);
    setLinkingId(null);
  }

  return (
    <div className="flex-1 overflow-auto px-[22px] pb-6 pt-1 flex justify-center">
      <div className="w-full max-w-[560px]">
        <div className="flex items-baseline justify-between gap-3 py-2 pb-5">
          <div className="flex items-baseline gap-3">
            <div className="font-serif text-[40px] leading-none tracking-[-0.02em] text-ink-2">
              {done.length}
              <span className="text-ink-fade">/{due.length}</span>
            </div>
            <div className="text-[13px] text-ink-dim leading-relaxed text-pretty">
              closed today. Each one lights a line further up the map.
            </div>
          </div>
          <button onClick={openRecurring} className="flex-none text-xs text-ink-faint underline decoration-dotted underline-offset-4">
            Recurring →
          </button>
        </div>

        {!hasOwnYearlyGoal ? (
          <button
            onClick={openQuickStart}
            className="mb-5 -mt-3 block text-[11px] text-ink-faint underline decoration-dotted underline-offset-4"
          >
            ✨ Set up your first goal — 60 sec →
          </button>
        ) : null}

        {showTeachingMoment && exampleTaskToday ? (
          <TeachingMoment goals={goals} task={exampleTaskToday} onOpenMap={openMap} />
        ) : null}

        <ChainStrip goals={goals} activeId={activeId} pulsing={!!justCompletedId && activeId === justCompletedId} onOpenMap={openMap} />

        {due.length === 0 ? (
          <div className="text-sm text-ink-dim">Nothing scheduled for today — attach a task from the map, or add a standalone one.</div>
        ) : null}

        <TaskSection
          title="Goal tasks"
          goals={goals}
          items={goalTasks}
          showBreadcrumb
          justCompletedId={justCompletedId}
          onToggle={toggleComplete}
          onSkip={openSkip}
          onReconsider={reconsider}
          onHover={setHoveredId}
        />
        <TaskSection
          title="Other tasks"
          caption="not yet part of a goal"
          goals={goals}
          items={otherTasks}
          showBreadcrumb={false}
          justCompletedId={justCompletedId}
          onToggle={toggleComplete}
          onSkip={openSkip}
          onReconsider={reconsider}
          linkingId={linkingId}
          onStartLink={setLinkingId}
          onCancelLink={() => setLinkingId(null)}
          onPickParent={pickParent}
        />
      </div>
    </div>
  );
}
