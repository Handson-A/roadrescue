/**
 * Supabase Migration: Seed Sample Data
 * Populate database with test data for development
 * Timestamp: 2026-05-21 00:00:08
 */

-- Insert sample profiles (drivers)
INSERT INTO public.profiles (id, email, full_name, phone, role, status)
VALUES
  ('550e8400-e29b-41d4-a716-446655440001'::uuid, 'driver1@example.com', 'Alice Johnson', '555-0111', 'driver', 'active'),
  ('550e8400-e29b-41d4-a716-446655440002'::uuid, 'driver2@example.com', 'Bob Wilson', '555-0112', 'driver', 'active')
ON CONFLICT DO NOTHING;

-- Insert sample profiles (mechanics)
INSERT INTO public.profiles (id, email, full_name, phone, role, status)
VALUES
  ('550e8400-e29b-41d4-a716-446655440010'::uuid, 'mechanic1@example.com', 'John Smith', '555-0121', 'mechanic', 'active'),
  ('550e8400-e29b-41d4-a716-446655440011'::uuid, 'mechanic2@example.com', 'Maria Garcia', '555-0122', 'mechanic', 'active')
ON CONFLICT DO NOTHING;

-- Insert sample mechanic profiles
INSERT INTO public.mechanic_profiles (
  user_id, license_number, verification_status, verified_at,
  years_experience, hourly_rate, service_area_lat, service_area_lon,
  current_status, total_jobs_completed
)
VALUES
  (
    '550e8400-e29b-41d4-a716-446655440010'::uuid,
    'LIC-001',
    'verified',
    CURRENT_TIMESTAMP,
    8,
    75.00,
    40.7128,
    -74.0060,
    'online',
    45
  ),
  (
    '550e8400-e29b-41d4-a716-446655440011'::uuid,
    'LIC-002',
    'verified',
    CURRENT_TIMESTAMP,
    12,
    85.00,
    40.7489,
    -73.9680,
    'online',
    127
  )
ON CONFLICT DO NOTHING;

-- Sample rescue requests
INSERT INTO public.rescue_requests (
  driver_id, issue_description, vehicle_details,
  latitude, longitude, status
)
VALUES
  (
    '550e8400-e29b-41d4-a716-446655440001'::uuid,
    'Flat tire on highway',
    '2022 Toyota Camry',
    40.7128,
    -74.0060,
    'PENDING'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440002'::uuid,
    'Engine overheating',
    '2019 Honda Civic',
    40.7489,
    -73.9680,
    'ASSIGNED'
  )
ON CONFLICT DO NOTHING;

COMMIT;
