-- The Know Show — run this once in Supabase SQL Editor.
-- All access happens through server-only Next.js routes and a server-side service key.
CREATE TABLE IF NOT EXISTS public.know_show_rooms (
  code text PRIMARY KEY CHECK (length(code) = 6),
  host_token_hash text NOT NULL,
  snapshot jsonb NOT NULL,
  revision bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.know_show_members (
  id uuid PRIMARY KEY,
  room_code text NOT NULL REFERENCES public.know_show_rooms(code) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  joined_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS know_show_members_room_idx ON public.know_show_members(room_code);

ALTER TABLE public.know_show_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.know_show_members ENABLE ROW LEVEL SECURITY;
-- No public policies: browsers may not read raw snapshots or member secrets.
-- Do not expose SUPABASE_SERVICE_ROLE_KEY in frontend environment variables.
