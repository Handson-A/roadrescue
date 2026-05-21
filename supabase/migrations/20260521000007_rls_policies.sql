-- supabase/migrations/20260521000007_rls_policies.sql

-- Row Level Security means PostgreSQL enforces access rules at the
-- database level, not just in application code.
-- Even if someone bypasses your API and hits Supabase directly
-- with a valid JWT, they still cannot read or write data
-- they are not allowed to touch.
--
-- auth.uid() = the UUID of the currently authenticated user
-- We use it to compare against owner columns in each table.

-- ==========================================
-- PROFILES
-- ==========================================

alter table profiles enable row level security;

-- Anyone logged in can read any profile.
-- Mechanics need to see driver info, drivers need to see mechanic info.
create policy "Authenticated users can view profiles"
  on profiles for select
  to authenticated
  using (true);

-- You can only update your own profile.
create policy "Users can update own profile"
  on profiles for update
  to authenticated
  using (auth.uid() = id);

-- Insert is handled by the trigger on auth.users,
-- so we block manual inserts from the client.
create policy "No manual profile inserts"
  on profiles for insert
  to authenticated
  with check (false);

-- ==========================================
-- MECHANIC PROFILES
-- ==========================================

alter table mechanic_profiles enable row level security;

-- Drivers need to see mechanic details (rating, specializations, etc.)
create policy "Authenticated users can view mechanic profiles"
  on mechanic_profiles for select
  to authenticated
  using (true);

-- Mechanics can only update their own mechanic profile
create policy "Mechanics can update own mechanic profile"
  on mechanic_profiles for update
  to authenticated
  using (
    auth.uid() = user_id
  );

-- Only mechanics can create their own mechanic profile
create policy "Mechanics can insert own mechanic profile"
  on mechanic_profiles for insert
  to authenticated
  with check (
    auth.uid() = user_id
  );

-- ==========================================
-- RESCUE REQUESTS
-- ==========================================

alter table rescue_requests enable row level security;

-- Drivers see only their own requests.
-- Mechanics see all pending requests (to find jobs) + their accepted ones.
-- Admins see everything — handled via service role in admin API routes.
create policy "Drivers can view own requests"
  on rescue_requests for select
  to authenticated
  using (
    auth.uid() = driver_id
  );

create policy "Mechanics can view pending or assigned requests"
  on rescue_requests for select
  to authenticated
  using (
    -- they can see any pending request (job board)
    status = 'pending'
    or
    -- or any request assigned to them
    auth.uid() = mechanic_id
  );

-- Only drivers can create requests
create policy "Drivers can create requests"
  on rescue_requests for insert
  to authenticated
  with check (
    auth.uid() = driver_id
  );

-- Drivers can cancel their own pending request
create policy "Drivers can cancel own request"
  on rescue_requests for update
  to authenticated
  using (
    auth.uid() = driver_id
    and status = 'pending'
  );

-- Mechanics can update status on their assigned request
create policy "Mechanics can update assigned request status"
  on rescue_requests for update
  to authenticated
  using (
    auth.uid() = mechanic_id
  );

-- ==========================================
-- REQUEST BIDS
-- ==========================================

alter table request_bids enable row level security;

-- Drivers can see all bids on their own requests
create policy "Drivers can view bids on own requests"
  on request_bids for select
  to authenticated
  using (
    exists (
      select 1 from rescue_requests r
      where r.id = request_id
      and r.driver_id = auth.uid()
    )
  );

-- Mechanics can see their own bids
create policy "Mechanics can view own bids"
  on request_bids for select
  to authenticated
  using (auth.uid() = mechanic_id);

-- Only mechanics can place bids
create policy "Mechanics can insert bids"
  on request_bids for insert
  to authenticated
  with check (auth.uid() = mechanic_id);

-- Mechanics can withdraw their own pending bid
-- Drivers accept bids via a server-side route handler (service role),
-- so client-side update is mechanic-only
create policy "Mechanics can update own bid"
  on request_bids for update
  to authenticated
  using (auth.uid() = mechanic_id);

-- ==========================================
-- NOTIFICATIONS
-- ==========================================

alter table notifications enable row level security;

-- You only ever see your own notifications
create policy "Users can view own notifications"
  on notifications for select
  to authenticated
  using (auth.uid() = user_id);

-- Only the system (service role from API routes) inserts notifications.
-- No client should be able to create notifications directly.
create policy "No client notification inserts"
  on notifications for insert
  to authenticated
  with check (false);

-- Users can mark their own notifications as read
create policy "Users can update own notifications"
  on notifications for update
  to authenticated
  using (auth.uid() = user_id);