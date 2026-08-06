-- 30minutes — initial schema
-- Run in the Supabase SQL editor, or with the Supabase CLI:
--   supabase db push
-- Enables Row Level Security everywhere: a user only ever touches their own
-- private rows, while the social feed is readable by any authenticated user.

-- ---------------------------------------------------------------------------
-- profiles: public-facing identity, 1:1 with auth.users
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  username   text unique not null,
  full_name  text,
  avatar_url text,
  bio        text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles readable by authenticated"
  on public.profiles for select to authenticated using (true);

create policy "users manage own profile"
  on public.profiles for all to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

-- Auto-create a profile row when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', 'user_' || substr(new.id::text, 1, 8)),
    new.raw_user_meta_data ->> 'full_name'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- posts / likes / comments — the social feed
-- ---------------------------------------------------------------------------
create table if not exists public.posts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  media_url  text not null,
  media_type text not null check (media_type in ('image', 'video')),
  caption    text,
  created_at timestamptz not null default now()
);
create index if not exists posts_created_at_idx on public.posts (created_at desc);

alter table public.posts enable row level security;
create policy "posts readable by authenticated"
  on public.posts for select to authenticated using (true);
create policy "users insert own posts"
  on public.posts for insert to authenticated with check (auth.uid() = user_id);
create policy "users delete own posts"
  on public.posts for delete to authenticated using (auth.uid() = user_id);

create table if not exists public.likes (
  post_id    uuid not null references public.posts (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
alter table public.likes enable row level security;
create policy "likes readable by authenticated"
  on public.likes for select to authenticated using (true);
create policy "users manage own likes"
  on public.likes for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 2200),
  created_at timestamptz not null default now()
);
create index if not exists comments_post_idx on public.comments (post_id, created_at);
alter table public.comments enable row level security;
create policy "comments readable by authenticated"
  on public.comments for select to authenticated using (true);
create policy "users insert own comments"
  on public.comments for insert to authenticated with check (auth.uid() = user_id);
create policy "users delete own comments"
  on public.comments for delete to authenticated using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- daily_usage — the 30-minute social budget, one row per user per day
-- ---------------------------------------------------------------------------
create table if not exists public.daily_usage (
  user_id      uuid not null references public.profiles (id) on delete cascade,
  usage_date   date not null,
  seconds_used integer not null default 0 check (seconds_used >= 0),
  updated_at   timestamptz not null default now(),
  primary key (user_id, usage_date)
);
alter table public.daily_usage enable row level security;
create policy "users manage own usage"
  on public.daily_usage for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- activities — gamified "live your day" world
-- ---------------------------------------------------------------------------
create table if not exists public.activity_profiles (
  user_id           uuid primary key references public.profiles (id) on delete cascade,
  interests         text[] not null default '{}',
  goals             text[] not null default '{}',
  available_minutes integer not null default 60,
  energy_level      text not null default 'medium' check (energy_level in ('low','medium','high')),
  has_kids          boolean not null default false,
  updated_at        timestamptz not null default now()
);
alter table public.activity_profiles enable row level security;
create policy "users manage own activity profile"
  on public.activity_profiles for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Shared, read-only catalog of suggested activities.
create table if not exists public.activity_catalog (
  id          text primary key,
  title       text not null,
  description text,
  category    text not null,
  icon        text not null,
  tags        text[] not null default '{}',
  base_points integer not null default 15
);
alter table public.activity_catalog enable row level security;
create policy "catalog readable by authenticated"
  on public.activity_catalog for select to authenticated using (true);

create table if not exists public.user_activities (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  catalog_id    text references public.activity_catalog (id) on delete set null,
  custom_title  text not null,
  activity_date date not null default current_date,
  completed     boolean not null default false,
  points        integer not null default 15,
  created_at    timestamptz not null default now()
);
create index if not exists user_activities_idx
  on public.user_activities (user_id, activity_date);
alter table public.user_activities enable row level security;
create policy "users manage own activities"
  on public.user_activities for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Storage: public bucket for post media
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy "media publicly readable"
  on storage.objects for select
  using (bucket_id = 'media');

create policy "users upload to own media folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users delete own media"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
