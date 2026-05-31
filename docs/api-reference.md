# RoadRescue API Reference

## Base URL

- **Production**: `https://roadrescue.vercel.app`
- **Development**: `http://localhost:3000`

## Authentication

All endpoints (except auth) require Bearer token in Authorization header:

```
Authorization: Bearer <jwt_token>
```

---

## Authentication Endpoints

### Login
```
POST /api/auth/login
Content-Type: application/json

Body:
{
  "email": "user@example.com",
  "password": "password123"
}

Response (200 OK):
{
  "token": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "driver"
  }
}
```

### Register
```
POST /api/auth/register
Content-Type: application/json

Body:
{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "John Doe",
  "phone": "+1-555-0000",
  "role": "driver"
}

Response (201 Created):
{
  "token": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "driver"
  }
}
```

### Logout
```
POST /api/auth/logout
Authorization: Bearer <token>

Response (200 OK):
{
  "message": "Logged out successfully"
}
```

---

## Rescue Request Endpoints

### Create Rescue Request
```
POST /api/requests
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "vehicle_details": "2020 Toyota Camry, Blue",
  "issue_description": "Engine is overheating",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "location_address": "123 Main St, NYC"
}

Response (201 Created):
{
  "request": {
    "id": "uuid",
    "status": "PENDING",
    "created_at": "2026-05-21T10:00:00Z"
  }
}
```

### Get Request Details
```
GET /api/requests/:id
Authorization: Bearer <token>

Response (200 OK):
{
  "request": {
    "id": "uuid",
    "driver_id": "uuid",
    "assigned_mechanic_id": "uuid",
    "vehicle_details": "2020 Toyota Camry",
    "issue_description": "Engine overheating",
    "ai_diagnosis": "Likely thermostat failure...",
    "status": "ASSIGNED",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "created_at": "2026-05-21T10:00:00Z",
    "assigned_at": "2026-05-21T10:05:00Z"
  }
}
```

### List User's Requests
```
GET /api/requests?status=PENDING&limit=10&offset=0
Authorization: Bearer <token>

Response (200 OK):
{
  "requests": [
    {
      "id": "uuid",
      "status": "PENDING",
      "vehicle_details": "2020 Toyota Camry",
      "created_at": "2026-05-21T10:00:00Z"
    }
  ],
  "total": 1
}
```

### Update Request Status
```
PATCH /api/requests/:id
Authorization: Bearer <token>
Content-Type: application/json

Body (Admin or Assigned Mechanic):
{
  "status": "IN_PROGRESS",
  "completion_notes": "Service completed"
}

Response (200 OK):
{
  "request": { ... updated request ... }
}
```

### Cancel Request
```
POST /api/requests/:id/cancel
Authorization: Bearer <token>

Response (200 OK):
{
  "message": "Request cancelled successfully"
}
```

---

## AI Diagnostics Endpoints

### Get Vehicle Diagnosis
```
POST /api/ai/diagnose
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "vehicle_description": "2020 Toyota Camry with 75000 miles",
  "symptoms": "Engine makes clicking noise on cold start, oil pressure low"
}

Response (200 OK):
{
  "diagnosis": "Based on the clicking noise and low oil pressure, this likely indicates...",
  "priority": "HIGH"
}
```

---

## Mechanic Endpoints

### Get Nearby Requests
```
GET /api/mechanics/nearby-requests?lat=40.7128&lon=-74.0060&radius=10
Authorization: Bearer <token>

Response (200 OK):
{
  "requests": [
    {
      "id": "uuid",
      "driver": { "name": "John", "rating": 4.8 },
      "issue": "Flat tire",
      "distance_km": 2.5,
      "created_at": "2026-05-21T10:00:00Z"
    }
  ]
}
```

### Place Bid
```
POST /api/mechanics/bids
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "request_id": "uuid",
  "proposed_price": 75.00,
  "estimated_arrival_time": 15
}

Response (201 Created):
{
  "bid": {
    "id": "uuid",
    "request_id": "uuid",
    "bid_status": "pending"
  }
}
```

### Update Location
```
POST /api/mechanics/location
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "latitude": 40.7128,
  "longitude": -74.0060
}

Response (200 OK):
{
  "message": "Location updated"
}
```

---

## Admin Endpoints

### Get Platform Statistics
```
GET /api/admin/stats
Authorization: Bearer <admin_token>

Response (200 OK):
{
  "total_users": 1250,
  "active_requests": 45,
  "completed_requests": 892,
  "verified_mechanics": 312,
  "average_response_time": "4.2 minutes",
  "total_revenue": 45230.50,
  "platform_rating": 4.6
}
```

### Get All Users
```
GET /api/admin/users?role=mechanic&limit=20&offset=0
Authorization: Bearer <admin_token>

Response (200 OK):
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "John Doe",
      "role": "mechanic",
      "status": "active",
      "created_at": "2026-05-21T10:00:00Z"
    }
  ],
  "total": 312
}
```

