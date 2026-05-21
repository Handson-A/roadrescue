# RoadRescue Database Schema

## Tables Overview

### 1. profiles
User account information for all roles (drivers, mechanics, admins)

```sql
profiles {
  id: UUID (PK)
  email: TEXT (UNIQUE)
  full_name: TEXT
  phone: TEXT
  avatar_url: TEXT
  role: TEXT ('driver' | 'mechanic' | 'admin')
  status: TEXT ('active' | 'inactive' | 'suspended')
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
  last_login_at: TIMESTAMP
}
```

**Indexes**: email, role, status

---

### 2. mechanic_profiles
Extended information for mechanics only

```sql
mechanic_profiles {
  id: UUID (PK)
  user_id: UUID (FK → profiles)
  license_number: TEXT (UNIQUE)
  license_expiry: DATE
  verification_status: TEXT ('pending' | 'verified' | 'rejected')
  verified_at: TIMESTAMP
  verified_by: UUID (FK → profiles)
  years_experience: INTEGER
  certifications: TEXT[]
  specializations: TEXT[]
  hourly_rate: DECIMAL
  service_area_lat: DECIMAL
  service_area_lon: DECIMAL
  service_radius_km: INTEGER
  current_status: TEXT ('online' | 'offline' | 'on_job')
  total_jobs_completed: INTEGER
  average_rating: DECIMAL
  total_earnings: DECIMAL
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}
```

**Indexes**: verification_status, current_status, GiST on location

---

### 3. rescue_requests
Core rescue request records

```sql
rescue_requests {
  id: UUID (PK)
  driver_id: UUID (FK → profiles)
  assigned_mechanic_id: UUID (FK → profiles)
  vehicle_details: TEXT
  issue_description: TEXT
  issue_priority: TEXT ('LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL')
  ai_diagnosis: TEXT
  latitude: DECIMAL
  longitude: DECIMAL
  location_address: TEXT
  status: TEXT (see state machine)
  created_at: TIMESTAMP
  assigned_at: TIMESTAMP
  started_at: TIMESTAMP
  completed_at: TIMESTAMP
  cancelled_at: TIMESTAMP
  completion_notes: TEXT
  driver_rating: INTEGER (1-5)
  mechanic_rating: INTEGER (1-5)
  updated_at: TIMESTAMP
}
```

**Indexes**: driver_id, assigned_mechanic_id, status, created_at, GiST on location

---

### 4. request_bids
Mechanic bids on pending rescue requests

```sql
request_bids {
  id: UUID (PK)
  request_id: UUID (FK → rescue_requests)
  mechanic_id: UUID (FK → profiles)
  proposed_price: DECIMAL
  estimated_arrival_time: INTEGER (minutes)
  message: TEXT
  bid_status: TEXT ('pending' | 'accepted' | 'rejected')
  created_at: TIMESTAMP
  responded_at: TIMESTAMP
  CONSTRAINT: one bid per mechanic per request
}
```

**Indexes**: request_id, mechanic_id, bids_status

---

### 5. notifications
User notifications

```sql
notifications {
  id: UUID (PK)
  user_id: UUID (FK → profiles)
  type: TEXT (request_assigned | bid_received | etc.)
  title: TEXT
  message: TEXT
  related_id: UUID
  is_read: BOOLEAN
  read_at: TIMESTAMP
  created_at: TIMESTAMP
}
```

**Indexes**: user_id, is_read, created_at

---

## Entity Relationship Diagram

```
┌──────────────────┐
│   profiles       │
│──────────────────│
│ id (PK)          │
│ email (UNIQUE)   │
│ full_name        │
│ role             │
│ status           │
└────────┬─────────┘
         │
    ┌────┴────┐
    │         │
┌───▼──────────────────┐    ┌──────────────────────┐
│ mechanic_profiles    │    │ rescue_requests      │
│──────────────────────│    │──────────────────────│
│ id (PK)              │    │ id (PK)              │
│ user_id (FK,UNIQUE)  │    │ driver_id (FK)       │
│ license_number       │    │ assigned_mechanic_id │
│ verification_status  │    │ status               │
│ service_area (geo)   │    │ location (geo)       │
└──────────────────────┘    └──────┬───────────────┘
                                   │
                            ┌──────▼─────────────┐
                            │ request_bids       │
                            │────────────────────│
                            │ id (PK)            │
                            │ request_id (FK)    │
                            │ mechanic_id (FK)   │
                            │ proposed_price     │
                            └────────────────────┘

                            ┌──────────────────────┐
                            │ notifications        │
                            │──────────────────────│
                            │ id (PK)              │
                            │ user_id (FK)        │
                            │ type                 │
                            │ related_id           │
                            └──────────────────────┘
```

---

## Rescue Request State Machine

```
┌──────────┐
│ PENDING  │  (Driver submitted request)
└────┬─────┘
     │
     ▼
┌──────────┐  (Mechanic assigned or bid accepted)
│ ASSIGNED │
└────┬─────┘
     │
     ▼
┌─────────────┐  (Mechanic en route / at location)
│ IN_PROGRESS │
└────┬────────┘
     │
     ▼
┌─────────────┐  (Service completed)
│ COMPLETED   │
└─────────────┘

At any point → CANCELLED (Driver or mechanic cancels, or system timeout)
```

---

## Geospatial Queries

Queries use PostGIS extension for location-based operations:

```sql
-- Find mechanics within 10km radius
SELECT * FROM mechanic_profiles
WHERE ST_DWithin(
  ST_SetSRID(ST_Point(service_area_lon, service_area_lat), 4326),
  ST_SetSRID(ST_Point(driver_lon, driver_lat), 4326),
  10000  -- 10km in meters
);

-- Calculate distance between two points
SELECT ST_Distance(
  ST_SetSRID(ST_Point(lon1, lat1), 4326),
  ST_SetSRID(ST_Point(lon2, lat2), 4326)
) / 1000 as distance_km;
```

---

## Data Retention Policies

- Completed requests: Keep indefinitely for history/analytics
- Cancelled requests: Keep for 1 year
- User notifications: Keep for 3 months
- Audit logs: Keep for 1 year (future)

---

## Performance Optimizations

1. **Indexes**: All foreign keys and frequently filtered columns
2. **Geospatial Indexes**: GiST indexes on location queries
3. **Partitioning**: Consider partitioning rescue_requests by date (future)
4. **Connection Pooling**: Supabase manages via pgBouncer
5. **Query Optimization**: Use EXPLAIN ANALYZE for slow queries
