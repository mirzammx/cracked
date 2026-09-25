"use client";

/** The single checkbox affordance shared by Today view, the Week Board, and
 * (eventually) the sticky note — one place to redesign so all three surfaces
 * stay visually consistent. */
export function TaskCheckbox({
  completed,
  color,
  onClick,
}: {
  completed: boolean;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-none w-[26px] h-[26px] mt-[1px] rounded-full text-[13px] flex items-center justify-center transition-all"
      style={{
        border: `1.5px solid ${completed ? color : "#3a3a2e"}`,
        background: completed ? color : "transparent",
        color: "#14140f",
        boxShadow: completed ? `0 0 16px -2px ${color}` : "none",
      }}
    >
      {completed ? "✓" : ""}
    </button>
  );
}
