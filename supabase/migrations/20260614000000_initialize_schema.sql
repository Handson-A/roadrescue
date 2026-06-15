 -- ============================================================================
-- SECTION 1: CUSTOM EXTENSIONS & ENUMS
-- ============================================================================

create extension if not exists pgcrypto;
create extension if not exists postgis;

create type public.user_role as enum ('admin', 'driver', 'mechanic');

create type public.request_status as enum (
  'pending',
  'accepted',
  'en_route',
  'arrived',
  'in_progress',
  'completed',
  'cancelled'
);

create type public.verification_status as enum (
  'pending',
  'approved',
  'rejected'
);

create type public.notification_type as enum (
  'system',
  'request',
  'chat',
  'verification'
);

-- ============================================================================
-- SECTION 2: PRIMARY CORE TABLES
-- ============================================================================

-- profiles: 1:1 with auth.users
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'driver',
  full_name text not null default '',
  email text not null default '',
  phone text not null default '',
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- driver_profiles: driver-specific data
create table public.driver_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  emergency_contact_name text not null default '',
  emergency_contact_phone text not null default '',
  home_area text not null default '',
  created_at timestamptz not null default now()
);

-- mechanic_profiles: mechanic-specific business data and dynamic tracking
create table public.mechanic_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  business_name text not null default '',
  years_experience integer not null default 0,
  specializations jsonb not null default '[]'::jsonb,
  location_label text not null default '',
  rating_avg numeric(3,2) not null default 5.0,
  rating_count integer not null default 0,
  is_available boolean not null default false,
  current_location geometry(point, 4326),
  location_updated_at timestamptz,
  created_at timestamptz not null default now()
);

-- admin_profiles: internal administration tracking
create table public.admin_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- mechanic_verifications: application review log for admins
create table public.mechanic_verifications (
  id uuid primary key default gen_random_uuid(),
  mechanic_id uuid not null references public.mechanic_profiles(user_id) on delete cascade,
  status public.verification_status not null default 'pending',
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now()
);

-- mechanic_documents: compliance file mappings
create table public.mechanic_documents (
  id uuid primary key default gen_random_uuid(),
  mechanic_id uuid not null references public.mechanic_profiles(user_id) on delete cascade,
  document_name text not null,
  file_url text not null,
  created_at timestamptz not null default now()
);

