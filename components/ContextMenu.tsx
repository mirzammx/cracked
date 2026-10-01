"use client";

import { useState } from "react";

/** A single floating "Delete" menu, positioned at the cursor and clamped to
 * the viewport — the shared right-click-to-delete affordance for any node
 * anywhere in the app (Goal Map nodes, its detail panel, Day/Week task
 * cards). No confirmation: the delete fires the instant it's clicked. */
export function useContextMenu() {
  const [menu, setMenu] = useState<{ x: number; y: number; onDelete: () => void } | null>(null);

  function openMenu(e: React.MouseEvent, onDelete: () => void) {
    e.preventDefault();
    e.stopPropagation();
    const MENU_WIDTH = 140;
    const MENU_HEIGHT = 40;
    const x = Math.min(e.clientX, window.innerWidth - MENU_WIDTH - 8);
    const y = Math.min(e.clientY, window.innerHeight - MENU_HEIGHT - 8);
    setMenu({ x, y, onDelete });
  }

  function close() {
    setMenu(null);
  }

  const node = menu ? (
    <>
      <div
        className="fixed inset-0 z-[100]"
        onClick={close}
        onContextMenu={(e) => {
          e.preventDefault();
          close();
        }}
      />
      <div
        className="fixed z-[101] bg-card border border-border-strong rounded-lg py-1 min-w-[140px]"
        style={{ left: menu.x, top: menu.y, boxShadow: "0 12px 28px -10px rgba(0,0,0,0.7)" }}
      >
        <button
          onClick={() => {
            menu.onDelete();
            close();
          }}
          className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-white/5"
        >
          Delete
        </button>
      </div>
    </>
  ) : null;

  return { openMenu, node };
}
