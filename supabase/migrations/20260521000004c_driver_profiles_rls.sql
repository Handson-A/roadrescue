-- supabase/migrations/20260521000004c_driver_profiles_rls.sql

-- Row-level security policies for driver_profiles table
-- Mirrors the pattern from mechanic_profiles

alter table driver_profiles enable row level security;

-- Authenticated users can view all driver profiles
-- (mechanics/admins/other drivers need to see driver details for requests)
create policy "Authenticated users can view driver profiles"
  on driver_profiles for select
  to authenticated
  using (true);

-- Drivers can only update their own driver profile
create policy "Drivers can update own driver profile"
  on driver_profiles for update
  to authenticated
  using (auth.uid() = user_id);

-- Drivers can only insert their own driver profile
create policy "Drivers can insert own driver profile"
  on driver_profiles for insert
  to authenticated
  with check (auth.uid() = user_id);
