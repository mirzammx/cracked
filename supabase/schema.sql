-- Cracked — schema (Phase 1 + Phase 2: scheduling, standalone tasks,
-- recurring templates, completion history).
-- Single self-referencing `goals` table. Every row carries user_id so
-- multi-user support needs no migration, even though this app only
-- ever has one user per account.
--
-- If you already ran the Phase 1 version of this file against a live
-- project, don't re-run this one — apply
-- supabase/migrations/0002_scheduling_templates_history.sql instead.
-- This file is the full state, for fresh projects only.

create extension if not exists "pgcrypto";

create type goal_level as enum ('yearly', 'quarterly', 'monthly', 'weekly', 'daily');

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  parent_id uuid references public.goals(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  why_note text not null check (char_length(trim(why_note)) > 0),
  level goal_level not null,
  completed boolean not null default false,
  -- Set/cleared by the goals_set_completed_at trigger below, not app
  -- code. History attributes a task to `scheduled_date` (the day it was
  -- due), not to completed_at (the day it happened to be checked off).
  completed_at timestamptz,
  -- Skip metadata. A skip does not set completed = true; it just moves the
  -- goal out of the "due now" set until reconsidered.
  skipped_reason text,
  skipped_note text,
  skipped_at timestamptz,
  -- Which day a `daily` goal is due. Today View filters on this. Null for
  -- everything above `daily`, and for template rows (see is_template).
  scheduled_date date,
  -- Marks a row as a recurring generator rather than a real task: never
  -- completed, never shown in Today View, never counted in history. The
  -- daily-generation job creates ordinary instance rows from it.
  is_template boolean not null default false,
  -- Recurrence for a template: 'daily', 'weekdays', or a comma-separated
  -- list of day codes ('mon,wed,fri'). Only set on templates.
  recurrence_rule text,
  -- Which template generated this instance, if any. Instances copy the
  -- template's title/why_note/parent_id at generation time rather than
  -- referencing it live, so editing a template never touches instances
  -- that already exist — this column is only for idempotent "has today's
  -- instance already been generated" checks, not live inheritance.
  template_id uuid references public.goals(id) on delete set null,
  created_at timestamptz not null default now(),

  -- A root is either a yearly goal (the top of a goal branch) or a
  -- standalone daily task (an errand/one-off with nothing to attach to).
  constraint goals_root_is_yearly_or_standalone_daily check (
    (parent_id is null and level in ('yearly', 'daily')) or parent_id is not null
  ),
  constraint goals_skip_fields_together check (
    (skipped_reason is null and skipped_at is null) or
    (skipped_reason is not null and skipped_at is not null)
  ),
  constraint goals_scheduled_date_daily_only check (
    scheduled_date is null or level = 'daily'
  ),
  constraint goals_template_daily_only check (
    not is_template or level = 'daily'
  ),
  constraint goals_recurrence_requires_template check (
    recurrence_rule is null or is_template
  ),
  constraint goals_template_has_no_schedule check (
    not is_template or scheduled_date is null
  )
);

create index if not exists goals_user_id_idx on public.goals(user_id);
create index if not exists goals_parent_id_idx on public.goals(parent_id);
create index if not exists goals_scheduled_date_idx
  on public.goals(user_id, scheduled_date)
  where level = 'daily' and not is_template;
create index if not exists goals_template_idx
  on public.goals(user_id)
  where is_template;
create index if not exists goals_template_instance_idx
  on public.goals(template_id, scheduled_date)
  where template_id is not null;

-- A trigger, not just an app-level check, because parent/child level
-- ordering is a data-integrity rule, not a UI rule.
create or replace function public.goals_check_level_order()
returns trigger
language plpgsql
as $$
declare
  parent_level goal_level;
  expected_child goal_level;
begin
  if new.parent_id is null then
    return new;
  end if;

  select level into parent_level from public.goals where id = new.parent_id;
  if parent_level is null then
    raise exception 'parent goal % not found', new.parent_id;
  end if;

  expected_child := case parent_level
    when 'yearly' then 'quarterly'
    when 'quarterly' then 'monthly'
    when 'monthly' then 'weekly'
    when 'weekly' then 'daily'
    else null
  end;

  if expected_child is null or new.level <> expected_child then
    raise exception 'a % goal must have a % parent (got %)', new.level, expected_child, parent_level;
  end if;

  return new;
end;
$$;

drop trigger if exists goals_check_level_order on public.goals;
create trigger goals_check_level_order
  before insert or update of parent_id, level on public.goals
  for each row execute function public.goals_check_level_order();

create or replace function public.goals_set_completed_at()
returns trigger
language plpgsql
as $$
begin
  if new.completed and (tg_op = 'INSERT' or not old.completed) then
    new.completed_at := coalesce(new.completed_at, now());
  elsif not new.completed then
    new.completed_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists goals_set_completed_at on public.goals;
create trigger goals_set_completed_at
  before insert or update of completed on public.goals
  for each row execute function public.goals_set_completed_at();

alter table public.goals enable row level security;

create policy "goals are only visible to their owner"
  on public.goals for select
  using (auth.uid() = user_id);

create policy "goals are only insertable by their owner"
  on public.goals for insert
  with check (auth.uid() = user_id);

create policy "goals are only updatable by their owner"
  on public.goals for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "goals are only deletable by their owner"
  on public.goals for delete
  using (auth.uid() = user_id);
