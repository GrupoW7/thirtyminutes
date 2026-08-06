-- 30minutes — social graph: follows + direct messages
-- Run after 0001_init.sql.

-- ---------------------------------------------------------------------------
-- follows: who follows whom
-- ---------------------------------------------------------------------------
create table if not exists public.follows (
  follower_id  uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);
create index if not exists follows_following_idx on public.follows (following_id);

alter table public.follows enable row level security;
create policy "follows readable by authenticated"
  on public.follows for select to authenticated using (true);
create policy "users manage own follows"
  on public.follows for all to authenticated
  using (auth.uid() = follower_id) with check (auth.uid() = follower_id);

-- ---------------------------------------------------------------------------
-- messages: 1:1 direct messages between two users
-- ---------------------------------------------------------------------------
create table if not exists public.messages (
  id           uuid primary key default gen_random_uuid(),
  sender_id    uuid not null references public.profiles (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  body         text not null check (char_length(body) between 1 and 2000),
  read         boolean not null default false,
  created_at   timestamptz not null default now(),
  check (sender_id <> recipient_id)
);
create index if not exists messages_pair_idx on public.messages (sender_id, recipient_id, created_at);
create index if not exists messages_recipient_idx on public.messages (recipient_id, created_at);

alter table public.messages enable row level security;
-- Either side of the conversation can read it.
create policy "read own conversations"
  on public.messages for select to authenticated
  using (auth.uid() = sender_id or auth.uid() = recipient_id);
-- You may only send messages authored by yourself.
create policy "send messages as self"
  on public.messages for insert to authenticated
  with check (auth.uid() = sender_id);
-- Recipient can mark messages as read.
create policy "recipient updates read state"
  on public.messages for update to authenticated
  using (auth.uid() = recipient_id) with check (auth.uid() = recipient_id);

-- Enable Realtime for live chat (safe if already a member).
do $$
begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null;
end $$;
