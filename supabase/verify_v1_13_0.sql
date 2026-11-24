-- Optional post-migration smoke test. No lasting records: transaction rolls back.
begin;
do $$
declare
  c text := upper(substr(md5(random()::text),1,6));
  h text := 'smoke-host-' || gen_random_uuid()::text;
  g text := 'smoke-guest-' || gen_random_uuid()::text;
  sid text := 'smoke-show-' || gen_random_uuid()::text;
  j jsonb;
  x jsonb;
  q text := 'smoke-question';
  ts text := now()::text;
begin
  insert into public.know_show_rooms(code,host_token_hash,snapshot,revision) values(c,'smoke-test','{}'::jsonb,0);
  j:=jsonb_build_object('showId',sid,'hostKey',h,'historyKeys',jsonb_build_array(h,g),'started',true,'complete',false,'at',ts,'seats',2,'mode','individual','historyScopes',2,'selected','[[],[]]'::jsonb,'offers','{"1":["test-category"]}'::jsonb,'offerDiagnostics','{}'::jsonb,'newSelected','[]'::jsonb,'exposures','[]'::jsonb,'seed','{"questions":["old-question"],"categories":[],"offers":[]}'::jsonb);
  if not public.ks_commit_room_exposure(c,0,'{"phase":"draft"}'::jsonb,j) then raise exception 'Start did not commit'; end if;
  if public.ks_commit_room_exposure(c,0,'{}'::jsonb,j) then raise exception 'Stale revision was accepted'; end if;
  x:=public.ks_read_group_exposure_history(array[h,g]);
  if (x->'questionSeenCounts'->>'old-question')::int is distinct from 1 then raise exception 'Seed did not persist'; end if;
  j:=j||jsonb_build_object('started',false,'seed',null,'offers','{}'::jsonb,'selected','[["test-category"],[]]'::jsonb,'newSelected','["test-category"]'::jsonb,'exposures',jsonb_build_array(jsonb_build_object('id',q,'category','test-category','level',1,'round',1,'at',ts,'diagnostic','{"seenBefore":false,"unseenAvailable":4}'::jsonb,'stats',null)));
  if not public.ks_commit_room_exposure(c,1,'{"phase":"question"}'::jsonb,j) then raise exception 'Reveal did not commit'; end if;
  x:=public.ks_read_group_exposure_history(array[h,g]);
  if (x->'questionSeenCounts'->>q)::int is distinct from 2 then raise exception 'Exposure not visible in both histories'; end if;
  j:=j||jsonb_build_object('newSelected','[]'::jsonb,'exposures',jsonb_build_array(jsonb_build_object('id',q,'category','test-category','level',1,'round',1,'at',ts,'diagnostic',null,'stats','{"attempted":2,"correct":1}'::jsonb)));
  if not public.ks_commit_room_exposure(c,2,'{"phase":"results"}'::jsonb,j) then raise exception 'Resolution did not commit'; end if;
  if (select count(*) from public.know_show_question_exposures where show_id=sid)<>1 then raise exception 'Duplicate question exposure'; end if;
  if (select (stats->>'correct')::int from public.know_show_question_exposures where show_id=sid and question_id=q) is distinct from 1 then raise exception 'Result not updated'; end if;
  perform public.ks_exposure_report();
  raise notice 'PASS: atomic start/reveal/result, group history, duplicate prevention, report.';
end $$;
rollback;
