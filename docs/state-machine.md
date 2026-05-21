# RoadRescue - Request State Machine

## Rescue Request Lifecycle

The rescue request follows a defined state machine with specific transitions.

## States

### 1. PENDING
**Initial state when driver submits request**

- Driver has submitted rescue request
- Location, vehicle details, and issue description provided
- Waiting for mechanic bids or assignment
- Visible to mechanics in service area

**Transitions:**
- → ASSIGNED (mechanic assigned or bid accepted)
- → CANCELLED (driver cancels, system timeout after 1 hour)

---

### 2. ASSIGNED
**Mechanic has been selected (bid accepted or direct assignment)**

- Mechanic has accepted bid or admin assigned manually
- Mechanic status changes to 'on_job'
- Driver can see assigned mechanic details
- Real-time location tracking enabled

**Stored Data:**
- `assigned_mechanic_id`: UUID of the assigned mechanic
- `assigned_at`: Timestamp of assignment
- Accepted `request_bid` record updated

**Transitions:**
- → IN_PROGRESS (mechanic confirms arrival at location)
- → ASSIGNED_EXPIRED (mechanic doesn't show up after 30 min)
- → CANCELLED (either party cancels)

---

### 3. IN_PROGRESS
**Mechanic has arrived and is performing service**

- Mechanic confirmed arrival at rescue location
- Service in progress
- Real-time location still tracked
- Support can contact both parties

**Stored Data:**
- `started_at`: Timestamp of service start
- Last mechanic location update
- Driver and mechanic can update request status

**Transitions:**
- → COMPLETED (mechanic marks as complete)
- → CANCELLED (either party cancels, major issue)

---

### 4. COMPLETED
**Service finished successfully**

- Mechanic has completed the service
- Both driver and mechanic can rate each other
- Payment processed (future)
- Request moved to history

**Stored Data:**
- `completed_at`: Timestamp of completion
- `completion_notes`: Service summary from mechanic
- `driver_rating`: 1-5 stars from driver
- `mechanic_rating`: 1-5 stars from mechanic
- Final mechanic location
- Service duration calculated

**Transitions:**
- → NONE (final state - goes to history)

---

### 5. CANCELLED
**Request was cancelled before completion**

**Reasons for cancellation:**
- Driver cancels (before mechanic accepts or arrives)
- Driver cancels (after timeout)
- Mechanic cancels (after accepting)
- System cancels (mechanic didn't arrive after 30 min)
- System cancels (multiple failed connection attempts)

**Stored Data:**
- `cancelled_at`: Timestamp of cancellation
- `cancellation_reason`: Enum reason (future field)
- `cancelled_by`: User ID who cancelled (future field)

**Transitions:**
- → NONE (final state - goes to history)
- → PENDING (driver can resubmit new request)

---

## State Transition Diagram

```
                    ┌─────────────┐
                    │  PENDING    │
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           │          (bid accepted)       │ (cancellation)
           │               │               │
           ▼               ▼               ▼
        (1h timeout)  ┌──────────┐   ┌──────────┐
        (cancellation)│ ASSIGNED │   │CANCELLED │
                      └────┬─────┘   └──────────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           │          (arrival)      (cancellation)
           │               │               │
           ▼               ▼               ▼
    ┌────────────┐   ┌─────────────┐   ┌──────────┐
    │IN_PROGRESS │   │  CANCELLED  │   │CANCELLED │
    └────┬───────┘   └─────────────┘   └──────────┘
         │
         │ (service complete)
         ▼
    ┌──────────┐
    │COMPLETED │
    └──────────┘
```

---

## State Transition Rules

### PENDING → ASSIGNED
```javascript
// Trigger: Mechanic bid accepted OR admin assignment
if (bidAccepted || adminAssignment) {
  rescueRequest.status = 'ASSIGNED';
  rescueRequest.assigned_mechanic_id = mechanicId;
  rescueRequest.assigned_at = now();
  
  // Notify driver
  createNotification(driverId, 'mechanic_assigned');
}
```

### PENDING → CANCELLED
```javascript
// Trigger 1: Driver cancellation
if (driver.cancels()) {
  rescueRequest.status = 'CANCELLED';
  rescueRequest.cancelled_at = now();
}

// Trigger 2: Auto-cancel after 1 hour
if (timeElapsed >= 60 minutes && status === 'PENDING') {
  rescueRequest.status = 'CANCELLED';
  createNotification(driverId, 'request_auto_cancelled');
}
```

### ASSIGNED → IN_PROGRESS
```javascript
// Trigger: Mechanic confirms arrival at location
if (mechanic.confirmsArrival()) {
  rescueRequest.status = 'IN_PROGRESS';
  rescueRequest.started_at = now();
  
  createNotification(driverId, 'mechanic_arrived');
}

// Alternative: Auto-confirm after 5 minutes of location proximity
if (distanceToLocation < 50m && timeNear >= 5 min) {
  rescueRequest.status = 'IN_PROGRESS';
}
```

### IN_PROGRESS → COMPLETED
```javascript
// Trigger: Mechanic marks as complete
if (mechanic.marksComplete(completionNotes)) {
  rescueRequest.status = 'COMPLETED';
  rescueRequest.completed_at = now();
  rescueRequest.completion_notes = completionNotes;
  
  createNotification(driverId, 'job_completed');
}
```

### ASSIGNED → CANCELLED
```javascript
// Trigger 1: Mechanic no-show after 30 minutes
if (timeSinceAssignment >= 30 min && distance > 100m) {
  rescueRequest.status = 'CANCELLED';
  redirectToPendingForNewBids();
}

// Trigger 2: Either party cancels
if (mechanic.cancels() || driver.cancels()) {
  rescueRequest.status = 'CANCELLED';
  rescueRequest.cancelled_at = now();
}
```

---

## Timeout Configuration

| Timeout                      | Duration | Action                          |
|------------------------------|----------|---------------------------------|
| No bids received             | 60 min   | Auto-cancel, offer system search|
| Mechanic assigned, no arrival| 30 min   | Auto-reopen for bids            |
| Service in progress          | 6 hours  | Alert admin (possible stuck job)|
| Session inactive             | 30 min   | Trigger disconnect handling     |

---

## Data Available Per State

| State | Driver Info | Mechanic Info | Bids | Location |
|-------|------------|---------------|------|----------|
| PENDING | • issue | • nearby list | ✓ | • driver |
| ASSIGNED | • assigned mechanic | • driver request | - | • both real-time |
| IN_PROGRESS | • mechanic location | • driver location | - | • both real-time |
| COMPLETED | • completion notes, rating | • driver rating, payment | - | • final location |
| CANCELLED | • reason | • reason | - | • final location |

---

## State Machine Validation

```javascript
// Helper function to validate transitions
const isValidTransition = (currentState, newState) => {
  const validTransitions = {
    'PENDING': ['ASSIGNED', 'CANCELLED'],
    'ASSIGNED': ['IN_PROGRESS', 'CANCELLED'],
    'IN_PROGRESS': ['COMPLETED', 'CANCELLED'],
    'COMPLETED': [], // Final state
    'CANCELLED': []  // Final state
  };

  return validTransitions[currentState]?.includes(newState) || false;
};
```

---

## Error States & Recovery

### Stuck in PENDING
- Mechanic search radius too small → Increase radius
- No mechanics online → Notify driver, suggest different time
- System error → Retry mechanism, eventual manual admin handling

### Stuck in ASSIGNED
- Mechanic lost connection → Auto-timeout after 30 min
- Mechanic offline → Reassign to next bidder
- GPS error → Manual driver location confirmation

### Stuck in IN_PROGRESS
- Mechanic can't complete → Allow cancellation and re-request
- Payment processing hang → Manual admin review
- Driver unreachable → System alert to admin after timeout

---

## Analytics & Metrics

Track per-request timing:
- Time in PENDING (waiting for bid)
- Time to assign mechanic
- Time to arrival (PENDING → IN_PROGRESS)
- Time to completion (ASSIGNED → COMPLETED)
- Cancellation rate per state

---

## Future Enhancements

1. **PAUSED State**: For mechanic breaks or customer requests
2. **DISPUTE State**: For resolution of issues
3. **RESCHEDULED State**: Automatic rescheduling on cancellation
4. **Sub-states**: More granular status tracking (ASSIGNED_TRAVELING, etc.)
