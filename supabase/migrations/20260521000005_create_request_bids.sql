/**
 * Supabase Migration: Create Request Bids Table
 * Mechanics can bid on pending rescue requests
 * Timestamp: 2026-05-21 00:00:05
 */

CREATE TABLE IF NOT EXISTS public.request_bids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES public.rescue_requests(id) ON DELETE CASCADE,
  mechanic_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Bid Details
  proposed_price DECIMAL(10, 2) NOT NULL,
  estimated_arrival_time INTEGER, -- in minutes
  message TEXT,
  
  -- Status
  bid_status TEXT DEFAULT 'pending' CHECK (bid_status IN ('pending', 'accepted', 'rejected')),
  
  -- Timeline
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  responded_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT unique_bid_per_mechanic_request UNIQUE(request_id, mechanic_id)
);

ALTER TABLE public.request_bids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mechanics can view and create bids"
  ON public.request_bids
  FOR ALL
  USING (
    auth.uid()::text = mechanic_id::text
    OR auth.jwt() ->> 'role' = 'admin'
  );

-- Create indexes
CREATE INDEX idx_request_bids_request_id ON public.request_bids(request_id);
CREATE INDEX idx_request_bids_mechanic_id ON public.request_bids(mechanic_id);
CREATE INDEX idx_request_bids_status ON public.request_bids(bid_status);
