-- Final 450 DSA Tracker — database schema.
-- Run this once in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
--
-- The problem catalog is NOT stored here; it ships with the app as a static
-- JSON file. Only per-user progress lives in the database.

create table if not exists public.progress (
  user_id    uuid        not null references auth.users (id) on delete cascade,
  problem_id int         not null,
  done       boolean     not null default false,
  starred    boolean     not null default false,
  note       text,
  updated_at timestamptz not null default now(),
  primary key (user_id, problem_id)
);

-- Each user may only ever read or write their own rows.
alter table public.progress enable row level security;

drop policy if exists "Users manage their own progress" on public.progress;
create policy "Users manage their own progress"
  on public.progress
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Keep updated_at fresh on every write.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists progress_touch_updated_at on public.progress;
create trigger progress_touch_updated_at
  before update on public.progress
  for each row
  execute function public.touch_updated_at();
