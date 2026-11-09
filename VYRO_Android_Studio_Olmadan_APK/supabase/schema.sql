-- VYRO başlangıç veritabanı şeması
-- Supabase SQL Editor içinde çalıştır.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  bio text default '',
  avatar_url text,
  is_private boolean default false,
  created_at timestamptz default now()
);
create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  caption text default '',
  video_url text not null,
  storage_path text,
  visibility text not null default 'public' check (visibility in ('public','followers','private')),
  created_at timestamptz default now()
);
create table if not exists public.likes (
  video_id uuid references public.videos(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  primary key(video_id,user_id)
);
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  video_id uuid references public.videos(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz default now()
);
create table if not exists public.follows (
  follower_id uuid references auth.users(id) on delete cascade,
  following_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  primary key(follower_id,following_id),
  check(follower_id <> following_id)
);
create table if not exists public.series (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text default '',
  cover_url text,
  created_at timestamptz default now()
);
create table if not exists public.episodes (
  id uuid primary key default gen_random_uuid(),
  series_id uuid references public.series(id) on delete cascade,
  video_id uuid references public.videos(id) on delete cascade,
  episode_number integer not null,
  title text default '',
  unique(series_id,episode_number)
);
create table if not exists public.video_chains (
  id uuid primary key default gen_random_uuid(),
  parent_video_id uuid references public.videos(id) on delete cascade,
  child_video_id uuid references public.videos(id) on delete cascade,
  created_at timestamptz default now(),
  unique(parent_video_id,child_video_id),
  check(parent_video_id <> child_video_id)
);
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid references auth.users(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  kind text not null,
  entity_id uuid,
  is_read boolean default false,
  created_at timestamptz default now()
);
create table if not exists public.blocks (
  blocker_id uuid references auth.users(id) on delete cascade,
  blocked_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  primary key(blocker_id,blocked_id),
  check(blocker_id <> blocked_id)
);
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references auth.users(id) on delete cascade,
  target_user_id uuid references auth.users(id) on delete cascade,
  video_id uuid references public.videos(id) on delete cascade,
  reason text not null,
  details text default '',
  status text default 'pending',
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.videos enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
alter table public.follows enable row level security;
alter table public.series enable row level security;
alter table public.episodes enable row level security;
alter table public.video_chains enable row level security;
alter table public.notifications enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;

create policy "profiles readable" on public.profiles for select using (true);
create policy "profile owner insert" on public.profiles for insert with check (auth.uid()=id);
create policy "profile owner update" on public.profiles for update using (auth.uid()=id) with check (auth.uid()=id);

create policy "public videos readable" on public.videos for select using (visibility='public' or auth.uid()=user_id);
create policy "video owner insert" on public.videos for insert with check (auth.uid()=user_id);
create policy "video owner update" on public.videos for update using (auth.uid()=user_id);
create policy "video owner delete" on public.videos for delete using (auth.uid()=user_id);

create policy "likes readable" on public.likes for select using (true);
create policy "like own insert" on public.likes for insert with check (auth.uid()=user_id);
create policy "like own delete" on public.likes for delete using (auth.uid()=user_id);
create policy "comments readable" on public.comments for select using (true);
create policy "comment own insert" on public.comments for insert with check (auth.uid()=user_id);
create policy "comment own delete" on public.comments for delete using (auth.uid()=user_id);
create policy "follows readable" on public.follows for select using (true);
create policy "follow own insert" on public.follows for insert with check (auth.uid()=follower_id);
create policy "follow own delete" on public.follows for delete using (auth.uid()=follower_id);

create policy "series readable" on public.series for select using (true);
create policy "series owner insert" on public.series for insert with check (auth.uid()=user_id);
create policy "series owner update" on public.series for update using (auth.uid()=user_id);
create policy "episodes readable" on public.episodes for select using (true);
create policy "episode owner insert" on public.episodes for insert with check (exists(select 1 from public.series s where s.id=series_id and s.user_id=auth.uid()));
create policy "chains readable" on public.video_chains for select using (true);
create policy "chain owner insert" on public.video_chains for insert with check (exists(select 1 from public.videos v where v.id=child_video_id and v.user_id=auth.uid()));

create policy "notifications recipient read" on public.notifications for select using (auth.uid()=recipient_id);
create policy "notifications recipient update" on public.notifications for update using (auth.uid()=recipient_id);
create policy "blocks owner all" on public.blocks for all using (auth.uid()=blocker_id) with check (auth.uid()=blocker_id);
create policy "reports reporter insert" on public.reports for insert with check (auth.uid()=reporter_id);
create policy "reports reporter read" on public.reports for select using (auth.uid()=reporter_id);

-- Yeni hesap açıldığında profil oluştur.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id,username,display_name)
  values(new.id, coalesce(new.raw_user_meta_data->>'username','vyro_'||substr(new.id::text,1,8)),
         coalesce(new.raw_user_meta_data->>'username','VYRO kullanıcısı'))
  on conflict (id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Storage bucket oluştur (video boyutu ve kota Supabase planına tabidir).
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('videos','videos',true,104857600,array['video/mp4','video/quicktime','video/webm'])
on conflict(id) do nothing;
create policy "public video files read" on storage.objects for select using (bucket_id='videos');
create policy "users upload own video files" on storage.objects for insert to authenticated
with check (bucket_id='videos' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "users delete own video files" on storage.objects for delete to authenticated
using (bucket_id='videos' and (storage.foldername(name))[1]=auth.uid()::text);

-- Gerçek zamanlı yeni video bildirimleri için Realtime bölümünde videos tablosunu etkinleştir.
