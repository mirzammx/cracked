-- Cracked — narrows the "why" requirement further than migration 0004:
-- required only on yearly/quarterly (where drift actually happens),
-- optional on monthly/weekly/daily so fast capture isn't taxed for a reason.

alter table public.goals drop constraint if exists goals_why_note_check;
alter table public.goals add constraint goals_why_note_check
  check (level not in ('yearly', 'quarterly') or char_length(trim(why_note)) > 0);
