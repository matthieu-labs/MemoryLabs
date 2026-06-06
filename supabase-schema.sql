-- MemoryLabs / Memoir AI — Supabase schema
-- Run this once in the Supabase SQL editor (Project → SQL → New query).
--
-- Hackathon setup: Row Level Security is enabled but anon is granted full
-- access so the static frontend can read/write with only the anon key.
-- TIGHTEN THESE POLICIES (add auth + per-user rows) before production.

create extension if not exists "pgcrypto";

-- Transcribed sessions (one row per finished recording / upload).
create table if not exists recordings (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  project       text,
  title         text,
  full_text     text,
  segments      jsonb,
  speaker_names jsonb
);

-- Approved memoir chapters.
create table if not exists chapters (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  project    text,
  title      text not null,
  body       text not null
);

-- Parking lot — topics to revisit later.
create table if not exists parked_topics (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  project    text,
  text       text not null
);

alter table recordings    enable row level security;
alter table chapters      enable row level security;
alter table parked_topics enable row level security;

-- Permissive anon policies (hackathon only).
create policy "anon all recordings"    on recordings    for all to anon using (true) with check (true);
create policy "anon all chapters"      on chapters      for all to anon using (true) with check (true);
create policy "anon all parked_topics" on parked_topics for all to anon using (true) with check (true);
