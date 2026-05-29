-- User preference storage for persistent settings.
-- Shared by drivers and mechanics for UI/theme/communication preferences.

create table profile_preferences (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null unique references profiles(id) on delete cascade,
  theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
  preferred_language text not null default 'en',
  notification_preferences jsonb not null default '{"email": true, "sms": true, "push": true, "jobAlerts": true, "messageAlerts": true}'::jsonb,
  communication_preferences text[] default '{}',
  home_location_label text,
  work_location_label text,
  bio text,
  secondary_phone text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_profile_preferences_user_id on profile_preferences(user_id);

create trigger profile_preferences_updated_at
  before update on profile_preferences
  for each row execute function update_updated_at();