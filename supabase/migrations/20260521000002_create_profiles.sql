-- supabase/migrations/20260521000002_create_profiles.sql

-- Every user in Supabase starts in auth.users (managed by Supabase Auth).
-- That table only holds email, password hash, and auth metadata.
-- We need our own profiles table to store app-specific data like
-- full name, phone number, and most importantly: their ROLE.
--
-- This table has a 1-to-1 relationship with auth.users.
-- The id here IS the auth.users id — same UUID, no separate key.

create table profiles (
  -- mirrors auth.users primary key exactly
  id uuid primary key references auth.users(id) on delete cascade,

  -- full name for display across the UI
  full_name text not null,

  -- phone is critical in Ghana — most users identify and communicate by phone
  phone text unique not null,

  -- keep a copy of the user's email for convenience (copied from auth.users.email)
  email text unique not null,

  -- role controls everything: what pages they see, what data they can access
  -- 'driver'   → creates emergency requests
  -- 'mechanic' → receives and responds to requests
  -- 'admin'    → verifies mechanics, oversees platform
  role text not null check (role in ('driver', 'mechanic', 'admin')),

  -- profile photo stored in Supabase Storage, we just keep the url here
  avatar_url text,

  -- auto-set on insert, never manually assigned
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- This index speeds up any query that filters by role.
-- e.g. "show me all mechanics" or role-based RLS checks
create index idx_profiles_role on profiles(role);

-- This function auto-updates the updated_at column whenever a row changes.
-- We'll reuse this same trigger pattern on other tables too.
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

-- When a new user signs up through Supabase Auth, this trigger
-- automatically creates their profile row. This means we never
-- have to manually insert into profiles from the frontend —
-- it happens the moment auth.users gets a new record.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, phone, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'role'
  );
  return new;
end;
$$ language plpgsql security definer;

-- trigger the function every time a user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();