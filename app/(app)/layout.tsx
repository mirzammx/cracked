import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import { ensureTodaysInstances } from "@/lib/actions";
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
  // don't already exist, before the fetch below picks them up.
  await ensureTodaysInstances();
  const supabase = createClient();
  // Goal-tree nodes (level != "daily") and templates always carry a null
  // scheduled_date and are needed in full for the Map/RecurringSheet — only
  // daily instances are date-scoped, to the same window History can ever
  // display, so years of past checkmarks aren't fetched on every page load.
  const cutoff = toISODate(new Date(Date.now() - HISTORY_WEEKS * 7 * 86400000));
  const { data } = await supabase
    .from("goals")
    .select("*")
    .or(`level.neq.daily,is_template.eq.true,scheduled_date.gte.${cutoff}`)
    .order("created_at", { ascending: true });
  return (data ?? []) as Goal[];
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const goals = await loadGoals();

  return (
    <GoalsProvider initialGoals={goals} demoMode={!hasSupabaseEnv}>
      <div
        className="min-h-screen flex flex-col relative overflow-hidden"
        style={{ background: "radial-gradient(120% 90% at 50% 0%, #22221a 0%, #14140f 70%)" }}
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
