-- The Know Show v1.13.0. Additive; run before deployment. Pseudonymous browser history; no accounts or child profiles.
-- Keep the room revision and its exposure journal in one transaction.
begin;
create table if not exists public.know_show_history_hosts (
 host_key text primary key,
 initialized_at timestamptz not null default now()
);
create table if not exists public.know_show_exposure_history (
 host_key text not null,
 kind text not null check (kind in ('question','category','offer')),
 item_id text not null,
 last_seen timestamptz not null,
 primary key(host_key,kind,item_id)
);
create table if not exists public.know_show_shows (
 show_id text primary key,
 started_at timestamptz not null,
 completed_at timestamptz,
 tracked_from_start boolean not null default false,
 seats integer not null,
 mode text not null,
 app_version text not null default '1.13.0',
 selected jsonb not null default '[[],[]]'::jsonb,
 offers jsonb not null default '{}'::jsonb,
 offer_diagnostics jsonb not null default '{}'::jsonb,
 history_scopes integer not null default 1
);
alter table public.know_show_shows add column if not exists offer_diagnostics jsonb not null default '{}'::jsonb;
alter table public.know_show_shows add column if not exists history_scopes integer not null default 1;
alter table public.know_show_shows add column if not exists app_version text not null default '1.13.0';
create index if not exists know_show_shows_started_idx on public.know_show_shows(started_at desc);
create table if not exists public.know_show_question_exposures (
 show_id text not null references public.know_show_shows(show_id),
 question_id text not null,
 category_id text not null,
 level integer not null check(level between 1 and 4),
 round_number integer not null,
 revealed_at timestamptz not null,
 diagnostic jsonb,
 stats jsonb,
 primary key(show_id,question_id)
);
create index if not exists know_show_exposures_question_idx on public.know_show_question_exposures(question_id);
alter table public.know_show_history_hosts enable row level security;
alter table public.know_show_exposure_history enable row level security;
alter table public.know_show_shows enable row level security;
alter table public.know_show_question_exposures enable row level security;
revoke all on public.know_show_history_hosts,public.know_show_exposure_history,public.know_show_shows,public.know_show_question_exposures from public,anon,authenticated;
grant select,insert,update on public.know_show_history_hosts,public.know_show_exposure_history,public.know_show_shows,public.know_show_question_exposures to service_role;

create or replace function public.ks_read_exposure_history(p_host_key text) returns jsonb
language sql stable security invoker set search_path = '' as $$
 select jsonb_build_object(
  'initialized', exists(select 1 from public.know_show_history_hosts where host_key=p_host_key),
  'recentQuestionIds',coalesce((select jsonb_agg(item_id order by last_seen,item_id) from public.know_show_exposure_history where host_key=p_host_key and kind='question'),'[]'::jsonb),
  'recentCategoryIds',coalesce((select jsonb_agg(item_id order by last_seen,item_id) from public.know_show_exposure_history where host_key=p_host_key and kind='category'),'[]'::jsonb),
  'recentCategoryOffers',coalesce((select jsonb_agg(item_id order by last_seen,item_id) from public.know_show_exposure_history where host_key=p_host_key and kind='offer'),'[]'::jsonb)
 );
$$;

create or replace function public.ks_read_group_exposure_history(p_keys text[]) returns jsonb
language sql stable security invoker set search_path = '' as $$
 with items as (
  select kind,item_id,max(last_seen) as latest,count(*) as seen_by
  from public.know_show_exposure_history where host_key=any(p_keys) group by kind,item_id
 )
 select jsonb_build_object(
 'recentQuestionIds',coalesce((select jsonb_agg(item_id order by latest,item_id) from items where kind='question'),'[]'::jsonb),
 'recentCategoryIds',coalesce((select jsonb_agg(item_id order by latest,item_id) from items where kind='category'),'[]'::jsonb),
 'recentCategoryOffers',coalesce((select jsonb_agg(item_id order by latest,item_id) from items where kind='offer'),'[]'::jsonb),
 'questionSeenCounts',coalesce((select jsonb_object_agg(item_id,seen_by) from items where kind='question'),'{}'::jsonb)
 );
$$;
create or replace function public.ks_commit_room_exposure(p_code text,p_revision bigint,p_snapshot jsonb,p_journal jsonb) returns boolean
language plpgsql security invoker set search_path = '' as $$
declare
 h text:=p_journal->>'hostKey'; sid text:=p_journal->>'showId'; stamp timestamptz:=(p_journal->>'at')::timestamptz;
 item jsonb; k text; scope_key text; seed_key text; pair record; seed jsonb:=p_journal->'seed'; started boolean:=coalesce((p_journal->>'started')::boolean,false);
 completed boolean:=coalesce((p_journal->>'complete')::boolean,false); n integer;
