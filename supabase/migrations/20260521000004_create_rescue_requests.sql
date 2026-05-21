-- /**
--  * Supabase Migration: Create Rescue Requests Table
--  * Core table for rescue request lifecycle management
--  * Timestamp: 2026-05-21 00:00:04
--  */

-- CREATE TABLE IF NOT EXISTS public.rescue_requests (
--   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--   driver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
--   assigned_mechanic_id UUID REFERENCES public.profiles(id),
  
--   -- Request Details
--   vehicle_details TEXT NOT NULL,
--   issue_description TEXT NOT NULL,
--   issue_priority TEXT DEFAULT 'MEDIUM' CHECK (issue_priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
--   ai_diagnosis TEXT,
  
--   -- Location
--   latitude DECIMAL(10, 8) NOT NULL,
--   longitude DECIMAL(11, 8) NOT NULL,
--   location_address TEXT,
  
--   -- Status Tracking
--   status TEXT DEFAULT 'PENDING' CHECK (
--     status IN ('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')
--   ),
  
--   -- Timeline
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
--   assigned_at TIMESTAMP WITH TIME ZONE,
--   started_at TIMESTAMP WITH TIME ZONE,
--   completed_at TIMESTAMP WITH TIME ZONE,
--   cancelled_at TIMESTAMP WITH TIME ZONE,
  
--   -- Completion Details
--   completion_notes TEXT,
--   driver_rating INTEGER CHECK (driver_rating >= 1 AND driver_rating <= 5),
--   mechanic_rating INTEGER CHECK (mechanic_rating >= 1 AND mechanic_rating <= 5),
  
--   updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
-- );

-- ALTER TABLE public.rescue_requests ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Drivers and assigned mechanics can view requests"
--   ON public.rescue_requests
--   FOR SELECT
--   USING (
--     auth.uid()::text = driver_id::text
--     OR auth.uid()::text = assigned_mechanic_id::text
--     OR auth.jwt() ->> 'role' = 'admin'
--   );

-- CREATE POLICY "Drivers can create requests"
--   ON public.rescue_requests
--   FOR INSERT
--   WITH CHECK (auth.uid()::text = driver_id::text);

-- -- Create indexes for common queries
-- CREATE INDEX idx_rescue_requests_driver_id ON public.rescue_requests(driver_id);
-- CREATE INDEX idx_rescue_requests_mechanic_id ON public.rescue_requests(assigned_mechanic_id);
-- CREATE INDEX idx_rescue_requests_status ON public.rescue_requests(status);
-- CREATE INDEX idx_rescue_requests_created_at ON public.rescue_requests(created_at);
-- CREATE INDEX idx_rescue_requests_location
--   ON public.rescue_requests USING GIST (
--     ST_SetSRID(ST_Point(longitude, latitude), 4326)
--   );

-- supabase/migrations/20260521000004_create_rescue_requests.sql

-- This is the heart of the system.
-- Every breakdown event a driver creates becomes one row here.
-- The status column IS the state machine — every transition in the
-- rescue lifecycle is just an update to this column.
--
-- State machine flow:
-- pending → accepted → en_route → arrived → in_progress → completed
--                ↓
--           cancelled (driver cancels before acceptance)
--           rejected  (no mechanic accepts within timeout — future feature)

create table rescue_requests (
  id uuid primary key default uuid_generate_v4(),

  -- who made the request
  driver_id uuid not null references profiles(id) on delete cascade,

  -- who accepted the request (null until a mechanic accepts)
  mechanic_id uuid references profiles(id) on delete set null,

  -- the state machine column — drives everything in the UI
  status text not null default 'pending'
    check (status in (
      'pending',      -- created, waiting for mechanic
      'accepted',     -- mechanic accepted, not yet moving
      'en_route',     -- mechanic is driving to driver
      'arrived',      -- mechanic reached driver location
      'in_progress',  -- repair/tow actively happening
      'completed',    -- job done
      'cancelled'     -- driver cancelled
    )),

  -- what type of help is needed
  -- this feeds into which mechanics get notified
  service_type text not null
    check (service_type in ('repair', 'towing', 'tyre_change', 'battery_jump', 'fuel_delivery', 'other')),

  -- driver's breakdown location stored as a geographic point
  -- 4326 is the standard GPS coordinate system (WGS 84)
  incident_location geography(Point, 4326) not null,

  -- human-readable address for display in the UI
  -- we don't want to reverse-geocode on every render
  incident_address text,

  -- the driver's description of the problem in their own words
  -- this is also what gets sent to the AI diagnostic module
  problem_description text,

  -- what the AI diagnosed from the problem description
  -- stored as JSONB so we can save structured data:
  -- { fault_category, urgency, recommended_service, summary }
  ai_diagnostic_result jsonb,

  -- vehicle details at time of request
  -- not a foreign key — we snapshot it here so history stays accurate
  -- even if driver updates their profile later
  vehicle_make text,
  vehicle_model text,
  vehicle_year integer,
  vehicle_color text,
  vehicle_plate text,

  -- when a mechanic accepted (useful for response time analytics)
  accepted_at timestamptz,

  -- when the job was fully completed
  completed_at timestamptz,

  -- driver's rating of the mechanic after job completion (1-5)
  driver_rating integer check (driver_rating between 1 and 5),

  -- optional note from driver after completion
  driver_review text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Fast lookup for "show me all pending requests" or filtering by driver
create index idx_rescue_requests_status on rescue_requests(status);
create index idx_rescue_requests_driver on rescue_requests(driver_id);
create index idx_rescue_requests_mechanic on rescue_requests(mechanic_id);

-- Spatial index on incident location
-- powers "find requests near mechanic" if we ever need that direction
create index idx_rescue_requests_location
  on rescue_requests using gist(incident_location);

create trigger rescue_requests_updated_at
  before update on rescue_requests
  for each row execute function update_updated_at();