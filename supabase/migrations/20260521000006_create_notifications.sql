/**
 * Supabase Migration: Create Notifications Table
 * Store system notifications for users
 * Timestamp: 2026-05-21 00:00:06
 */

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Notification Details
  type TEXT NOT NULL CHECK (
    type IN (
      'request_assigned',
      'bid_received',
      'bid_accepted',
      'mechanic_arriving',
      'job_completed',
      'payment_received',
      'system_alert'
    )
  ),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_id UUID, -- ID of related resource (request, bid, etc)
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- Create indexes
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
