-- supabase/migrations/20260521000008_geospatial_functions.sql

-- This function is the geospatial core of the platform.
-- When a driver creates a request, we call this to find
-- which mechanics to notify.
--
-- It takes the incident location and a search radius (in km),
-- and returns all verified, available mechanics within that radius,
-- ordered by distance (closest first).
--
-- ST_DWithin: returns true if two geography points are within X metres
-- ST_Distance: returns the distance in metres between two points
-- We expose distance_km in the result so the frontend can display
-- "2.4 km away" on each mechanic card.

create or replace function find_nearby_mechanics(
  incident_lat float,
  incident_lng float,
  radius_km float default 10
)
returns table (
  user_id uuid,
  full_name text,
  rating_avg numeric,
  specializations text[],
  distance_km float,
  location_label text
) as $$
begin
  return query
  select
    mp.user_id,
    p.full_name,
    mp.rating_avg,
    mp.specializations,
    -- convert metres to km, round to 1 decimal
    round(
      st_distance(
        mp.current_location,
        st_point(incident_lng, incident_lat)::geography
      )::numeric / 1000,
      1
    )::float as distance_km,
    mp.location_label
  from mechanic_profiles mp
  join profiles p on p.id = mp.user_id
  where
    -- only verified mechanics
    mp.verification_status = 'verified'
    -- only mechanics who are online and available
    and mp.is_available = true
    -- only mechanics with a recent location update (within last 30 minutes)
    -- avoids matching mechanics whose GPS is stale
    and mp.location_updated_at > now() - interval '30 minutes'
    -- the actual spatial filter — radius_km converted to metres
    and st_dwithin(
      mp.current_location,
      st_point(incident_lng, incident_lat)::geography,
      radius_km * 1000
    )
  order by distance_km asc;
end;
$$ language plpgsql stable;