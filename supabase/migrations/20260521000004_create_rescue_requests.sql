/**
 * Supabase Migration: Create Rescue Requests Table
 * Core table for rescue request lifecycle management
 * Timestamp: 2026-05-21 00:00:04
 */

CREATE TABLE IF NOT EXISTS public.rescue_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_mechanic_id UUID REFERENCES public.profiles(id),
  
  -- Request Details
  vehicle_details TEXT NOT NULL,
  issue_description TEXT NOT NULL,
  issue_priority TEXT DEFAULT 'MEDIUM' CHECK (issue_priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  ai_diagnosis TEXT,
  
  -- Location
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  location_address TEXT,
  
  -- Status Tracking
  status TEXT DEFAULT 'PENDING' CHECK (
    status IN ('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')
  ),
  
  -- Timeline
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  assigned_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  
  -- Completion Details
  completion_notes TEXT,
  driver_rating INTEGER CHECK (driver_rating >= 1 AND driver_rating <= 5),
  mechanic_rating INTEGER CHECK (mechanic_rating >= 1 AND mechanic_rating <= 5),
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.rescue_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers and assigned mechanics can view requests"
  ON public.rescue_requests
  FOR SELECT
  USING (
    auth.uid()::text = driver_id::text
    OR auth.uid()::text = assigned_mechanic_id::text
    OR auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "Drivers can create requests"
  ON public.rescue_requests
  FOR INSERT
  WITH CHECK (auth.uid()::text = driver_id::text);

-- Create indexes for common queries
CREATE INDEX idx_rescue_requests_driver_id ON public.rescue_requests(driver_id);
CREATE INDEX idx_rescue_requests_mechanic_id ON public.rescue_requests(assigned_mechanic_id);
CREATE INDEX idx_rescue_requests_status ON public.rescue_requests(status);
CREATE INDEX idx_rescue_requests_created_at ON public.rescue_requests(created_at);
CREATE INDEX idx_rescue_requests_location
  ON public.rescue_requests USING GIST (
    ST_SetSRID(ST_Point(longitude, latitude), 4326)
  );
