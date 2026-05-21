-- supabase/migrations/20260521000003_create_mechanic_profiles.sql

-- Not every user is a mechanic, so mechanic-specific data lives
-- in its own table rather than cluttering profiles with nullable columns.
-- This is standard normalization — only mechanics have this record.
--
-- Think of profiles as the base, mechanic_profiles as the extension.

create table mechanic_profiles (
  id uuid primary key default uuid_generate_v4(),

  -- links back to profiles, not auth.users directly
  -- one mechanic profile per user, enforced by unique constraint
  user_id uuid not null unique references profiles(id) on delete cascade,

  -- what they specialize in: engine, electrical, tyres, towing, etc.
  -- stored as a text array so a mechanic can have multiple specializations
  specializations text[] default '{}',

  -- years of experience, used to display credibility on the driver side
  years_experience integer default 0,

  -- the garage or business name if they operate under one
  business_name text,

  -- verification is the core trust mechanism of the platform.
  -- 'pending'  → just registered, not yet reviewed
  -- 'verified' → admin has approved their credentials
  -- 'rejected' → admin rejected, they cannot receive jobs
  -- Only 'verified' mechanics appear in search results.
  verification_status text not null default 'pending'
    check (verification_status in ('pending', 'verified', 'rejected')),

  -- when admin verified or rejected them, and which admin did it
  verified_at timestamptz,
  verified_by uuid references profiles(id),

  -- mechanic's document upload (license, cert) stored in Supabase Storage
  -- we store just the file path/url here
  credential_document_url text,

  -- average star rating, updated after each completed job
  -- we store it here as a cached value to avoid recalculating every time
  rating_avg numeric(3, 2) default 0.00,

  -- total number of jobs completed, displayed for social proof
  total_jobs integer default 0,

  -- whether mechanic is currently willing to take jobs
  -- a verified mechanic can go offline voluntarily
  is_available boolean default false,

  -- current GPS location of the mechanic, updated in realtime
  -- geography type is more accurate than geometry for real-world distances
  -- it treats coordinates as points on a sphere, not a flat grid
  current_location geography(Point, 4326),

  -- human-readable area for display (e.g. "Tema, Greater Accra")
  location_label text,

  -- last time their location was updated
  -- lets us filter out mechanics whose location data is stale
  location_updated_at timestamptz,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- SPATIAL INDEX — this is the most important index in the whole schema.
-- Without it, every "find nearby mechanics" query does a full table scan.
-- With it, PostgreSQL uses a spatial tree (GiST) to find nearby points fast.
create index idx_mechanic_profiles_location
  on mechanic_profiles using gist(current_location);

-- Fast lookup for filtering available + verified mechanics
create index idx_mechanic_profiles_availability
  on mechanic_profiles(verification_status, is_available);

create trigger mechanic_profiles_updated_at
  before update on mechanic_profiles
  for each row execute function update_updated_at();