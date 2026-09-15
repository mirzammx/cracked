import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Where the password-recovery email link lands. Exchanges the code for a
 * (recovery) session — same PKCE pattern as /auth/callback — then hands
 * off to /reset-password to actually collect the new password. Kept
 * separate from /auth/callback because landing there would redirect
 * straight into the app signed in, without ever prompting for a new
 * password, defeating the point of a password reset.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  const linkError = searchParams.get("error_description") || searchParams.get("error");
  if (linkError) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(linkError)}`);
  }

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("Reset link is missing its code — request a new one.")}`
    );
  }

  const supabase = createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
  }

  return NextResponse.redirect(`${origin}/reset-password`);
}