begin
 update public.know_show_rooms set snapshot=p_snapshot,revision=p_revision+1,updated_at=now() where code=p_code and revision=p_revision;
 get diagnostics n=row_count;
 if n=0 then return false; end if;
 -- Seed old histories once; old records are intentionally older than new reveal events.
 if started then
  insert into public.know_show_history_hosts(host_key) values(h) on conflict do nothing;
  get diagnostics n=row_count;
  if n=1 and jsonb_typeof(seed)='object' then
   for k,seed_key in select * from (values ('question','questions'),('category','categories'),('offer','offers')) as v(k1,k2) loop
    insert into public.know_show_exposure_history(host_key,kind,item_id,last_seen)
    select h,k,value, timestamptz '1970-01-01 00:00:00+00' + ordinality * interval '1 millisecond'
    from jsonb_array_elements_text(coalesce(seed->seed_key,'[]'::jsonb)) with ordinality as t(value,ordinality)
    on conflict do nothing;
   end loop;
  end if;
 end if;
 if started or completed or jsonb_array_length(p_journal->'exposures')>0 or jsonb_array_length(p_journal->'newSelected')>0 or p_journal->'offers'<>'{}'::jsonb then
  insert into public.know_show_shows(show_id,started_at,completed_at,tracked_from_start,seats,mode,selected,offers,offer_diagnostics,history_scopes)
  values(sid,stamp,case when completed then stamp else null end,started,(p_journal->>'seats')::int,p_journal->>'mode',p_journal->'selected',p_journal->'offers',coalesce(p_journal->'offerDiagnostics','{}'::jsonb),coalesce((p_journal->>'historyScopes')::int,1))
  on conflict(show_id) do update set completed_at=coalesce(public.know_show_shows.completed_at,excluded.completed_at),
    selected=excluded.selected,offers=public.know_show_shows.offers||excluded.offers,offer_diagnostics=public.know_show_shows.offer_diagnostics||excluded.offer_diagnostics;
  for item in select value from jsonb_array_elements(p_journal->'newSelected') loop
   for scope_key in select distinct value from jsonb_array_elements_text(p_journal->'historyKeys') loop
    insert into public.know_show_exposure_history values(scope_key,'category',item#>>'{}',stamp)
    on conflict(host_key,kind,item_id) do update set last_seen=greatest(public.know_show_exposure_history.last_seen,excluded.last_seen);
   end loop;
  end loop;
  for pair in select key,value from jsonb_each(p_journal->'offers') loop
   for item in select value from jsonb_array_elements(pair.value) loop
    for scope_key in select distinct value from jsonb_array_elements_text(p_journal->'historyKeys') loop
     insert into public.know_show_exposure_history values(scope_key,'offer',item#>>'{}',stamp)
     on conflict(host_key,kind,item_id) do update set last_seen=greatest(public.know_show_exposure_history.last_seen,excluded.last_seen);
    end loop;
   end loop;
  end loop;
  for item in select value from jsonb_array_elements(p_journal->'exposures') loop
   insert into public.know_show_question_exposures(show_id,question_id,category_id,level,round_number,revealed_at,diagnostic,stats)
   values(sid,item->>'id',item->>'category',(item->>'level')::int,(item->>'round')::int,(item->>'at')::timestamptz,nullif(item->'diagnostic','null'::jsonb),nullif(item->'stats','null'::jsonb))
   on conflict(show_id,question_id) do nothing;
   get diagnostics n=row_count;
   if n=1 then
    for scope_key in select distinct value from jsonb_array_elements_text(p_journal->'historyKeys') loop
     insert into public.know_show_exposure_history values(scope_key,'question',item->>'id',(item->>'at')::timestamptz)
     on conflict(host_key,kind,item_id) do update set last_seen=greatest(public.know_show_exposure_history.last_seen,excluded.last_seen);
    end loop;
   end if;
   -- Update aggregate results after resolution and host corrections, without counting another exposure.
   if jsonb_typeof(item->'stats')='object' then
    update public.know_show_question_exposures set stats=item->'stats' where show_id=sid and question_id=item->>'id';
   end if;
  end loop;
 end if;
 return true;
end;
$$;

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
      coalesce(sum((stats->>'timed')::int),0) as timed,
      coalesce(sum((stats->>'responseMs')::bigint),0) as response_ms,
      coalesce(sum((stats->>'overturned')::int),0) as overturned
    from public.know_show_question_exposures group by question_id,category_id,level
  ) q),'[]'::jsonb),
  'recentShows',coalesce((select jsonb_agg(to_jsonb(s) || jsonb_build_object('questions',coalesce((select jsonb_agg(to_jsonb(e) order by revealed_at,question_id) from public.know_show_question_exposures e where e.show_id=s.show_id),'[]'::jsonb)) order by s.started_at desc) from (select * from public.know_show_shows order by started_at desc limit 50) s),'[]'::jsonb)
 );
$$;
revoke all on function public.ks_read_group_exposure_history(text[]) from public,anon,authenticated;
revoke all on function public.ks_read_exposure_history(text) from public,anon,authenticated;
revoke all on function public.ks_commit_room_exposure(text,bigint,jsonb,jsonb) from public,anon,authenticated;
revoke all on function public.ks_exposure_report() from public,anon,authenticated;
grant execute on function public.ks_read_group_exposure_history(text[]),public.ks_read_exposure_history(text),public.ks_commit_room_exposure(text,bigint,jsonb,jsonb),public.ks_exposure_report() to service_role;
commit;
