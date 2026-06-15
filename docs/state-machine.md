# RoadRescue - Request State Machine

## Lifecycle

All status changes must go through `PATCH /api/requests/status`. The server validates transitions before writing `rescue_requests`.

```
pending → accepted → en_route → arrived → in_progress → completed
```

Cancellation is allowed from:

```
pending → cancelled
accepted → cancelled
en_route → cancelled
arrived → cancelled
in_progress → cancelled
```

No status may be skipped. For example, `pending → completed` and `accepted → completed` are rejected.

## State Definitions

### pending
The driver submitted a request. Nearby verified mechanics can accept it.

### accepted
A mechanic accepted the request. The mechanic is assigned and becomes unavailable for new jobs.

### en_route
The mechanic is traveling to the driver.

### arrived
The mechanic reached the driver.

### in_progress
The mechanic is performing the service.

### completed
The job is complete. The driver can rate the mechanic.

### cancelled
The request ended before completion. Cancellation records `cancelled_at`, `cancelled_by`, and an optional reason.

## Server Validation

The authoritative transition map is in `web/src/lib/rescueLifecycle.js`:

```js
export const REQUEST_STATUS_FLOW = {
  pending: ['accepted', 'cancelled'],
  accepted: ['en_route', 'cancelled'],
  en_route: ['arrived', 'cancelled'],
  arrived: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
}
```

`web/src/lib/request.js` applies this map through `isValidTransition()` before updating the database.

## Role Rules

- Mechanics can accept only `pending` requests.
- Assigned mechanics can move their own request through the next lifecycle state.
- Drivers can cancel their own request from allowed active states.
- Assigned mechanics can cancel their assigned request from allowed active states.
- Admins can perform lifecycle transitions for monitoring and recovery.

## Status Update API

```json
{
  "requestId": "uuid",
  "newStatus": "en_route"
}
```

Cancellation:

```json
{
  "requestId": "uuid",
  "newStatus": "cancelled",
  "cancellationReason": "Driver no longer needs assistance"
}
```

Completion:

```json
{
  "requestId": "uuid",
  "newStatus": "completed",
  "completionNotes": "Replaced battery terminals",
  "performedServices": ["Battery jump"]
}
```

## Notifications

Successful transitions notify affected users:

- `accepted`: driver receives mechanic accepted notification
- `en_route`: driver receives mechanic en route notification
- `arrived`: driver receives mechanic arrived notification
- `completed`: driver receives job completed notification
- `cancelled`: driver and/or mechanic receive cancellation notification
