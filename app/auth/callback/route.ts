import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildExampleGoals } from "@/lib/exampleGoals";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/map";

  if (code) {
    const supabase = createClient();
    const { data } = await supabase.auth.exchangeCodeForSession(code);
    const user = data.user;

    if (user && !user.user_metadata?.onboarded) {
      // Belt-and-suspenders: also check for zero existing goals, in case
      // a previous run seeded successfully but the metadata write below
      // didn't land — avoids seeding the example tree twice.
      const { count } = await supabase
        .from("goals")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      if (!count) {
        await supabase.from("goals").insert(buildExampleGoals(user.id));
      }
      await supabase.auth.updateUser({ data: { onboarded: true } });
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