### Get All Requests
```
GET /api/admin/requests?status=PENDING&limit=20&offset=0
Authorization: Bearer <admin_token>

Response (200 OK):
{
  "requests": [
    {
      "id": "uuid",
      "driver": { "name": "John", "email": "john@example.com" },
      "mechanic": { "name": "Jane", "email": "jane@example.com" },
      "status": "PENDING",
      "created_at": "2026-05-21T10:00:00Z"
    }
  ],
  "total": 245
}
```

### Get All Mechanics
```
GET /api/admin/mechanics?verification_status=pending&limit=20&offset=0
Authorization: Bearer <admin_token>

Response (200 OK):
{
  "mechanics": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "full_name": "Jane Smith",
      "license_number": "DRV-2026-00123",
      "years_experience": 8,
      "verification_status": "pending",
      "total_jobs": 45,
      "average_rating": 4.8
    }
  ],
  "total": 12
}
```

### Approve or Reject Mechanic Profile
```
PATCH /api/admin/mechanics/:id
Authorization: Bearer <admin_token>
Content-Type: application/json

Body:
{
  "verification_status": "verified"
}

Response (200 OK):
{
  "message": "Mechanic profile updated successfully",
  "mechanic": {
    "id": "uuid",
    "verification_status": "verified",
    "verified_at": "2026-05-21T10:00:00Z"
  }
}

Use `verification_status: "rejected"` to reject an application.
```

### Escalate User to Admin
```
POST /api/admin/escalate
Authorization: Bearer <admin_token>
Content-Type: application/json

Body:
{
  "email": "user@example.com"
}

Response (200 OK):
{
  "message": "User promoted to admin successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "admin",
    "updated_at": "2026-05-21T10:00:00Z"
  }
}
```

### Suspend/Unsuspend User
```
PATCH /api/admin/users/:id/status
Authorization: Bearer <admin_token>
Content-Type: application/json

Body:
{
  "status": "suspended"
}

Response (200 OK):
{
  "message": "User status updated",
  "user": {
    "id": "uuid",
    "status": "suspended",
    "updated_at": "2026-05-21T10:00:00Z"
  }
}
```

---

## Webhook Endpoints

### Handle Third-Party Webhooks
```
POST /api/webhooks
Content-Type: application/json

Body (varies by service):
{
  "event": "payment_completed|notification|etc",
  "data": { ... }
}

Response (200 OK):
{
  "message": "Webhook processed"
}
```

---

## Error Responses

All errors return JSON with status code:

### 400 Bad Request
```json
{
  "error": "Invalid request parameters",
  "details": "Field 'email' is required"
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required",
  "message": "Missing or invalid authorization token"
}
```

### 403 Forbidden
```json
{
  "error": "Insufficient permissions",
  "message": "Only admins can access this endpoint"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found",
  "message": "Request with ID 'xyz' does not exist"
}
```

### 429 Too Many Requests
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again later."
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```
{
  "message": "Mechanic verified successfully"
}
```

### Get Dashboard Stats
```
GET /api/admin/stats
Authorization: Bearer <admin_token>

Response (200 OK):
{
  "total_users": 1250,
  "active_requests": 23,
  "pending_verifications": 8,
  "today_revenue": 3750.00,
  "average_rating": 4.7
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Bad Request",
  "message": "Missing required field: vehicle_details"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "Admin access required"
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Request with ID 'uuid' not found"
}
```

### 429 Too Many Requests
```json
{
  "error": "Rate Limit Exceeded",
  "message": "Too many requests. Try again later.",
  "retry_after": 60
}
```

### 500 Server Error
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

---

## Rate Limiting

- **Create Request**: 10 requests per hour per user
- **Place Bid**: 20 bids per hour per mechanic
- **Diagnose**: 5 diagnoses per hour per user
- **All endpoints**: Global 100 requests per minute per IP

---

## Websocket Events (Realtime)

### Subscribe to Request Updates
```javascript
channel = supabase
  .channel(`requests:${requestId}`)
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'rescue_requests' },
    (payload) => handleUpdate(payload)
  )
  .subscribe();
```

### Example Events
```javascript
// Assignment event
{
  eventType: 'UPDATE',
  new: {
    id: 'uuid',
    status: 'ASSIGNED',
    assigned_mechanic_id: '{{mechanicUuid}}'
  }
}

// Completion event
{
  eventType: 'UPDATE',
  new: {
    id: 'uuid',
    status: 'COMPLETED',
    completed_at: '2026-05-21T10:30:00Z'
  }
}
```

---

## Webhooks

### Request Status Changed
```
POST <your-webhook-url>
Authorization: <signature>

Body:
{
  "event": "request.status_changed",
  "timestamp": "2026-05-21T10:00:00Z",
  "data": {
    "request_id": "uuid",
    "old_status": "PENDING",
    "new_status": "ASSIGNED"
  }
}
```

---

## Related Documentation

- See `architecture.md` for system overview
- See `db-schema.md` for data models
- See `state-machine.md` for request lifecycle
