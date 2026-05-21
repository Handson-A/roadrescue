-- /**
--  * Supabase Migration: Create Request Bids Table
--  * Mechanics can bid on pending rescue requests
--  * Timestamp: 2026-05-21 00:00:05
--  */

-- CREATE TABLE IF NOT EXISTS public.request_bids (
--   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--   request_id UUID NOT NULL REFERENCES public.rescue_requests(id) ON DELETE CASCADE,
--   mechanic_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
--   -- Bid Details
--   proposed_price DECIMAL(10, 2) NOT NULL,
--   estimated_arrival_time INTEGER, -- in minutes
--   message TEXT,
  
--   -- Status
--   bid_status TEXT DEFAULT 'pending' CHECK (bid_status IN ('pending', 'accepted', 'rejected')),
  
--   -- Timeline
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
--   responded_at TIMESTAMP WITH TIME ZONE,
  
--   CONSTRAINT unique_bid_per_mechanic_request UNIQUE(request_id, mechanic_id)
-- );

-- ALTER TABLE public.request_bids ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Mechanics can view and create bids"
--   ON public.request_bids
--   FOR ALL
--   USING (
--     auth.uid()::text = mechanic_id::text
--     OR auth.jwt() ->> 'role' = 'admin'
--   );

-- -- Create indexes
-- CREATE INDEX idx_request_bids_request_id ON public.request_bids(request_id);
-- CREATE INDEX idx_request_bids_mechanic_id ON public.request_bids(mechanic_id);
-- CREATE INDEX idx_request_bids_status ON public.request_bids(bid_status);

-- supabase/migrations/20260521000005_create_request_bids.sql

-- When a rescue request is pending, multiple nearby mechanics may
-- see it simultaneously. We don't auto-assign — we let mechanics
-- express intent to accept, and the driver sees who responded.
--
-- Think of this as the "handshake" table between a pending request
-- and the mechanics who are willing to take it.
--
-- A bid is created when a mechanic taps "Accept Job".
-- The driver sees all bids and can choose their mechanic.
-- When one bid is accepted, the request status moves to 'accepted'
-- and all other bids for that request become 'missed'.

create table request_bids (
  id uuid primary key default uuid_generate_v4(),

  -- which request this bid is for
  request_id uuid not null references rescue_requests(id) on delete cascade,

  -- which mechanic placed the bid
  mechanic_id uuid not null references profiles(id) on delete cascade,

  -- 'pending'  → mechanic responded, waiting for driver to choose
  -- 'accepted' → driver chose this mechanic
  -- 'missed'   → driver chose a different mechanic
  -- 'withdrawn' → mechanic changed their mind before driver chose
  bid_status text not null default 'pending'
    check (bid_status in ('pending', 'accepted', 'missed', 'withdrawn')),

  -- mechanic's estimated arrival time in minutes at time of bidding
  -- gives driver useful info to compare mechanics
  estimated_arrival_minutes integer,

  -- mechanic's location snapshot when they placed the bid
  -- useful for showing driver how far each mechanic was
  mechanic_location_snapshot geography(Point, 4326),

  created_at timestamptz default now(),

  -- a mechanic can only bid once per request
  unique(request_id, mechanic_id)
);

create index idx_request_bids_request on request_bids(request_id);
create index idx_request_bids_mechanic on request_bids(mechanic_id);
create index idx_request_bids_status on request_bids(bid_status);