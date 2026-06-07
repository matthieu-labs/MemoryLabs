-- Memoir AI — Supabase schema
-- Run in the Supabase SQL editor. Then create a Storage bucket named
-- "recordings" (Storage → New bucket). For the hackathon you can make it
-- public, or keep it private (the API uses signed URLs either way).

create extension if not exists "pgcrypto";

create table if not exists project (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_at  timestamptz default now()
);

create table if not exists recording (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid references project(id) on delete cascade,
  audio_path  text,
  duration    int,
  status      text default 'uploaded',
  created_at  timestamptz default now()
);

create table if not exists transcript (
  id            uuid primary key default gen_random_uuid(),
  recording_id  uuid references recording(id) on delete cascade,
  segments      jsonb not null,
  created_at    timestamptz default now()
);

create table if not exists chapter (
  id            uuid primary key default gen_random_uuid(),
  recording_id  uuid references recording(id) on delete cascade,
  topic         text,
  title         text,
  prose         text,
  style_params  jsonb,
  status        text default 'draft',
  created_at    timestamptz default now()
);

create table if not exists entity (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid references project(id) on delete cascade,
  type        text,
  name        text
);

-- The cross-chapter "connections": chapters that share an entity are related.
create table if not exists chapter_entity (
  chapter_id  uuid references chapter(id) on delete cascade,
  entity_id   uuid references entity(id) on delete cascade,
  primary key (chapter_id, entity_id)
);

-- Hackathon convenience: open RLS. Tighten before production.
alter table project        disable row level security;
alter table recording      disable row level security;
alter table transcript     disable row level security;
alter table chapter        disable row level security;
alter table entity         disable row level security;
alter table chapter_entity disable row level security;
