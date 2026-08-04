-- Dev seed data, ported from the original design reference (SEED const in
-- its embedded component), extended with scheduling, a couple of
-- recurring templates, and some backdated history so the Insights
-- heatmap has something real to render. Run after signing up one user
-- through Supabase Auth — this seeds everything under that user's first
-- account.
--
-- Usage: psql "$DATABASE_URL" -f supabase/seed.sql

do $$
declare
  uid uuid;
  y1 uuid; q1 uuid; m1 uuid; w1 uuid; w2 uuid; m2 uuid; w3 uuid;
  q2 uuid; m3 uuid; w4 uuid;
  y2 uuid; q3 uuid; m4 uuid; w5 uuid; m5 uuid; w6 uuid;
  y3 uuid; q4 uuid; m6 uuid; w7 uuid;
  run_template uuid;
  d date;
  r double precision;
begin
  select id into uid from auth.users order by created_at limit 1;
  if uid is null then
    raise exception 'no auth.users row found — sign up first, then re-run this seed';
  end if;

  -- Branch 1: Business
  insert into public.goals (user_id, level, title, why_note) values
    (uid, 'yearly', 'Build a business that outlives the job', 'So my hours compound into something that is mine.')
    returning id into y1;
  insert into public.goals (user_id, parent_id, level, title, why_note) values
    (uid, y1, 'quarterly', 'Launch the product', 'Nothing is real until strangers can pay.') returning id into q1;
  insert into public.goals (user_id, parent_id, level, title, why_note) values
    (uid, q1, 'monthly', 'Ship the MVP', 'Momentum needs a finish line.') returning id into m1;
  insert into public.goals (user_id, parent_id, level, title, why_note) values
    (uid, m1, 'weekly', 'Wire up billing', 'Users cannot pay for a product with no checkout.') returning id into w1;
  insert into public.goals (user_id, parent_id, level, title, why_note, scheduled_date) values
    (uid, w1, 'daily', 'Stripe test-mode checkout', 'Ship the smallest working payment path first.', current_date),
    (uid, w1, 'daily', 'Pricing page copy', 'People pay for what they understand.', current_date);
  insert into public.goals (user_id, parent_id, level, title, why_note, scheduled_date, completed) values
    (uid, w1, 'daily', 'Trial expiry logic', 'A trial that never ends is not a trial.', current_date - 1, true);
  insert into public.goals (user_id, parent_id, level, title, why_note) values
    (uid, m1, 'weekly', 'Onboarding flow', 'The first five minutes decide if they come back.') returning id into w2;
  insert into public.goals (user_id, parent_id, level, title, why_note, scheduled_date, completed) values
    (uid, w2, 'daily', 'First-run empty states', 'A blank screen reads as broken, not new.', current_date - 2, true);
  insert into public.goals (user_id, parent_id, level, title, why_note, scheduled_date) values
    (uid, w2, 'daily', 'Welcome email sequence', 'Most people never come back on their own.', current_date + 1);
  insert into public.goals (user_id, parent_id, level, title, why_note) values
    (uid, q1, 'monthly', 'First 50 real users', 'Fifty honest opinions beat fifty guesses.') returning id into m2;
  insert into public.goals (user_id, parent_id, level, title, why_note) values
    (uid, m2, 'weekly', 'Ten beta calls', 'Watching someone use it beats asking them about it.') returning id into w3;
  insert into public.goals (user_id, parent_id, level, title, why_note, scheduled_date) values
    (uid, w3, 'daily', 'DM five waitlist people', 'The list is worthless until it becomes conversations.', current_date);
  insert into public.goals (user_id, parent_id, level, title, why_note) values
    (uid, y1, 'quarterly', 'Reach $2k monthly revenue', 'Enough to buy another quarter of runway.') returning id into q2;
  insert into public.goals (user_id, parent_id, level, title, why_note) values
    (uid, q2, 'monthly', 'Landing page into a funnel', 'Traffic without a funnel is just visits.') returning id into m3;
  insert into public.goals (user_id, parent_id, level, title, why_note) values
    (uid, m3, 'weekly', 'Draft the launch note', 'The story has to exist before it can spread.') returning id into w4;
  insert into public.goals (user_id, parent_id, level, title, why_note, scheduled_date) values
    (uid, w4, 'daily', 'Outline the story, not features', 'Nobody forwards a changelog.', current_date + 2);

  -- Branch 2: Body
  insert into public.goals (user_id, level, title, why_note) values
    (uid, 'yearly', 'Be stronger at forty than at thirty', 'The body is the container for everything else.') returning id into y2;
  insert into public.goals (user_id, parent_id, level, title, why_note) values
    (uid, y2, 'quarterly', 'Finish a half marathon', 'A date on a calendar beats intentions.') returning id into q3;
  insert into public.goals (user_id, parent_id, level, title, why_note) values
    (uid, q3, 'monthly', 'Build the aerobic base', 'Speed without a base just breaks down.') returning id into m4;
  insert into public.goals (user_id, parent_id, level, title, why_note) values
    (uid, m4, 'weekly', 'Three runs, 24km', 'Consistency beats any single heroic run.') returning id into w5;
  insert into public.goals (user_id, parent_id, level, title, why_note, scheduled_date) values
    (uid, w5, 'daily', 'Easy 6km before work', 'Done before the day can talk me out of it.', current_date);
  insert into public.goals (user_id, parent_id, level, title, why_note, scheduled_date, completed) values
    (uid, w5, 'daily', 'Hill intervals', 'Strength on hills is speed everywhere else.', current_date - 1, true);
  insert into public.goals (user_id, parent_id, level, title, why_note, scheduled_date) values
    (uid, w5, 'daily', 'Long run, 12km', 'The distance the race actually asks for.', current_date + 3);
  insert into public.goals (user_id, parent_id, level, title, why_note) values
    (uid, q3, 'monthly', 'Fix the sleep window', 'Training without recovery is just damage.') returning id into m5;
  insert into public.goals (user_id, parent_id, level, title, why_note) values
    (uid, m5, 'weekly', 'Lights out by eleven', 'Every good habit is downstream of sleep.') returning id into w6;
  insert into public.goals (user_id, parent_id, level, title, why_note, scheduled_date, completed) values
    (uid, w6, 'daily', 'Phone out of the bedroom', 'The scroll is the thing that steals the hour.', current_date, true);

  -- A goal-linked recurring template: Mon/Wed/Fri runs under "Three runs, 24km".
  -- The generation job creates today's instance (if due) from this row —
  -- it isn't itself a task, so it carries no scheduled_date.
  insert into public.goals (user_id, parent_id, level, title, why_note, is_template, recurrence_rule) values
    (uid, w5, 'daily', 'Easy 6km run', 'Base miles compound; heroics don''t.', true, 'mon,wed,fri')
    returning id into run_template;

  -- Branch 3: Reading
  insert into public.goals (user_id, level, title, why_note) values
    (uid, 'yearly', 'Read more than I scroll', 'I want my attention back before I lose the habit of depth.') returning id into y3;
  insert into public.goals (user_id, parent_id, level, title, why_note) values
    (uid, y3, 'quarterly', 'Six books, no skimming', 'Depth over a longer list.') returning id into q4;
  insert into public.goals (user_id, parent_id, level, title, why_note) values
    (uid, q4, 'monthly', 'Finish the nightstand book', 'One unfinished book quietly kills the next one.') returning id into m6;
  insert into public.goals (user_id, parent_id, level, title, why_note) values
    (uid, m6, 'weekly', 'Thirty pages a night', 'Small and repeatable beats ambitious and rare.') returning id into w7;
  insert into public.goals (user_id, parent_id, level, title, why_note, scheduled_date) values
    (uid, w7, 'daily', 'Thirty pages after dinner', 'Same slot every night, no negotiating.', current_date);

  -- Standalone recurring template: weekday errand with no goal attached.
  insert into public.goals (user_id, parent_id, level, title, why_note, is_template, recurrence_rule) values
    (uid, null, 'daily', 'Check email inbox to zero', 'An overflowing inbox is a hidden task list.', true, 'weekdays');

  -- Standalone one-off tasks (not linked to any goal).
  insert into public.goals (user_id, parent_id, level, title, why_note, scheduled_date) values
    (uid, null, 'daily', 'Renew car registration', 'It expires this week.', current_date),
    (uid, null, 'daily', 'Call the dentist', 'Overdue for a cleaning.', current_date + 1);

  -- Two weeks of backdated "Easy 6km run" instances (as if the template
  -- had already been generating for a while), with a mix of completed,
  -- skipped, and still-open, so the Insights heatmap has real variation.
  for d in select generate_series(current_date - 13, current_date - 1, interval '1 day')::date loop
    if trim(to_char(d, 'Dy')) in ('Mon', 'Wed', 'Fri') then
      r := random();
      insert into public.goals (
        user_id, parent_id, level, title, why_note, scheduled_date, template_id, completed, skipped_reason, skipped_at
      ) values (
        uid, w5, 'daily', 'Easy 6km run', 'Base miles compound; heroics don''t.', d, run_template,
        r < 0.65,
        case when r >= 0.65 and r < 0.85 then 'Ran out of time' else null end,
        case when r >= 0.65 and r < 0.85 then (d::timestamptz + interval '20 hours') else null end
      );
    end if;
  end loop;
end $$;
