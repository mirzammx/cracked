"use client";

import { useState } from "react";
import { updatePassword } from "@/app/login/actions";

export function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const mismatch = confirm.length > 0 && password !== confirm;

  return (
    <form action={updatePassword} className="flex flex-col gap-3">
      <input
        name="password"
        type="password"
        required
        minLength={6}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="New password"
        className="w-full h-12 rounded-xl border border-border-strong bg-canvas px-4 text-sm text-ink outline-none focus:border-ink-dim"
      />
      <input
        type="password"
        required
        minLength={6}
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder="Confirm new password"
        className="w-full h-12 rounded-xl border bg-canvas px-4 text-sm text-ink outline-none focus:border-ink-dim"
        style={{ borderColor: mismatch ? "#f87171" : undefined }}
      />
      {mismatch ? <div className="text-xs text-red-400">Passwords don&apos;t match.</div> : null}
      <button
        type="submit"
        disabled={mismatch || !confirm}
        className="w-full h-12 rounded-full bg-ink-2 text-canvas text-sm font-medium disabled:opacity-40"
      >
        Set new password
      </button>
    </form>
  );
}
