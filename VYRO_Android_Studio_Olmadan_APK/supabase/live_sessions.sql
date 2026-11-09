-- VYRO invite-only live rooms. Run after the existing schema.sql.
create table if not exists public.live_sessions (
  id uuid primary key default gen_random_uuid(),
  room_code text unique not null,
  room_name text unique not null,
  host_user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'VYRO Canlı Yayın',
  status text not null default 'live' check (status in ('live','ended')),
  created_at timestamptz not null default now(),
  ended_at timestamptz
);
alter table public.live_sessions enable row level security;
-- Clients cannot create sessions or mint tokens directly. The Edge Function uses service role
-- after verifying the signed-in user. Host may read their own session rows.
create policy "host can read own live sessions" on public.live_sessions
  for select to authenticated using (auth.uid() = host_user_id);
create index if not exists live_sessions_code_status_idx on public.live_sessions(room_code,status);
