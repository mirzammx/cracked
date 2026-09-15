import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureOnboarded } from "@/lib/onboarding";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/today";

  // Supabase appends these instead of `code` when the link itself failed
  // (expired, already used, or the redirect wasn't on the allow-list) —
  // surface that instead of silently bouncing back to a blank login form.
  const linkError = searchParams.get("error_description") || searchParams.get("error");
  if (linkError) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(linkError)}`);
  }

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("Sign-in link is missing its code — try requesting a new one.")}`
    );
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error?.message ?? "Sign-in failed.")}`);
  }

  await ensureOnboarded(supabase, data.user);

  return NextResponse.redirect(`${origin}${next}`);
}
