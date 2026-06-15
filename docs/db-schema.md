# RoadRescue Database Schema

## Tables

### profiles
User accounts shared by drivers, mechanics, and admins.

```sql
profiles {
  id: uuid primary key
  email: text unique
  full_name: text
  phone: text
  avatar_url: text
  role: text -- driver, mechanic, admin
  created_at: timestamptz
  updated_at: timestamptz
}
```

### mechanic_profiles
Mechanic-specific verification, availability, ratings, and location.
Updated: The account page now includes all these fields editable via the profile interface.
- `hourly_rate`: Labor rate in local currency
- `service_radius`: Maximum distance for accepting requests (km)
- `license_number` & `license_expiry`: Professional credentials
- `location_label`: Human-readable service area name

```sql
mechanic_profiles {
  id: uuid primary key
  user_id: uuid references profiles(id)
  specializations: text[]
  years_experience: integer
  business_name: text
  verification_status: text -- pending, verified, rejected
  verified_at: timestamptz
  verified_by: uuid references profiles(id)
  credential_document_url: text
  rating_avg: numeric
  total_jobs: integer
  is_available: boolean
  hourly_rate: numeric
  service_radius: integer
  license_number: text
  license_expiry: date
  current_location: geography(Point, 4326)
  location_label: text
  location_updated_at: timestamptz
  created_at: timestamptz
  updated_at: timestamptz
}
```

### driver_profiles
Driver-specific vehicle and preference data.

```sql
driver_profiles {
  id: uuid primary key
  user_id: uuid references profiles(id)
  vehicle_make: text
  vehicle_model: text
  vehicle_year: integer
  vehicle_color: text
  vehicle_plate: text
  created_at: timestamptz
  updated_at: timestamptz
}
```

### rescue_requests
Core rescue lifecycle records.

```sql
rescue_requests {
  id: uuid primary key
  driver_id: uuid references profiles(id)
  mechanic_id: uuid references profiles(id)
  status: text -- pending, accepted, en_route, arrived, in_progress, completed, cancelled
  service_type: text
  problem_description: text
  vehicle_details: text
  vehicle_make: text
  vehicle_model: text
  vehicle_year: integer
  vehicle_color: text
  vehicle_plate: text
  vehicle_image_url: text
  ai_diagnostic_result: jsonb
  incident_location: geography(Point, 4326)
  incident_address: text
  accepted_at: timestamptz
  en_route_at: timestamptz
  arrived_at: timestamptz
  started_at: timestamptz
  completed_at: timestamptz
  cancelled_at: timestamptz
  cancelled_by: uuid references profiles(id)
  cancellation_reason: text
  completion_notes: text
  performed_services: text[]
  driver_rating: integer
  driver_review: text
  created_at: timestamptz
  updated_at: timestamptz
}
```

### notifications
In-app notifications for drivers, mechanics, and admins.

```sql
notifications {
  id: uuid primary key
  user_id: uuid references profiles(id)
  type: text
  message: text
  request_id: uuid references rescue_requests(id)
  is_read: boolean
  created_at: timestamptz
}
```

### messages
Request chat between driver and assigned mechanic.

```sql
messages {
  id: uuid primary key
  request_id: uuid references rescue_requests(id)
  sender_id: uuid references profiles(id)
  sender_role: text -- driver, mechanic
  message: text
  created_at: timestamptz
}
```

### profile_preferences
User preferences.

```sql
profile_preferences {
  id: uuid primary key
  user_id: uuid references profiles(id)
  preferences: jsonb
  created_at: timestamptz
  updated_at: timestamptz
}
```

### profile_change_requests
Admin-reviewed profile updates.

```sql
profile_change_requests {
  id: uuid primary key
  user_id: uuid references profiles(id)
  requested_changes: jsonb
  status: text -- pending, approved, rejected
  reviewed_by: uuid references profiles(id)
  reviewed_at: timestamptz
  created_at: timestamptz
  updated_at: timestamptz
}
```

## Entity Relationship Diagram

```
profiles
  ├─ mechanic_profiles.user_id
  ├─ driver_profiles.user_id
  ├─ rescue_requests.driver_id
  ├─ rescue_requests.mechanic_id
  ├─ notifications.user_id
  ├─ messages.sender_id
  ├─ profile_preferences.user_id
  └─ profile_change_requests.user_id

rescue_requests
  ├─ notifications.request_id
  └─ messages.request_id
```

## Lifecycle Transitions

```
pending → accepted → en_route → arrived → in_progress → completed
```

Cancellation is allowed from `pending`, `accepted`, `en_route`, `arrived`, and `in_progress`.

## Geospatial Queries

Mechanic matching uses `mechanic_profiles.current_location` with PostGIS and the `get_nearby_verified_mechanics` SQL function.
