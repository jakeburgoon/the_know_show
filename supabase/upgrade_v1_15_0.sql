-- v1.15 library foundation. Additive; no existing records are modified.
-- DO NOT expose service-role credentials or these tables to browser clients.
create table if not exists public.know_show_question_revisions (
 revision bigint generated always as identity primary key,
 question_id text not null,
 kind text not null check(kind in ('regular','final')),
 payload jsonb not null check(jsonb_typeof(payload)='object'),
 previous_payload jsonb,
 reason text not null check(length(reason) between 1 and 1000),
 created_at timestamptz not null default now(),
 check(payload->>'id'=question_id)
);
create index if not exists ks_question_revisions_id on public.know_show_question_revisions(question_id,revision desc);
create table if not exists public.know_show_question_drafts (
 question_id text primary key,
 kind text not null check(kind in ('regular','final')),
 payload jsonb not null check(jsonb_typeof(payload)='object'),
 base_revision bigint not null default 0,
 reason text not null default '',
 updated_at timestamptz not null default now(),
 check(payload->>'id'=question_id)
);
-- Immutable catalog snapshots shared by shows using the same effective library.
create table if not exists public.know_show_library_snapshots (
 id text primary key check(id ~ '^[0-9a-f]{64}$'),
 payload jsonb not null check(jsonb_typeof(payload)='object'),
 created_at timestamptz not null default now()
);
alter table public.know_show_question_revisions enable row level security;
alter table public.know_show_question_drafts enable row level security;
alter table public.know_show_library_snapshots enable row level security;
revoke all on public.know_show_question_revisions,public.know_show_question_drafts,public.know_show_library_snapshots from public,anon,authenticated;
grant select on public.know_show_question_revisions to service_role;
grant select,insert,update,delete on public.know_show_question_drafts to service_role;
grant select,insert on public.know_show_library_snapshots to service_role;
-- One consistent export; no PostgREST 1,000-row pagination truncation.
create or replace function public.ks_library_export() returns jsonb language sql stable security definer set search_path=public,pg_temp as $$
 select jsonb_build_object('schemaVersion',1,'watermark',coalesce(max(revision),0),'revisions',coalesce(jsonb_agg(to_jsonb(r) order by revision),'[]'::jsonb)) from public.know_show_question_revisions r;
$$;
-- Publication is globally serialized. The server validates the proposed bank before calling this RPC.
-- Reject concurrent changes in the bank or category availability; never silently overwrite newer edits.
create or replace function public.ks_publish_question(p_watermark bigint,p_disabled text[],p_id text,p_kind text,p_payload jsonb,p_previous jsonb,p_reason text,p_resolve boolean) returns bigint language plpgsql security definer set search_path=public,pg_temp as $$
 declare current_watermark bigint; disabled text[]; new_revision bigint;
 begin
 perform pg_advisory_xact_lock(151500);
 select coalesce(max(revision),0) into current_watermark from public.know_show_question_revisions;
 select coalesce(array_agg(category_id order by category_id COLLATE "C"),'{}'::text[]) into disabled from public.know_show_category_availability where not enabled;
 if p_watermark<>current_watermark or disabled is distinct from p_disabled then raise exception 'Library changed; refresh and retry' using errcode='40001'; end if;
 insert into public.know_show_question_revisions(question_id,kind,payload,previous_payload,reason) values(p_id,p_kind,p_payload,p_previous,p_reason) returning revision into new_revision;
 delete from public.know_show_question_drafts where question_id=p_id;
 if p_resolve then update public.know_show_feedback set status='resolved' where kind='question' and question_id=p_id and status in ('new','under-review'); end if;
 return new_revision;
 end;
$$;
create or replace function public.ks_set_library_category(p_watermark bigint,p_disabled text[],p_id text,p_enabled boolean) returns void language plpgsql security definer set search_path=public,pg_temp as $$
 declare current_watermark bigint; disabled text[];
 begin
 perform pg_advisory_xact_lock(151500);
 select coalesce(max(revision),0) into current_watermark from public.know_show_question_revisions;
 select coalesce(array_agg(category_id order by category_id COLLATE "C"),'{}'::text[]) into disabled from public.know_show_category_availability where not enabled;
 if p_watermark<>current_watermark or disabled is distinct from p_disabled then raise exception 'Library changed; refresh and retry' using errcode='40001'; end if;
 insert into public.know_show_category_availability(category_id,enabled,updated_at) values(p_id,p_enabled,now()) on conflict(category_id) do update set enabled=excluded.enabled,updated_at=excluded.updated_at;
 end;
$$;
revoke all on function public.ks_library_export(),public.ks_publish_question(bigint,text[],text,text,jsonb,jsonb,text,boolean),public.ks_set_library_category(bigint,text[],text,boolean) from public,anon,authenticated;
grant execute on function public.ks_library_export(),public.ks_publish_question(bigint,text[],text,text,jsonb,jsonb,text,boolean),public.ks_set_library_category(bigint,text[],text,boolean) to service_role;
