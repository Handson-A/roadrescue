-- Change request queue for semi-locked fields.
-- Users submit requested edits here; admins review and approve/reject.

create table profile_change_requests (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null check (role in ('driver', 'mechanic')),
  target_table text not null check (target_table in ('profiles', 'driver_profiles', 'mechanic_profiles')),
  field_key text not null,
  old_value jsonb,
  new_value jsonb not null,
  reason text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  review_notes text,
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_profile_change_requests_user_id on profile_change_requests(user_id, status);
create index idx_profile_change_requests_status on profile_change_requests(status, created_at);

create trigger profile_change_requests_updated_at
  before update on profile_change_requests
  for each row execute function update_updated_at();