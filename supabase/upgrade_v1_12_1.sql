-- The Know Show v1.12.1 — server-only persistent category controls.
-- Run before deploying the new application. Safe to rerun.
create table if not exists public.know_show_category_availability (
 category_id text primary key,
 enabled boolean not null default true,
 updated_at timestamptz not null default now()
);
alter table public.know_show_category_availability enable row level security;
revoke all on public.know_show_category_availability from public, anon, authenticated;
grant select, insert, update on public.know_show_category_availability to service_role;
-- Hide unfinished landmark art until the developer explicitly enables the category.
insert into public.know_show_category_availability(category_id,enabled)
values ('famous-landmarks',false) on conflict (category_id) do nothing;
