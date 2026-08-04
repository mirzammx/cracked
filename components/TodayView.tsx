"use client";

import { useGoals } from "./GoalsProvider";
import { branchColor, chainOf, rootIndexOf, todayISODate } from "@/lib/goals";
import { sideBorder } from "@/lib/uiStyle";
import { Goal } from "@/lib/types";

function Crumb({ goal, goals }: { goal: Goal; goals: Goal[] }) {
  const chain = chainOf(goals, goal.id);
  return (
    <div className="text-[10px] tracking-[0.01em] text-ink-faint flex flex-wrap gap-1 items-center mb-[5px]">
      {chain.map((n, i) => (
        <span key={n.id} className="whitespace-nowrap">
          {n.title.length > 24 ? n.title.slice(0, 23) + "…" : n.title}
          {i < chain.length - 1 ? <span className="text-ink-fog px-1">→</span> : null}
        </span>
      ))}
    </div>
  );
}

function TaskRow({
  goal,
  goals,
  showBreadcrumb,
  onToggle,
  onSkip,
}: {
  goal: Goal;
  goals: Goal[];
  showBreadcrumb: boolean;
  onToggle: () => void;
  onSkip: () => void;
}) {
  const color = showBreadcrumb ? branchColor(rootIndexOf(goals, goal.id)) : "#5b584c";
  return (
    <div
      className="bg-card rounded-[13px] px-[15px] py-[13px] mb-[9px] flex gap-[13px] items-start"
      style={sideBorder("#2e2e25", color)}
    >
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
        {showBreadcrumb ? <Crumb goal={goal} goals={goals} /> : null}
        <div
          className="text-[15px] leading-tight"
          style={{ color: goal.completed ? "#7d7869" : "#f2efe8", textDecoration: goal.completed ? "line-through" : "none" }}
        >
          {goal.title}
        </div>
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
        {showBreadcrumb ? <Crumb goal={goal} goals={goals} /> : null}
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
  goals,
  items,
  showBreadcrumb,
  onToggle,
  onSkip,
  onReconsider,
}: {
  title: string;
  goals: Goal[];
  items: Goal[];
  showBreadcrumb: boolean;
  onToggle: (id: string, completed: boolean) => void;
  onSkip: (id: string) => void;
  onReconsider: (id: string) => void;
}) {
  if (!items.length) return null;
  const active = items.filter((g) => !g.completed && !g.skipped_reason);
  const done = items.filter((g) => g.completed);
  const skipped = items.filter((g) => !g.completed && g.skipped_reason);

  return (
    <div className="mb-7">
      <div className="text-[10px] tracking-[0.12em] uppercase text-ink-ghost mb-2">{title}</div>
      {[...active, ...done].map((g) => (
        <TaskRow
          key={g.id}
          goal={g}
          goals={goals}
          showBreadcrumb={showBreadcrumb}
          onToggle={() => onToggle(g.id, !g.completed)}
          onSkip={() => onSkip(g.id)}
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
  const { goals, toggleComplete, openSkip, reconsider, openRecurring } = useGoals();
  const today = todayISODate();
  const due = goals.filter((g) => g.level === "daily" && !g.is_template && g.scheduled_date === today);
  const goalTasks = due.filter((g) => g.parent_id !== null);
  const otherTasks = due.filter((g) => g.parent_id === null);
  const done = due.filter((g) => g.completed);

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

        {due.length === 0 ? (
          <div className="text-sm text-ink-dim">Nothing scheduled for today — attach a task from the map, or add a standalone one.</div>
        ) : null}

        <TaskSection
          title="Goal tasks"
          goals={goals}
          items={goalTasks}
          showBreadcrumb
          onToggle={toggleComplete}
          onSkip={openSkip}
          onReconsider={reconsider}
        />
        <TaskSection
          title="Other tasks"
          goals={goals}
          items={otherTasks}
          showBreadcrumb={false}
          onToggle={toggleComplete}
          onSkip={openSkip}
          onReconsider={reconsider}
        />
      </div>
    </div>
  );
}
