-- supabase/migrations/20260521000008_seed_data.sql

-- Seed users for local development and demos.
-- The profiles row is created from auth.users via the trigger in
-- 20260521000002_create_profiles.sql, so we seed auth first and then
-- extend mechanics and drivers with their role-specific tables.

with seed_users (id, email, full_name, phone, role, avatar_url, password_plaintext) as (
  values
    ('11111111-1111-4111-8111-000000000001'::uuid, 'ama.boakye@roadrescue.test', 'Ama Boakye', '+233201000001', 'admin', null, 'RoadRescue123!'),
    ('11111111-1111-4111-8111-000000000002'::uuid, 'kojo.mensah@roadrescue.test', 'Kojo Mensah', '+233201000002', 'admin', null, 'RoadRescue123!'),

    ('22222222-2222-4222-8222-000000000001'::uuid, 'kwame.asare@roadrescue.test', 'Kwame Asare', '+233201000101', 'mechanic', null, 'RoadRescue123!'),
    ('22222222-2222-4222-8222-000000000002'::uuid, 'nana.opoku@roadrescue.test', 'Nana Opoku', '+233201000102', 'mechanic', null, 'RoadRescue123!'),
    ('22222222-2222-4222-8222-000000000003'::uuid, 'yaw.ampofo@roadrescue.test', 'Yaw Ampofo', '+233201000103', 'mechanic', null, 'RoadRescue123!'),
    ('22222222-2222-4222-8222-000000000004'::uuid, 'doris.akyereko@roadrescue.test', 'Doris Akyereko', '+233201000104', 'mechanic', null, 'RoadRescue123!'),
    ('22222222-2222-4222-8222-000000000005'::uuid, 'kofi.danquah@roadrescue.test', 'Kofi Danquah', '+233201000105', 'mechanic', null, 'RoadRescue123!'),

    ('33333333-3333-4333-8333-000000000001'::uuid, 'michael.owusu@roadrescue.test', 'Michael Owusu', '+233201000201', 'driver', null, 'RoadRescue123!'),
    ('33333333-3333-4333-8333-000000000002'::uuid, 'grace.ntiamoah@roadrescue.test', 'Grace Ntiamoah', '+233201000202', 'driver', null, 'RoadRescue123!'),
    ('33333333-3333-4333-8333-000000000003'::uuid, 'samuel.mintah@roadrescue.test', 'Samuel Mintah', '+233201000203', 'driver', null, 'RoadRescue123!')
),
seed_auth as (
  insert into auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  )
  select
    id,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated',
    'authenticated',
    email,
    crypt(password_plaintext, gen_salt('bf')),
    now(),
    jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
    jsonb_build_object('full_name', full_name, 'phone', phone, 'role', role),
    now(),
    now()
  from seed_users
  on conflict (id) do update
    set encrypted_password = excluded.encrypted_password,
        email_confirmed_at = excluded.email_confirmed_at,
        raw_app_meta_data = excluded.raw_app_meta_data,
        raw_user_meta_data = excluded.raw_user_meta_data,
        updated_at = excluded.updated_at
  returning id
)
select 'seed complete' as status from seed_auth limit 1;

