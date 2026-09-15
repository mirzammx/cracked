"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { ensureOnboarded } from "@/lib/onboarding";

export async function loginWithGoogle(formData: FormData) {
  const next = String(formData.get("next") ?? "/today");
  const supabase = createClient();
  const origin = headers().get("origin");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error || !data.url) {
    redirect(`/login?error=${encodeURIComponent(error?.message ?? "Couldn't start Google sign-in.")}`);
  }

  redirect(data.url);
}

export async function signUpWithPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/today");

  if (!email || !password) {
    redirect(`/login?error=${encodeURIComponent("Enter an email and password.")}`);
  }
  if (password.length < 6) {
    redirect(`/login?error=${encodeURIComponent("Password must be at least 6 characters.")}`);
  }

  const supabase = createClient();
  const origin = headers().get("origin");

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  // Expected path once "Confirm email" is off in Supabase: signUp hands
  // back an active session immediately, no email step at all.
  if (data.session && data.user) {
    await ensureOnboarded(supabase, data.user);
    redirect(next);
  }

  // Only reached if the Supabase project still requires confirmation.
  redirect(`/login?sent=1`);
}

export async function signInWithPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/today");

  if (!email || !password) {
    redirect(`/login?error=${encodeURIComponent("Enter an email and password.")}`);
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect(next);
}

/** Bridges accounts that only ever had a magic-link/OAuth session (no
 * password set) into password auth, and doubles as normal "forgot
 * password" recovery. Sends a one-time link to /auth/reset-password,
 * which exchanges the code for a session and redirects to /reset-password
 * to actually set the new password. */
export async function forgotPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    redirect(`/login?error=${encodeURIComponent("Enter your email above, then tap Forgot password.")}`);
  }

  const supabase = createClient();
  const origin = headers().get("origin");

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/reset-password`,
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/login?sent=1`);
}

export async function updatePassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");

  if (password.length < 6) {
    redirect(`/reset-password?error=${encodeURIComponent("Password must be at least 6 characters.")}`);
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(`/reset-password?error=${encodeURIComponent(error.message)}`);
  }

  // Covers the (unlikely but cheap-to-guard) case of a recovery link
  // reaching an account that was never onboarded — every account should
  // have its own seeded canvas regardless of which auth path it took.
  if (data.user) {
    await ensureOnboarded(supabase, data.user);
  }

  redirect("/today");
}
