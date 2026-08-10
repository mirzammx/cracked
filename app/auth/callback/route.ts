import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildExampleGoals } from "@/lib/exampleGoals";

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

  const user = data.user;

  if (!user.user_metadata?.onboarded) {
    // Belt-and-suspenders: also check for zero existing goals, in case a
    // previous run seeded successfully but the metadata write below
    // didn't land — avoids seeding the example tree twice.
    const { count } = await supabase.from("goals").select("id", { count: "exact", head: true }).eq("user_id", user.id);

    if (!count) {
      await supabase.from("goals").insert(buildExampleGoals(user.id));
    }
    await supabase.auth.updateUser({ data: { onboarded: true } });
  }

  return NextResponse.redirect(`${origin}${next}`);
}
