# RoadRescue API Reference

## Base URL

- Production: `https://roadrescue.vercel.app`
- Development: `http://localhost:3000`

## Authentication

All API routes use Supabase Auth. Include the user's session through the Supabase client or pass the JWT as:

```
Authorization: Bearer <jwt_token>
```

---

## Rescue Request Endpoints

### Create Rescue Request

```
POST /api/requests
Authorization: Bearer <driver_token>
Content-Type: application/json

Body:
{
  "driverId": "uuid",
  "incidentLat": 5.6037,
  "incidentLng": -0.187,
  "incidentAddress": "Accra, Ghana",
  "problemDescription": "Car will not start",
  "serviceType": "repair",
  "vehicleMake": "Toyota",
  "vehicleModel": "Corolla",
  "vehicleYear": 2020,
  "vehicleColor": "Blue",
  "vehiclePlate": "ABC-123"
}
```

### Get Request Details

```
GET /api/requests/:id
Authorization: Bearer <token>
```

Allowed for the request driver, assigned mechanic, or admin.

### Update Request Status

```
PATCH /api/requests/status
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "requestId": "uuid",
  "newStatus": "accepted"
}
```

Valid mechanic/admin transitions:

```
pending → accepted → en_route → arrived → in_progress → completed
```

Cancellation is also valid from:

```
pending, accepted, en_route, arrived, in_progress
```

```
{
  "requestId": "uuid",
  "newStatus": "cancelled",
  "cancellationReason": "Driver no longer needs assistance"
}
```

### Request Chat Messages

```
GET /api/requests/:id/messages
POST /api/requests/:id/messages
```

Only the driver or assigned mechanic for the request can read or send messages.

### Rate Completed Request

```
PATCH /api/requests/rate
Authorization: Bearer <driver_token>
Content-Type: application/json

Body:
{
  "requestId": "uuid",
  "rating": 5,
  "review": "Great service"
}
```

---

## AI Diagnostics

### Diagnose Vehicle Issue

```
POST /api/ai/diagnose
Content-Type: application/json

Body:
{
  "message": "Engine clicks but will not start",
  "history": [
    { "role": "user", "content": "Engine clicks but will not start" }
  ]
}

Response:
{
  "reply": "Likely causes include..."
}
```

---

## Admin Endpoints

### Platform Statistics

```
GET /api/admin/stats
Authorization: Bearer <admin_token>
```

### Requests

```
GET /api/admin/requests?status=pending&limit=20&offset=0
Authorization: Bearer <admin_token>
```

### Mechanics

```
GET /api/admin/mechanics?status=pending
PATCH /api/admin/mechanics
Authorization: Bearer <admin_token>
```

### Users and Role Escalation

```
GET /api/admin/users
POST /api/admin/escalate
Authorization: Bearer <admin_token>
```

### Profile Change Requests

```
GET /api/admin/profile-change-requests?status=pending
PATCH /api/admin/profile-change-requests
Authorization: Bearer <admin_token>
```

---

## Profile Endpoints

### Preferences

```
GET /api/profile/preferences
PATCH /api/profile/preferences
Authorization: Bearer <token>
```

Fetch or update user preferences including theme, language, notification settings, and communication preferences.

Request body for PATCH:
```json
{
  "theme": "system",
  "preferred_language": "en",
  "secondary_phone": "+233...",
  "notification_preferences": { "jobAlerts": true, "messageAlerts": true, "push": true },
  "communication_preferences": ["call", "sms"]
}
```

### Profile Change Requests

```
POST /api/profile/change-requests
Authorization: Bearer <token>
```

---

## Notification Endpoints

### Send Notification Email

```
POST /api/notifications/email
Content-Type: application/json

Body:
{
  "to": "driver@example.com",
  "subject": "Rescue request update",
  "htmlContent": "<p>Your mechanic is on the way.</p>"
}
```

---

## Webhooks

```
POST /api/webhooks
Content-Type: application/json
```

Used for third-party integrations.
