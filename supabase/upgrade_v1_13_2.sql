-- v1.13.2: aggregate adult age bands across shows; no new personal profile table.
-- Run after upgrade_v1_13_0.sql. Existing results remain unchanged.
begin;
create or replace function public.ks_age_question_report() returns jsonb
language sql stable security invoker set search_path = '' as $$
 select coalesce(jsonb_agg(to_jsonb(q) order by q.question_id,q.age_band),'[]'::jsonb) from (
  select e.question_id,a.key as age_band,count(distinct e.show_id) filter(where (a.value->>'attempts')::bigint>0) as shows,
   sum((a.value->>'attempts')::bigint) as attempts,
   sum((a.value->>'correct')::bigint) as correct,
   case when sum((a.value->>'written')::bigint)>=10 and count(distinct e.show_id) filter(where (a.value->>'written')::bigint>0)>=5 then sum((a.value->>'written')::bigint) end as written,
   case when sum((a.value->>'written')::bigint)>=10 and count(distinct e.show_id) filter(where (a.value->>'written')::bigint>0)>=5 then sum((a.value->>'writtenCorrect')::bigint) end as written_correct,
   case when sum((a.value->>'choices')::bigint)>=10 and count(distinct e.show_id) filter(where (a.value->>'choices')::bigint>0)>=5 then sum((a.value->>'choices')::bigint) end as choices,
   case when sum((a.value->>'choices')::bigint)>=10 and count(distinct e.show_id) filter(where (a.value->>'choices')::bigint>0)>=5 then sum((a.value->>'choicesCorrect')::bigint) end as choices_correct
  from public.know_show_question_exposures e
  cross join lateral jsonb_each(coalesce(e.stats->'ageSummary','{}'::jsonb)) a
  where a.key in ('18-29','30-49','50-plus') and e.stats->>'skipped' is distinct from 'true'
  group by e.question_id,a.key
  -- Small cells suppressed. This counts shows/attempts, not distinct people.
  having count(distinct e.show_id) filter(where (a.value->>'attempts')::bigint>0)>=5
     and sum((a.value->>'attempts')::bigint)>=10
 ) q;
$$;
revoke all on function public.ks_age_question_report() from public,anon,authenticated;
grant execute on function public.ks_age_question_report() to service_role;
commit;
