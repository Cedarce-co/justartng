-- Run this on Supabase or any Postgres database, or let the app create it
-- the first time a registration is saved with DATABASE_URL set.

create table if not exists registrations (
  id text primary key,
  event_slug text not null,
  full_name text not null,
  email text not null,
  phone text,
  guests integer not null,
  heard_about text,
  accessibility text,
  created_at timestamptz not null default now(),
  unique (event_slug, email)
);