insert into mechanic_profiles (
  user_id,
  specializations,
  years_experience,
  business_name,
  verification_status,
  verified_at,
  verified_by,
  credential_document_url,
  rating_avg,
  total_jobs,
  is_available,
  current_location,
  location_label,
  location_updated_at,
  created_at,
  updated_at
)
values
  (
    '22222222-2222-4222-8222-000000000001'::uuid,
    array['engine', 'diagnostics', 'battery']::text[],
    8,
    'Asare Mobile Garage',
    'verified',
    now(),
    '11111111-1111-4111-8111-000000000001'::uuid,
    null,
    4.90,
    148,
    true,
    st_setsrid(st_makepoint(-0.2066, 5.6037), 4326)::geography,
    'Circle, Accra',
    now(),
    now(),
    now()
  ),
  (
    '22222222-2222-4222-8222-000000000002'::uuid,
    array['tyres', 'towing', 'suspension']::text[],
    6,
    'Opoku Roadside Rescue',
    'verified',
    now(),
    '11111111-1111-4111-8111-000000000002'::uuid,
    null,
    4.70,
    96,
    true,
    st_setsrid(st_makepoint(-0.1729, 5.5600), 4326)::geography,
    'Tema Station, Tema',
    now(),
    now(),
    now()
  ),
  (
    '22222222-2222-4222-8222-000000000003'::uuid,
    array['electrical', 'alternator', 'starter']::text[],
    10,
    'Ampofo Auto Care',
    'verified',
    now(),
    '11111111-1111-4111-8111-000000000001'::uuid,
    null,
    4.80,
    173,
    true,
    st_setsrid(st_makepoint(-0.2393, 5.6148), 4326)::geography,
    'Kaneshie, Accra',
    now(),
    now(),
    now()
  ),
  (
    '22222222-2222-4222-8222-000000000004'::uuid,
    array['brakes', 'engine', 'cooling']::text[],
    5,
    'Akyereko Mobile Mechanics',
    'verified',
    now(),
    '11111111-1111-4111-8111-000000000002'::uuid,
    null,
    4.60,
    74,
    true,
    st_setsrid(st_makepoint(-0.1870, 5.5798), 4326)::geography,
    'Teshie, Accra',
    now(),
    now(),
    now()
  ),
  (
    '22222222-2222-4222-8222-000000000005'::uuid,
    array['bodywork', 'tyres', 'battery']::text[],
    9,
    'Danquah Auto Service',
    'verified',
    now(),
    '11111111-1111-4111-8111-000000000001'::uuid,
    null,
    4.95,
    201,
    true,
    st_setsrid(st_makepoint(-0.2773, 5.6540), 4326)::geography,
    'Mallam, Accra',
    now(),
    now(),
    now()
  )
on conflict (user_id) do update
  set specializations = excluded.specializations,
      years_experience = excluded.years_experience,
      business_name = excluded.business_name,
      verification_status = excluded.verification_status,
      verified_at = excluded.verified_at,
      verified_by = excluded.verified_by,
      credential_document_url = excluded.credential_document_url,
      rating_avg = excluded.rating_avg,
      total_jobs = excluded.total_jobs,
      is_available = excluded.is_available,
      current_location = excluded.current_location,
      location_label = excluded.location_label,
      location_updated_at = excluded.location_updated_at,
      updated_at = excluded.updated_at;

insert into driver_profiles (
  user_id,
  vehicle_make,
  vehicle_model,
  vehicle_year,
  vehicle_color,
  vehicle_plate,
  emergency_contact_name,
  emergency_contact_phone,
  home_area,
  rating_avg,
  total_requests,
  created_at,
  updated_at
)
values
  (
    '33333333-3333-4333-8333-000000000001'::uuid,
    'Toyota',
    'Corolla',
    2018,
    'Silver',
    'GR-1842-22',
    'Esi Owusu',
    '+233201000301',
    'East Legon, Accra',
    0.00,
    0,
    now(),
    now()
  ),
  (
    '33333333-3333-4333-8333-000000000002'::uuid,
    'Honda',
    'Civic',
    2020,
    'Blue',
    'AS-4412-21',
    'Kobby Nartey',
    '+233201000302',
    'Adenta, Accra',
    0.00,
    0,
    now(),
    now()
  ),
  (
    '33333333-3333-4333-8333-000000000003'::uuid,
    'Hyundai',
    'Elantra',
    2017,
    'White',
    'GA-9021-20',
    'Abena Serwaa',
    '+233201000303',
    'Madina, Accra',
    0.00,
    0,
    now(),
    now()
  )
on conflict (user_id) do update
  set vehicle_make = excluded.vehicle_make,
      vehicle_model = excluded.vehicle_model,
      vehicle_year = excluded.vehicle_year,
      vehicle_color = excluded.vehicle_color,
      vehicle_plate = excluded.vehicle_plate,
      emergency_contact_name = excluded.emergency_contact_name,
      emergency_contact_phone = excluded.emergency_contact_phone,
      home_area = excluded.home_area,
      rating_avg = excluded.rating_avg,
      total_requests = excluded.total_requests,
      updated_at = excluded.updated_at;