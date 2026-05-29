-- supabase/migrations/20260521000000_reset_all_tables.sql

-- CAUTION: This migration drops ALL tables and clears the database.
-- Run this ONLY if you want to start fresh.
-- In reverse dependency order (FKs drop before their parents).

-- Drop tables in reverse order of creation

drop table if exists profile_change_requests cascade;
drop table if exists profile_preferences cascade;
drop table if exists notifications cascade;
drop table if exists request_bids cascade;
drop table if exists rescue_requests cascade;
drop table if exists driver_profiles cascade;
drop table if exists mechanic_profiles cascade;
drop table if exists profiles cascade;

-- Drop functions
drop function if exists update_updated_at() cascade;
drop function if exists handle_new_user() cascade;
drop function if exists find_nearby_mechanics(float, float, float) cascade;
drop function if exists get_nearby_verified_mechanics(double precision, double precision, double precision) cascade;
drop function if exists accept_request_bid(uuid, uuid, uuid) cascade;

-- Drop triggers are handled by cascade above
-- Drop extensions (optional — keep them if other migrations might need them)
-- drop extension if exists "uuid-ossp" cascade;
-- drop extension if exists "pgcrypto" cascade;
-- drop extension if exists "postgis" cascade;
-- drop extension if exists "http" cascade;
