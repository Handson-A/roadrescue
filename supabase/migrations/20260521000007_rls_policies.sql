/**
 * Supabase Migration: Enable RLS Policies
 * Configure row-level security for all tables
 * Timestamp: 2026-05-21 00:00:07
 */

-- Verify RLS is enabled on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mechanic_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rescue_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.rescue_requests;
DROP POLICY IF EXISTS "Enable update for owner" ON public.rescue_requests;

-- Create comprehensive RLS policies

-- profiles table policies (already created in migration 002)

-- mechanic_profiles table policies (already created in migration 003)

-- rescue_requests policies (already created in migration 004)

-- request_bids policies (already created in migration 005)

-- notifications policies (already created in migration 006)

-- Additional admin-level read policies for monitoring
CREATE POLICY "Admins can view all data"
  ON public.profiles
  FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can view all mechanic profiles"
  ON public.mechanic_profiles
  FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can view all rescue requests"
  ON public.rescue_requests
  FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can view all bids"
  ON public.request_bids
  FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');
