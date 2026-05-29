-- supabase/migrations/20260521000004a_add_missing_rescue_request_columns.sql

-- Add missing timestamp and tracking columns to rescue_requests
-- These columns are used by API routes for status tracking

alter table rescue_requests
  add column if not exists en_route_at timestamptz,
  add column if not exists arrived_at timestamptz,
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancelled_by uuid references profiles(id) on delete set null,
  add column if not exists cancellation_reason text;

-- Comment on columns for documentation
comment on column rescue_requests.en_route_at is 'When mechanic marked as en_route to incident location';
comment on column rescue_requests.arrived_at is 'When mechanic arrived at incident location';
comment on column rescue_requests.cancelled_at is 'When rescue request was cancelled';
comment on column rescue_requests.cancelled_by is 'Who cancelled the request (driver, mechanic, or admin)';
comment on column rescue_requests.cancellation_reason is 'Reason provided for cancellation';
