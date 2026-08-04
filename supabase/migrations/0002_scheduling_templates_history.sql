-- Cracked — Phase 2 migration: scheduling, standalone tasks, recurring
-- templates, completion history. Additive to the Phase 1 `goals` table.
--
-- Run this against a database that already has supabase/schema.sql's
-- Phase 1 state applied. For a brand-new project, just run the updated
-- supabase/schema.sql directly instead — it already includes everything
-- below.

alter table public.goals
  -- Which day a `daily` goal is due. Today View filters on this instead
  -- of the old `is_today` flag (dropped below) — a task can now be
  -- scheduled for any date, past or future.
  add column scheduled_date date,
  -- Marks a row as a recurring generator rather than a real task: never
  -- completed, never shown in Today View, never counted in history.
  add column is_template boolean not null default false,
  -- Recurrence for a template: 'daily', 'weekdays', or a comma-separated
  -- list of day codes ('mon,wed,fri'). Only meaningful on templates.
  add column recurrence_rule text,
  -- Which template generated this instance, if any. Instances copy the
  -- template's title/why_note/parent_id at generation time rather than
  -- referencing it live, so editing a template never touches instances
  -- that already exist — this column is only for idempotent "has today's
  -- instance already been generated" checks, not live inheritance.
  add column template_id uuid references public.goals(id) on delete set null,
  -- When a task was actually checked off (kept separate from
  -- scheduled_date: history attributes a task to the day it was DUE, not
  -- the day it happened to be completed). Maintained by trigger below.
  add column completed_at timestamptz;

-- Standalone daily tasks (errands, one-offs) now allowed: a `daily` goal
-- may have parent_id = null, same as a `yearly` goal.
alter table public.goals drop constraint goals_root_is_yearly;
alter table public.goals add constraint goals_root_is_yearly_or_standalone_daily check (
  (parent_id is null and level in ('yearly', 'daily')) or parent_id is not null
);

alter table public.goals add constraint goals_scheduled_date_daily_only check (
  scheduled_date is null or level = 'daily'
);
alter table public.goals add constraint goals_template_daily_only check (
  not is_template or level = 'daily'
);
alter table public.goals add constraint goals_recurrence_requires_template check (
  recurrence_rule is null or is_template
);
alter table public.goals add constraint goals_template_has_no_schedule check (
  not is_template or scheduled_date is null
);

-- Superseded by scheduled_date.
drop index if exists goals_today_idx;
alter table public.goals drop column is_today;

create index goals_scheduled_date_idx
  on public.goals(user_id, scheduled_date)
  where level = 'daily' and not is_template;
create index goals_template_idx
  on public.goals(user_id)
  where is_template;
create index goals_template_instance_idx
  on public.goals(template_id, scheduled_date)
  where template_id is not null;

-- completed_at tracks completed via trigger, not app code, so it can't
-- drift out of sync regardless of which code path flips `completed`.
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
