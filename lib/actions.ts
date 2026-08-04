"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { matchesRecurrence, todayISODate } from "@/lib/goals";
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
      scheduled_date: input.scheduled_date ?? null,
      is_template: input.is_template ?? false,
      recurrence_rule: input.recurrence_rule ?? null,
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

/** Edits a template's own fields. Already-generated instances copied their
 * title/why_note/parent_id at creation time, so this can never touch them —
 * it only changes what future instances will look like. */
export async function updateTemplate(
  id: string,
  patch: Partial<Pick<Goal, "title" | "why_note" | "recurrence_rule">>
): Promise<Goal> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("goals")
    .update(patch)
    .eq("id", id)
    .eq("is_template", true)
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/map");
  revalidatePath("/today");
  return data as Goal;
}

/** Past instances aren't cascade-deleted (template_id -> on delete set null in
 * the schema) — they just stop pointing at a template and keep their history. */
export async function deleteTemplate(id: string): Promise<void> {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("goals").delete().eq("id", id).eq("is_template", true);
  if (error) throw new Error(error.message);
  revalidatePath("/map");
  revalidatePath("/today");
}

/**
 * For each of the user's templates due today, creates today's instance if
 * it doesn't already exist. Idempotent — safe to call on every page load.
 * Instances copy the template's current title/why_note/parent_id, so a
 * template edited after this runs only affects tomorrow's instance onward.
 */
export async function ensureTodaysInstances(): Promise<void> {
  const { supabase, user } = await requireUser();
  const today = todayISODate();

  const { data: templates, error: templatesError } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_template", true);
  if (templatesError) throw new Error(templatesError.message);

  const due = (templates ?? []).filter(
    (t) => t.recurrence_rule && matchesRecurrence(t.recurrence_rule, new Date())
  );
  if (!due.length) return;

  const { data: existing, error: existingError } = await supabase
    .from("goals")
    .select("template_id")
    .eq("user_id", user.id)
    .eq("scheduled_date", today)
    .in(
      "template_id",
      due.map((t) => t.id)
    );
  if (existingError) throw new Error(existingError.message);

  const alreadyGenerated = new Set((existing ?? []).map((e) => e.template_id));
  const toCreate = due.filter((t) => !alreadyGenerated.has(t.id));
  if (!toCreate.length) return;

  const { error: insertError } = await supabase.from("goals").insert(
    toCreate.map((t) => ({
      user_id: user.id,
      parent_id: t.parent_id,
      level: "daily" as const,
      title: t.title,
      why_note: t.why_note,
      scheduled_date: today,
      template_id: t.id,
    }))
  );
  if (insertError) throw new Error(insertError.message);
}

export async function signOut() {
  const { supabase } = await requireUser();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
}
