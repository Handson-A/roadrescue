/**
 * Supabase Migration: Create Mechanic Profiles Table
 * Extended profile information for mechanics (skills, certifications, availability)
 * Timestamp: 2026-05-21 00:00:03
 */

CREATE TABLE IF NOT EXISTS public.mechanic_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Verification & Credentials
  license_number TEXT NOT NULL UNIQUE,
  license_expiry DATE,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES public.profiles(id),
  
  -- Professional Info
  years_experience INTEGER,
  certifications TEXT[],
  specializations TEXT[],
  hourly_rate DECIMAL(10, 2),
  
  -- Location & Availability
  service_area_lat DECIMAL(10, 8),
  service_area_lon DECIMAL(11, 8),
  service_radius_km INTEGER DEFAULT 10,
  current_status TEXT DEFAULT 'offline' CHECK (current_status IN ('online', 'offline', 'on_job')),
  
  -- Stats
  total_jobs_completed INTEGER DEFAULT 0,
  average_rating DECIMAL(3, 2),
  total_earnings DECIMAL(12, 2) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.mechanic_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View verified mechanics"
  ON public.mechanic_profiles
  FOR SELECT
  USING (
    verification_status = 'verified'
    OR auth.uid()::text = user_id::text
    OR auth.jwt() ->> 'role' = 'admin'
  );

-- Create indexes for geospatial queries
CREATE INDEX idx_mechanic_profiles_location 
  ON public.mechanic_profiles USING GIST (
    ST_SetSRID(ST_Point(service_area_lon, service_area_lat), 4326)
  );
CREATE INDEX idx_mechanic_profiles_verification_status ON public.mechanic_profiles(verification_status);
CREATE INDEX idx_mechanic_profiles_status ON public.mechanic_profiles(current_status);
