import type { SupabaseClient, User } from "@supabase/supabase-js";
import { buildExampleGoals } from "./exampleGoals";

/**
 * Seeds the example goal tree into a brand-new account and marks it
 * onboarded — idempotent, so it's safe to call from every auth entry
 * point that can produce a fresh session (magic-link callback used to be
 * the only one; now also Google OAuth's callback and instant
 * password signup, since that one never passes through a redirect
 * callback at all).
 */
export async function ensureOnboarded(supabase: SupabaseClient, user: User) {
  if (user.user_metadata?.onboarded) return;

  // Belt-and-suspenders: also check for zero existing goals, in case a
  // previous run seeded successfully but the metadata write below
  // didn't land — avoids seeding the example tree twice.
  const { count } = await supabase.from("goals").select("id", { count: "exact", head: true }).eq("user_id", user.id);

  if (!count) {
    await supabase.from("goals").insert(buildExampleGoals(user.id));
  }
  await supabase.auth.updateUser({ data: { onboarded: true } });
}
