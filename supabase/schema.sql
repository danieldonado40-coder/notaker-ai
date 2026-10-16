-- Notaker · esquema de Supabase
-- Ejecuta este archivo en Supabase → SQL Editor.

create extension if not exists "pgcrypto";

create table if not exists public.folders (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name        text not null,
  color       text not null default 'indigo',
  created_at  timestamptz not null default now()
);

create table if not exists public.notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  folder_id   uuid references public.folders(id) on delete set null,
  content     text not null default '',
  pinned      boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create index if not exists notes_user_updated_idx on public.notes (user_id, updated_at desc);
create index if not exists folders_user_idx on public.folders (user_id);

alter table public.folders enable row level security;
alter table public.notes   enable row level security;

drop policy if exists "folders_own" on public.folders;
create policy "folders_own" on public.folders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "notes_own" on public.notes;
create policy "notes_own" on public.notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
