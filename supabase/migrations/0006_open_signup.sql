-- Cracked — removes the invite-only gate entirely: signup is open to
-- anyone now. Drops the enforcement trigger, both of its functions, and
-- the allowed_emails table itself (the app no longer calls any of this).

drop trigger if exists enforce_invite_only on auth.users;
drop function if exists public.enforce_invite_only();
drop function if exists public.is_email_allowed(text);
drop table if exists public.allowed_emails;
