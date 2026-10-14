import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import { ensureStreakUpdated, ensureTodaysInstances } from "@/lib/actions";
import { MOCK_GOALS } from "@/lib/mockGoals";
import { HISTORY_WEEKS, toISODate } from "@/lib/goals";
import { Goal } from "@/lib/types";
import { GoalsProvider } from "@/components/GoalsProvider";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { NewGoalSheet } from "@/components/NewGoalSheet";
import { SkipSheet } from "@/components/SkipSheet";
import { RecurringSheet } from "@/components/RecurringSheet";
import { QuickStartSheet } from "@/components/QuickStartSheet";
import { StickyNote } from "@/components/StickyNote";
import { InstallPrompt } from "@/components/InstallPrompt";

async function loadGoals(): Promise<Goal[]> {
  if (!hasSupabaseEnv) return MOCK_GOALS;
  // Idempotent — generates today's instances from due templates if they
  // don't already exist, before the fetch below picks them up. Best-effort:
  // a failure here must not take down the whole page (an uncaught throw in
  // this layout renders as a blank error screen in production).
  try {
    await ensureTodaysInstances();
  } catch (e) {
    console.error("ensureTodaysInstances failed:", e);
  }
  const supabase = createClient();
  // Goal-tree nodes (level != "daily") and templates always carry a null
  // scheduled_date and are needed in full for the Map/RecurringSheet — only
  // daily instances are date-scoped, to the same window History can ever
  // display, so years of past checkmarks aren't fetched on every page load.
  const cutoff = toISODate(new Date(Date.now() - HISTORY_WEEKS * 7 * 86400000));
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .or(`level.neq.daily,is_template.eq.true,scheduled_date.gte.${cutoff}`)
    .order("created_at", { ascending: true });
  if (error) console.error("loadGoals failed:", error.message);
  return (data ?? []) as Goal[];
}

/** The streak chip is decorative — never let it block the page. */
async function loadStreak(): Promise<number> {
  if (!hasSupabaseEnv) return 0;
  try {
    return await ensureStreakUpdated();
  } catch (e) {
    console.error("ensureStreakUpdated failed:", e);
    return 0;
  }
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Sequential, not Promise.all: both touch the auth session, and two
  // parallel refreshes of the same refresh token can invalidate each other.
  const goals = await loadGoals();
  const streak = await loadStreak();

  return (
    <GoalsProvider initialGoals={goals} initialStreak={streak} demoMode={!hasSupabaseEnv}>
      <div
        className="min-h-screen flex flex-col relative overflow-hidden"
        style={{ background: "radial-gradient(120% 90% at 50% 0%, #1b1d26 0%, #0e0f13 70%)" }}
      >
        <Header />
        <InstallPrompt />
        {children}
        <BottomNav />
      </div>
      <NewGoalSheet />
      <SkipSheet />
      <RecurringSheet />
      <QuickStartSheet />
      <StickyNote />
    </GoalsProvider>
  );
}
