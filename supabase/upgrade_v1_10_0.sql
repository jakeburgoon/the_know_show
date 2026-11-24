-- The Know Show v1.10.0: additive, safe to rerun. No changes to existing rooms/members.
create table if not exists public.know_show_feedback (
 id uuid primary key default gen_random_uuid(),
 created_at timestamptz not null default now(),
 dedupe_key text not null unique,
 show_id text not null,
 app_version text not null,
 kind text not null check (kind in ('question','show')),
 question_id text,
 question jsonb,
 reasons text[] not null default '{}',
 comment text not null default '',
 rating integer check (rating between 1 and 5),
 experience text not null default '',
 category_ideas text not null default '',
 status text not null default 'new' check (status in ('new','under-review','resolved','no-change')),
 check ((kind='question' and question_id is not null and question is not null) or (kind='show' and question_id is null and question is null))
);
create index if not exists know_show_feedback_status_idx on public.know_show_feedback(status,created_at desc);
create index if not exists know_show_feedback_question_idx on public.know_show_feedback(question_id,created_at desc);
alter table public.know_show_feedback enable row level security;
revoke all on public.know_show_feedback from public, anon, authenticated;
grant select,insert,update on public.know_show_feedback to service_role;
-- No public policies. Only server-side routes use the service-role key.
