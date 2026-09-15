"use client";

import { useState } from "react";
import { forgotPassword, signInWithPassword, signUpWithPassword } from "@/app/login/actions";

export function PasswordAuthForm({ next }: { next: string }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const isSignup = mode === "signup";
  const passwordsMismatch = isSignup && confirmPassword.length > 0 && password !== confirmPassword;
  const action = isSignup ? signUpWithPassword : signInWithPassword;

  function toggleMode() {
    setMode((m) => (m === "signin" ? "signup" : "signin"));
    setPassword("");
    setConfirmPassword("");
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="next" value={next} />
      <input
        name="email"
        type="email"
        required
        placeholder="you@example.com"
        className="w-full h-12 rounded-xl border border-border-strong bg-canvas px-4 text-sm text-ink outline-none focus:border-ink-dim"
      />
      <input
        name="password"
        type="password"
        required
        minLength={6}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder={isSignup ? "Create a password" : "Password"}
        className="w-full h-12 rounded-xl border border-border-strong bg-canvas px-4 text-sm text-ink outline-none focus:border-ink-dim"
      />
      {isSignup ? (
        <input
          type="password"
          required
          minLength={6}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm password"
          className="w-full h-12 rounded-xl border bg-canvas px-4 text-sm text-ink outline-none focus:border-ink-dim"
          style={{ borderColor: passwordsMismatch ? "#f87171" : undefined }}
        />
      ) : null}
      {passwordsMismatch ? <div className="text-xs text-red-400">Passwords don&apos;t match.</div> : null}

      <button
        type="submit"
        disabled={isSignup && (passwordsMismatch || !confirmPassword)}
        className="w-full h-12 rounded-full bg-ink-2 text-canvas text-sm font-medium disabled:opacity-40"
      >
        {isSignup ? "Create account" : "Sign in"}
      </button>

      {!isSignup ? (
        // formNoValidate: this only needs the email field, not the
        // required password one — skips the browser's own validation for
        // this specific submit button so an empty password doesn't block it.
        <button
          type="submit"
          formAction={forgotPassword}
          formNoValidate
          className="text-xs text-ink-faint underline decoration-dotted underline-offset-4 self-center"
        >
          Forgot password?
        </button>
      ) : null}

      <button
        type="button"
        onClick={toggleMode}
        className="text-xs text-ink-faint underline decoration-dotted underline-offset-4 self-center"
      >
        {isSignup ? "Already have an account? Sign in" : "New here? Create an account"}
      </button>
    </form>
  );
}
