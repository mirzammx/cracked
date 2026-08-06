-- Cracked — Phase 3 migration: invite-only signup, onboarding example data.
-- Everything else requested (scheduled_date, is_template, recurrence_rule,
-- completed_at, template_id, standalone daily tasks, RLS on goals) already
-- shipped in migration 0002 and is confirmed live on this project — this
-- migration only adds what's actually new.

-- ── Onboarding flag ──────────────────────────────────────────────────
-- Marks rows seeded into a brand-new account so the user can tell them
-- apart from their own goals and delete them once they've got the idea.
alter table public.goals add column is_example boolean not null default false;

-- ── Invite list ──────────────────────────────────────────────────────
-- RLS is enabled with NO policies at all — on purpose. Nobody (anon or
-- authenticated) can select/insert/update/delete this table directly;
-- it's managed by hand from the SQL Editor or Table Editor (which uses
-- the postgres role and bypasses RLS), and the only sanctioned read path
-- is the security-definer function below, which returns a boolean, never
-- the list itself.
create table public.allowed_emails (
  email text primary key,
  note text,
  created_at timestamptz not null default now()
);
alter table public.allowed_emails enable row level security;

create or replace function public.is_email_allowed(check_email text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.allowed_emails where lower(email) = lower(check_email)
  );
$$;

-- Callable pre-signup, before there's a session — the app's login form
-- checks this first and shows "not invited yet" without ever calling
-- Supabase Auth for a disallowed email.
grant execute on function public.is_email_allowed(text) to anon, authenticated;

-- ── Enforcement at the database level ────────────────────────────────
-- The app-side check above is for a clean error message; this trigger is
-- what actually stops account creation, in case anything ever calls the
-- Supabase Auth API directly instead of going through the app. A blocked
-- insert here reaches the client as a generic "Database error saving new
-- user" (Supabase's GoTrue doesn't forward custom exception text from
-- auth.users triggers) — that's fine, it's a backstop, not the primary
-- UX path.
create or replace function public.enforce_invite_only()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_email_allowed(new.email) then
    raise exception 'not_invited';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_invite_only on auth.users;
create trigger enforce_invite_only
  before insert on auth.users
  for each row execute function public.enforce_invite_only();
