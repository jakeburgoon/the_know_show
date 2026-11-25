-- Optional-format analytics reporting for v1.13.5; no stored records changed.
create or replace function public.ks_exposure_report() returns jsonb
language sql stable security invoker set search_path = '' as $$
 select jsonb_build_object(
  'showsStarted',(select count(*) from public.know_show_shows),
  'showsCompleted',(select count(*) from public.know_show_shows where completed_at is not null),
  'exposures',(select count(*) from public.know_show_question_exposures),
  'repeats',(select count(*) from public.know_show_question_exposures where diagnostic->>'seenBefore'='true'),
  'avoidableRepeats',(select count(*) from public.know_show_question_exposures where diagnostic->>'seenBefore'='true' and (diagnostic->>'unseenAvailable')::integer>0),
  'known',(select count(*) from public.know_show_question_exposures where diagnostic is not null),
  'questions',coalesce((select jsonb_agg(to_jsonb(q) order by q.plays desc,q.question_id) from (
    select question_id,category_id,level,count(*) as plays,
      count(*) filter(where diagnostic->>'seenBefore'='true') as repeats,
      count(*) filter(where diagnostic->>'seenBefore'='false') as fresh,
      count(*) filter(where stats is null) as unresolved,
      count(*) filter(where stats->>'skipped'='true') as skipped,
      coalesce(sum((stats->>'attempted')::int),0) as attempts,
      coalesce(sum((stats->>'correct')::int),0) as correct,
      coalesce(sum((stats->>'written')::int),0) as written,
      coalesce(sum((stats->>'writtenCorrect')::int),0) as written_correct,
      coalesce(sum((stats->>'choices')::int),0) as choices,
      coalesce(sum((stats->>'choicesCorrect')::int),0) as choices_correct,
      coalesce(sum((stats->>'hints')::int),0) as hints,
      coalesce(sum((stats->>'notAnswered')::int),0) as no_answer,
      coalesce(sum((stats->>'hintUsers')::int),0) as hint_users,
      coalesce(sum((stats->>'hintCount')::int),0) as hint_count,
      coalesce(sum((stats->>'optionsPurchases')::int),0) as options_purchases,
      coalesce(sum((stats->>'fiftyFiftyPurchases')::int),0) as fifty_fifty_purchases,
      coalesce(sum((stats->'assistanceCounts'->'written'->>'attempts')::int),0) as written_assistance_attempts,
      coalesce(sum((stats->'assistanceCounts'->'written'->>'correct')::int),0) as written_assistance_correct,
      coalesce(sum((stats->'assistanceCounts'->'provided-options'->>'attempts')::int),0) as provided_options_assistance_attempts,
      coalesce(sum((stats->'assistanceCounts'->'provided-options'->>'correct')::int),0) as provided_options_assistance_correct,
      coalesce(sum((stats->'assistanceCounts'->'purchased-options'->>'attempts')::int),0) as purchased_options_assistance_attempts,
      coalesce(sum((stats->'assistanceCounts'->'purchased-options'->>'correct')::int),0) as purchased_options_assistance_correct,
      coalesce(sum((stats->'assistanceCounts'->'fifty-fifty'->>'attempts')::int),0) as fifty_fifty_assistance_attempts,
      coalesce(sum((stats->'assistanceCounts'->'fifty-fifty'->>'correct')::int),0) as fifty_fifty_assistance_correct,
      coalesce(sum((stats->>'timed')::int),0) as timed,
      coalesce(sum((stats->>'responseMs')::bigint),0) as response_ms,
      coalesce(sum((stats->>'overturned')::int),0) as overturned
    from public.know_show_question_exposures group by question_id,category_id,level
  ) q),'[]'::jsonb),
  'recentShows',coalesce((select jsonb_agg(to_jsonb(s) || jsonb_build_object('questions',coalesce((select jsonb_agg(to_jsonb(e) order by revealed_at,question_id) from public.know_show_question_exposures e where e.show_id=s.show_id),'[]'::jsonb)) order by s.started_at desc) from (select * from public.know_show_shows order by started_at desc limit 50) s),'[]'::jsonb)
 );
$$;
revoke all on function public.ks_exposure_report() from public,anon,authenticated;
grant execute on function public.ks_exposure_report() to service_role;