-- rescue_requests: transaction table tracking operations
create table public.rescue_requests (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.profiles(id) on delete cascade,
  mechanic_id uuid references public.profiles(id) on delete set null,
  status public.request_status not null default 'pending',
  service_type text not null default 'other',
  problem_description text not null default '',
  incident_address text not null default '',
  incident_location geometry(point, 4326),
  incident_lat numeric(10,8),
  incident_lng numeric(11,8),
  
  -- Vehicle snap-shot values at instantiation point
  vehicle_make text not null default '',
  vehicle_model text not null default '',
  vehicle_year integer,
  vehicle_color text not null default '',
  vehicle_plate text not null default '',
  vehicle_image_url text,
  
  -- Lifecycle operational logging timestamps
  accepted_at timestamptz,
  en_route_at timestamptz,
  arrived_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancelled_by uuid references public.profiles(id) on delete set null,
  cancellation_reason text,
  completion_notes text,
  performed_services jsonb not null default '[]'::jsonb,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- request_status_history: append-only table safeguarding lifecycle mutations
create table public.request_status_history (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.rescue_requests(id) on delete cascade,
  status public.request_status not null,
  changed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- messages: real-time contextual direct communication channel
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.rescue_requests(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now()
);

-- notifications: real-time in-app notification stack
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default '',
  body text not null default '',
  type public.notification_type not null default 'system',
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ai_diagnostics: structural separation block isolated for analysis workloads
create table public.ai_diagnostics (
  id uuid primary key default gen_random_uuid(),
  request_id uuid unique not null references public.rescue_requests(id) on delete cascade,
  symptoms jsonb not null default '{}'::jsonb,
  probable_causes jsonb not null default '[]'::jsonb,
  recommendations jsonb not null default '[]'::jsonb,
  confidence_score numeric(5,2),
  created_at timestamptz not null default now()
);

-- request_reviews: transaction closeout evaluation logging
create table public.request_reviews (
  id uuid primary key default gen_random_uuid(),
  request_id uuid unique not null references public.rescue_requests(id) on delete cascade,
  driver_id uuid references public.profiles(id) on delete set null,
  mechanic_id uuid references public.profiles(id) on delete set null,
  rating integer not null check (rating between 1 and 5),
  review text,
  created_at timestamptz not null default now()
);

-- mechanic_locations: timeseries-like logging historical coordinate sets
create table public.mechanic_locations (
  id uuid primary key default gen_random_uuid(),
  mechanic_id uuid not null references public.mechanic_profiles(user_id) on delete cascade,
  location geometry(point,4326) not null,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- SECTION 3: AUTOMATION TRIGGERS & UTILITIES
-- ============================================================================

-- Global trigger function for handling timestamps
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_profiles_updated
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger trg_requests_updated
  before update on public.rescue_requests
  for each row execute function public.set_updated_at();


-- Pipeline status logging auto-trigger
create or replace function public.log_request_status_change()
returns trigger as $$
begin
  if (tg_op = 'INSERT') or (old.status is distinct from new.status) then
    insert into public.request_status_history (request_id, status, changed_by)
    values (new.id, new.status, auth.uid());
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_request_status_history_log
  after insert or update on public.rescue_requests
  for each row execute function public.log_request_status_change();


-- Base transactional registration sync handler
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  assigned_role public.user_role;
  extracted_name text;
begin
  assigned_role := coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'driver'::public.user_role);
  extracted_name := coalesce(new.raw_user_meta_data->>'full_name', '');

  insert into public.profiles (id, role, full_name, email, phone, avatar_url)
  values (
    new.id,
    assigned_role,
    extracted_name,
    coalesce(new.email, ''),
    coalesce(new.phone, ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  )
  on conflict (id) do update set
    email = excluded.email,
    updated_at = now();

  -- Sub-profile generation router mapping
  case assigned_role
    when 'driver' then
      insert into public.driver_profiles (user_id) values (new.id) on conflict do nothing;
    when 'mechanic' then
      insert into public.mechanic_profiles (user_id, business_name) 
      values (new.id, case when extracted_name = '' then 'Independent Mechanic' else extracted_name || ' Workshop' end) 
      on conflict do nothing;
    when 'admin' then
      insert into public.admin_profiles (user_id) values (new.id) on conflict do nothing;
  end case;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ============================================================================
-- SECTION 4: ROW LEVEL SECURITY & POLICIES
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.driver_profiles enable row level security;
alter table public.mechanic_profiles enable row level security;
alter table public.admin_profiles enable row level security;
alter table public.mechanic_verifications enable row level security;
alter table public.mechanic_documents enable row level security;
alter table public.rescue_requests enable row level security;
alter table public.request_status_history enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.ai_diagnostics enable row level security;
alter table public.request_reviews enable row level security;
alter table public.mechanic_locations enable row level security;

-- Modular helper functions for clean RLS policy evaluations
create or replace function public.is_admin(user_uuid uuid)
returns boolean security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = user_uuid and role = 'admin');
$$ language sql;

create or replace function public.is_mechanic(user_uuid uuid)
returns boolean security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = user_uuid and role = 'mechanic');
$$ language sql;

-- Profiles Access controls
create policy "Profiles are viewable by authenticated users" 
  on public.profiles for select to authenticated using (true);
create policy "Profiles can be updated by owners" 
  on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "Profiles can be managed by admins" 
  on public.profiles for all to authenticated using (public.is_admin(auth.uid()));

-- Specialized Profiles Access controls
create policy "Drivers profiles read access" on public.driver_profiles for select to authenticated using (true);
create policy "Drivers profiles updates" on public.driver_profiles for update to authenticated using (auth.uid() = user_id);

create policy "Mechanic profiles read access" on public.mechanic_profiles for select to authenticated using (true);
create policy "Mechanic profiles updates" on public.mechanic_profiles for update to authenticated using (auth.uid() = user_id);

-- Operational Verifications & Docs Controls
create policy "Admins see all documents, Mechanics see own"
  on public.mechanic_documents for select to authenticated 
  using (auth.uid() = mechanic_id or public.is_admin(auth.uid()));
create policy "Mechanics upload own documents"
  on public.mechanic_documents for insert to authenticated 
  with check (auth.uid() = mechanic_id);

create policy "Admins see all verifications, Mechanics see own"
  on public.mechanic_verifications for select to authenticated 
  using (auth.uid() = mechanic_id or public.is_admin(auth.uid()));
create policy "Only Admins can issue mutations on verifications"
  on public.mechanic_verifications for all to authenticated 
  using (public.is_admin(auth.uid()));

-- Rescue Requests Management Framework
create policy "Rescue requests visibility matrix"
  on public.rescue_requests for select to authenticated
  using (
    auth.uid() = driver_id 
    or auth.uid() = mechanic_id 
    or public.is_admin(auth.uid())
    or (status = 'pending' and public.is_mechanic(auth.uid()))
  );

create policy "Drivers can post rescue requests"
  on public.rescue_requests for insert to authenticated 
  with check (auth.uid() = driver_id);

create policy "Authorized parties can update requests"
  on public.rescue_requests for update to authenticated
  using (
    auth.uid() = driver_id 
    or auth.uid() = mechanic_id 
    or public.is_admin(auth.uid())
  );

-- Chat messaging policy checks
create policy "Participants can read request messages"
  on public.messages for select to authenticated
  using (
    exists (
      select 1 from public.rescue_requests r 
      where r.id = messages.request_id and (r.driver_id = auth.uid() or r.mechanic_id = auth.uid() or public.is_admin(auth.uid()))
    )
  );

create policy "Users can post to their respective sessions"
  on public.messages for insert to authenticated
  with check (
    auth.uid() = sender_id and 
    exists (
      select 1 from public.rescue_requests r 
      where r.id = request_id and (r.driver_id = auth.uid() or r.mechanic_id = auth.uid())
    )
  );

-- Notifications system isolation
create policy "Users interact with their own notifications"
  on public.notifications for all to authenticated
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

-- System tracking and diagnostic offloading policies
create policy "Diagnostic records viewing rule"
  on public.ai_diagnostics for select to authenticated
  using (
    exists (
      select 1 from public.rescue_requests r 
      where r.id = ai_diagnostics.request_id and (r.driver_id = auth.uid() or r.mechanic_id = auth.uid() or public.is_admin(auth.uid()))
    )
  );

create policy "Reviews read authorization rule"
  on public.request_reviews for select to authenticated using (true);
create policy "Drivers submit reviews for their orders"
  on public.request_reviews for insert to authenticated 
  with check (auth.uid() = driver_id);

-- Location records write pipeline
create policy "Mechanics stream location tracks"
  on public.mechanic_locations for insert to authenticated with check (auth.uid() = mechanic_id);
create policy "Admins and authorized driver can see assigned mechanic traces"
  on public.mechanic_locations for select to authenticated
  using (
    public.is_admin(auth.uid()) or 
    exists (
      select 1 from public.rescue_requests r 
      where r.mechanic_id = mechanic_locations.mechanic_id and r.driver_id = auth.uid() and r.status in ('accepted', 'en_route', 'arrived', 'in_progress')
    )
  );

-- ============================================================================
-- SECTION 5: PERFORMANCE INDEXES
-- ============================================================================

-- Foreign Keys B-Tree Performance Enhancements
create index if not exists idx_rescue_requests_driver_id on public.rescue_requests (driver_id);
create index if not exists idx_rescue_requests_mechanic_id on public.rescue_requests (mechanic_id);
create index if not exists idx_rescue_requests_status on public.rescue_requests (status);
create index if not exists idx_rescue_requests_created_at on public.rescue_requests (created_at desc);

-- Chat Appending Optimization
create index if not exists idx_messages_request_composite on public.messages (request_id, created_at asc);

-- Targeted Notification Polls Optimization
create index if not exists idx_notifications_lookup_unread on public.notifications (profile_id) where is_read = false;

-- Timeseries & Append-only Performance Blocks
create index if not exists idx_status_history_parent on public.request_status_history (request_id);

-- PostGIS Quadtree Spatial Index Optimization structures
create index if not exists idx_mechanic_profiles_geo_gist on public.mechanic_profiles using gist (current_location);
create index if not exists idx_mechanic_locations_geo_gist on public.mechanic_locations using gist (location);

-- ============================================================================
-- SECTION 6: STORED PROCEDURES FOR SUPABASE RPC
-- ============================================================================

create or replace function public.get_nearby_verified_mechanics(
  request_latitude numeric,
  request_longitude numeric,
  search_radius_km numeric default 10
)
returns table (
  user_id uuid,
  business_name text,
  rating_avg numeric,
  distance_km numeric
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    mp.user_id,
    mp.business_name,
    mp.rating_avg,
    round(
      (st_distance(
        mp.current_location::geography,
        st_setsrid(st_makepoint(request_longitude, request_latitude), 4326)::geography
      ) / 1000.0)::numeric,
      2
    ) as distance_km
  from public.mechanic_profiles mp
  where mp.is_available = true
    and mp.current_location is not null
    and exists (
      select 1 from public.mechanic_verifications mv 
      where mv.mechanic_id = mp.user_id and mv.status = 'approved'
    )
    and st_dwithin(
      mp.current_location::geography,
      st_setsrid(st_makepoint(request_longitude, request_latitude), 4326)::geography,
      search_radius_km * 1000
    )
  order by distance_km asc;
end;
$$;

-- ============================================================================
-- SECTION 7: REALTIME REPLICATION MANAGEMENT
-- ============================================================================

-- Safely ensure the publication engine exists in target database
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end;
$$;

-- Bind tables cleanly to the real-time wire layer
alter publication supabase_realtime set table 
  public.rescue_requests,
  public.messages,
  public.notifications,
  public.mechanic_profiles;