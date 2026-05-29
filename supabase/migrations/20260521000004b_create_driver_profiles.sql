-- supabase/migrations/20260521000004b_create_driver_profiles.sql

-- Driver-specific profile data, mirroring the mechanic_profiles pattern.
-- Not every user is a driver, so driver details live in their own table.
-- This keeps the base profiles table clean and allows the driver schema to grow.

create table driver_profiles (
  id uuid primary key default uuid_generate_v4(),

  -- links back to profiles, one driver profile per user
  user_id uuid not null unique references profiles(id) on delete cascade,

  -- vehicle information for rescue requests
  vehicle_make text,
  vehicle_model text,
  vehicle_year integer,
  vehicle_color text,
  vehicle_plate text unique,

  -- emergency contact for support during dispatch
  emergency_contact_name text,
  emergency_contact_phone text,

  -- preferred home area or base location (e.g. "Accra, Greater Accra")
  home_area text,

  -- average rating from mechanic feedback after job completion
  -- cached value to avoid recalculating every time
  rating_avg numeric(3, 2) default 0.00,

  -- total number of completed rescue requests
  total_requests integer default 0,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for fast lookup by vehicle plate (e.g., damage history, re-requests)
create index idx_driver_profiles_vehicle_plate
  on driver_profiles(vehicle_plate);

-- Trigger to auto-update the updated_at column
create trigger driver_profiles_updated_at
  before update on driver_profiles
  for each row execute function update_updated_at();
