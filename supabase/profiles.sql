-- Final 450 DSA Tracker — user profiles.
-- Run this once in the Supabase SQL Editor (after schema.sql).
--
-- Profiles are PRIVATE by default. A user can opt in to a public page at
-- /u/<username> by setting a username and toggling is_public on.

create table if not exists public.profiles (
  user_id    uuid        primary key references auth.users (id) on delete cascade,
  username   text,
  full_name  text,
  headline   text,        -- short tagline, e.g. "Backend engineer | DSA enthusiast"
  bio        text,
  location   text,
  education  text,
  company    text,        -- current workplace
  job_title  text,        -- current role
  website    text,
  linkedin   text,
  twitter    text,        -- X
  github     text,
  leetcode   text,
  codeforces text,
  phone      text,
  avatar_url text,         -- Supabase Storage URL; null => initials avatar
  is_public  boolean     not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Case-insensitive unique usernames (only enforced when a username is set).
create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(username))
  where username is not null;

alter table public.profiles enable row level security;

-- Read: the owner always; everyone (incl. anonymous) only when the profile is public.
drop policy if exists "Read own or public profiles" on public.profiles;
create policy "Read own or public profiles"
  on public.profiles for select
  using (is_public = true or auth.uid() = user_id);

-- Write: only the owner, only their own row.
drop policy if exists "Insert own profile" on public.profiles;
create policy "Insert own profile"
  on public.profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "Update own profile" on public.profiles;
create policy "Update own profile"
  on public.profiles for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Delete own profile" on public.profiles;
create policy "Delete own profile"
  on public.profiles for delete
  using (auth.uid() = user_id);

-- Keep updated_at fresh (reuses the trigger function from schema.sql).
drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Expose ONLY a solved-problem count for public profiles, without exposing the
-- underlying progress rows (which stay private under their own RLS).
create or replace function public.public_solved_count(uname text)
returns integer
language sql
security definer
set search_path = public
as $$
  select count(*)::int
  from public.progress p
  join public.profiles pr on pr.user_id = p.user_id
  where lower(pr.username) = lower(uname)
    and pr.is_public = true
    and p.done = true;
$$;

grant execute on function public.public_solved_count(text) to anon, authenticated;

-- ── Avatar storage ─────────────────────────────────────────────────────────
-- Free-tier friendly: most users keep the generated initials avatar (no storage).
-- Uploads are stored under avatars/<user_id>/... and resized client-side first.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "Avatar public read" on storage.objects;
create policy "Avatar public read"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "Avatar owner upload" on storage.objects;
create policy "Avatar owner upload"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Avatar owner update" on storage.objects;
create policy "Avatar owner update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Avatar owner delete" on storage.objects;
create policy "Avatar owner delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
