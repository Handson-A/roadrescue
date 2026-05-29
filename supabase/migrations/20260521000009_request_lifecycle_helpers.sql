-- supabase/migrations/20260521000009_request_lifecycle_helpers.sql

-- Phase 4 lifecycle support needs a few missing columns from the
-- current normalized request table, plus helper functions for the
-- geospatial mechanic lookup and bid acceptance transaction.

alter table rescue_requests
  add column if not exists started_at timestamptz,
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancelled_by uuid references profiles(id) on delete set null,
  add column if not exists cancellation_reason text,
  add column if not exists completion_notes text,
  add column if not exists vehicle_details text,
  add column if not exists issue_description text,
  add column if not exists location_address text;

create or replace function get_nearby_verified_mechanics(
  request_latitude double precision,
  request_longitude double precision,
  search_radius_km double precision default 10
)
returns table (
  user_id uuid,
  full_name text,
  phone text,
  avatar_url text,
  rating_avg numeric,
  business_name text,
  distance_km double precision
)
language sql
stable
as $$
  select
    p.id as user_id,
    p.full_name,
    p.phone,
    p.avatar_url,
    mp.rating_avg,
    mp.business_name,
    st_distance(
      mp.current_location,
      st_setsrid(st_makepoint(request_longitude, request_latitude), 4326)::geography
    ) / 1000.0 as distance_km
  from mechanic_profiles mp
  join profiles p on p.id = mp.user_id
  where mp.verification_status = 'verified'
    and mp.is_available = true
    and mp.current_location is not null
    and st_dwithin(
      mp.current_location,
      st_setsrid(st_makepoint(request_longitude, request_latitude), 4326)::geography,
      search_radius_km * 1000.0
    )
  order by distance_km asc;
$$;

create or replace function accept_request_bid(
  p_request_id uuid,
  p_bid_id uuid,
  p_driver_id uuid
)
returns table (
  request_id uuid,
  mechanic_id uuid,
  status text,
  accepted_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_bid request_bids%rowtype;
  request_row rescue_requests%rowtype;
begin
  select *
    into request_row
  from rescue_requests
  where id = p_request_id
    and driver_id = p_driver_id
  for update;

  if not found then
    raise exception 'Request not found or not owned by driver';
  end if;

  if request_row.status <> 'pending' then
    raise exception 'Only pending requests can accept a bid';
  end if;

  select *
    into selected_bid
  from request_bids
  where id = p_bid_id
    and request_id = p_request_id
  for update;

  if not found then
    raise exception 'Bid not found for this request';
  end if;

  if selected_bid.bid_status <> 'pending' then
    raise exception 'Only pending bids can be accepted';
  end if;

  update rescue_requests
  set mechanic_id = selected_bid.mechanic_id,
      status = 'accepted',
      accepted_at = now()
  where id = p_request_id;

  update request_bids
  set bid_status = case when id = p_bid_id then 'accepted' else 'missed' end,
      responded_at = now()
  where request_id = p_request_id
    and bid_status = 'pending';

  update request_bids
  set bid_status = 'accepted',
      responded_at = now()
  where id = p_bid_id;

  return query
    select
      r.id,
      r.mechanic_id,
      r.status,
      r.accepted_at
    from rescue_requests r
    where r.id = p_request_id;
end;
$$;
