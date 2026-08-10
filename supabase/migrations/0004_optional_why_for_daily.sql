-- Cracked — Phase 4 migration: daily tasks no longer require a "why" note.
-- A quick capture shouldn't demand a reason before it can be saved; every
-- other level (yearly/quarterly/monthly/weekly) still requires one.

alter table public.goals drop constraint if exists goals_why_note_check;
alter table public.goals add constraint goals_why_note_check
  check (level = 'daily' or char_length(trim(why_note)) > 0);
