import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import { ensureTodaysInstances } from "@/lib/actions";
import { MOCK_GOALS } from "@/lib/mockGoals";
import { Goal } from "@/lib/types";
import { GoalsProvider } from "@/components/GoalsProvider";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { NewGoalSheet } from "@/components/NewGoalSheet";
import { SkipSheet } from "@/components/SkipSheet";
import { RecurringSheet } from "@/components/RecurringSheet";
import { StickyNote } from "@/components/StickyNote";

async function loadGoals(): Promise<Goal[]> {
  if (!hasSupabaseEnv) return MOCK_GOALS;
  // Idempotent — generates today's instances from due templates if they
  // don't already exist, before the fetch below picks them up.
  await ensureTodaysInstances();
  const supabase = createClient();
  const { data } = await supabase.from("goals").select("*").order("created_at", { ascending: true });
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
        {children}
        <BottomNav />
      </div>
      <NewGoalSheet />
      <SkipSheet />
      <RecurringSheet />
      <StickyNote />
    </GoalsProvider>
  );
}
