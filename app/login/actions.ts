"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const next = String(formData.get("next") ?? "/map");

  if (!email) {
    redirect(`/login?error=${encodeURIComponent("Enter an email address.")}`);
  }

  const supabase = createClient();

  // Checked before ever calling Supabase Auth, so a non-invited email
  // gets a clear message instead of a magic-link email it can't use —
  // the auth.users trigger (enforce_invite_only) is the real backstop,
  // this is just the friendly path.
  const { data: allowed, error: allowedError } = await supabase.rpc("is_email_allowed", {
    check_email: email,
  });
  if (allowedError) {
    redirect(`/login?error=${encodeURIComponent("Couldn't verify your invite. Try again in a moment.")}`);
  }
  if (!allowed) {
    redirect(`/login?error=${encodeURIComponent("This email hasn't been invited yet.")}`);
  }

  const origin = headers().get("origin");

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/login?sent=1`);
}
