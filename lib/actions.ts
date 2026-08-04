"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { Goal, NewGoalInput } from "@/lib/types";

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");
  return { supabase, user };
}

export async function createGoal(input: NewGoalInput): Promise<Goal> {
  const { supabase, user } = await requireUser();

  const { data, error } = await supabase
    .from("goals")
    .insert({
      user_id: user.id,
      parent_id: input.parent_id,
      title: input.title.trim(),
      why_note: input.why_note.trim(),
      level: input.level,
      is_today: input.is_today ?? false,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/map");
  revalidatePath("/today");
  return data as Goal;
}

export async function setCompleted(id: string, completed: boolean): Promise<Goal> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("goals")
    .update({
      completed,
      // Completing a task clears any prior skip.
      skipped_reason: completed ? null : undefined,
      skipped_note: completed ? null : undefined,
      skipped_at: completed ? null : undefined,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/map");
  revalidatePath("/today");
  return data as Goal;
}

export async function skipGoal(id: string, reason: string, note: string): Promise<Goal> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("goals")
    .update({
      completed: false,
      skipped_reason: reason,
      skipped_note: note.trim() || null,
      skipped_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/map");
  revalidatePath("/today");
  return data as Goal;
}

/** Manually moves a skipped goal back into the due-now set. */
export async function reconsiderGoal(id: string): Promise<Goal> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("goals")
    .update({ skipped_reason: null, skipped_note: null, skipped_at: null })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/map");
  revalidatePath("/today");
  return data as Goal;
}

export async function signOut() {
  const { supabase } = await requireUser();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
}
