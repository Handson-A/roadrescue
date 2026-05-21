-- /**
--  * Supabase Migration: Create Notifications Table
--  * Store system notifications for users
--  * Timestamp: 2026-05-21 00:00:06
--  */

-- CREATE TABLE IF NOT EXISTS public.notifications (
--   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--   user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
--   -- Notification Details
--   type TEXT NOT NULL CHECK (
--     type IN (
--       'request_assigned',
--       'bid_received',
--       'bid_accepted',
--       'mechanic_arriving',
--       'job_completed',
--       'payment_received',
--       'system_alert'
--     )
--   ),
--   title TEXT NOT NULL,
--   message TEXT NOT NULL,
--   related_id UUID, -- ID of related resource (request, bid, etc)
  
--   -- Status
--   is_read BOOLEAN DEFAULT FALSE,
--   read_at TIMESTAMP WITH TIME ZONE,
  
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
-- );

-- ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Users can view their own notifications"
--   ON public.notifications
--   FOR SELECT
--   USING (auth.uid()::text = user_id::text);

-- -- Create indexes
-- CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
-- CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
-- CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
-- supabase/migrations/20260521000006_create_notifications.sql

-- Notifications are the in-app alert system.
-- Every key lifecycle event creates a notification row for the relevant user.
-- The frontend subscribes to this table via Supabase Realtime and
-- shows alerts without polling.
--
-- Examples:
-- → Driver submits request        → notify nearby mechanics
-- → Mechanic bids                 → notify driver
-- → Driver accepts mechanic       → notify that mechanic
-- → Mechanic marks arrived        → notify driver
-- → Job completed                 → notify driver to rate

create table notifications (
  id uuid primary key default uuid_generate_v4(),

  -- who receives this notification
  user_id uuid not null references profiles(id) on delete cascade,

  -- short label for the notification type
  -- used by frontend to decide icon, color, and action
  type text not null check (type in (
    'new_request',        -- sent to mechanics: new job nearby
    'mechanic_bid',       -- sent to driver: a mechanic responded
    'bid_accepted',       -- sent to mechanic: driver chose them
    'bid_missed',         -- sent to mechanic: driver chose someone else
    'mechanic_en_route',  -- sent to driver: mechanic is on the way
    'mechanic_arrived',   -- sent to driver: mechanic is here
    'job_completed',      -- sent to driver: job done, please rate
    'request_cancelled'   -- sent to mechanic: driver cancelled
  )),

  -- the human-readable message shown in the UI
  message text not null,

  -- optional link to the relevant request for deep-linking
  request_id uuid references rescue_requests(id) on delete cascade,

  -- has the user seen this notification
  is_read boolean default false,

  created_at timestamptz default now()
);

-- Fetch unread notifications for a user fast
create index idx_notifications_user on notifications(user_id, is_read);
create index idx_notifications_request on notifications(request_id);