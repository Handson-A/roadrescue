# RoadRescue Realtime Event Flow

## Overview

RoadRescue uses Supabase Realtime for live updates via WebSocket subscriptions. This document describes real-time event flows for request status, mechanic location, and notifications.

---

## Event Types by Role

### Driver Events
1. **rescue_requests:UPDATE** - Request status changed by mechanic
2. **notifications:INSERT** - New notification (mechanic accepted, completed, etc.)

### Mechanic Events
1. **rescue_requests:UPDATE** - Their request status changed
2. **notifications:INSERT** - Request acceptance, status updates
3. **mechanic_profiles:UPDATE** - Profile changes

### Admin Events
1. **mechanic_profiles:INSERT** - New mechanic registration (verification_status = pending)
2. **profiles:INSERT** - New user registration
3. **rescue_requests:UPDATE** - Status changes needing oversight
4. **notifications:INSERT** - System alerts

---

## Real-time Flow

```
User Action → Database Update → Realtime Broadcast → Subscribed Clients Update UI
```

---

## Implementation Examples

### Example 1: Driver Creates Request

**Frontend (Driver)**
```javascript
// 1. Create request
const createRequest = async (data) => {
  const { data: request, error } = await supabase
    .from('rescue_requests')
    .insert([{
      driver_id: user.id,
      status: 'pending',
      ...data
    }])
    .select()
    .single()
  
  return request
}

// 2. Subscribe to request status updates
useEffect(() => {
  const subscription = supabase
    .channel(`request:${requestId}:status`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'rescue_requests',
        filter: `id=eq.${requestId}`
      },
      (payload) => {
        // Request status changed - update UI
        setRequestStatus(payload.new.status)
        showNotification(`Status updated: ${payload.new.status}`)
      }
    )
    .subscribe()

  return () => subscription.unsubscribe()
}, [requestId])
```

### Example 2: Admin Approves Mechanic

**Frontend (Admin)**
```javascript
const approveMechanic = async (mechanicId) => {
  const { data } = await supabase
    .from('mechanic_profiles')
    .update({ verification_status: 'approved' })
    .eq('id', mechanicId)
    .select()

  return data
}
```

**Mechanic receives real-time update:**
```javascript
useEffect(() => {
  const subscription = supabase
    .channel(`mechanic:${user.id}:profile`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'mechanic_profiles',
        filter: `user_id=eq.${user.id}`
      },
      (payload) => {
        if (payload.new.verification_status === 'approved') {
          setIsApproved(true)
        }
      }
    )
    .subscribe()
}, [user.id])
```

### Example 3: Live Location Tracking

**Frontend (Mechanic - Updates Location)**
```javascript
// Update location during active job via PATCH /api/mechanic/location
// Location stored in mechanic_profiles.current_location (PostGIS geography)
```

**Frontend (Driver - Listens for Location)**
```javascript
useEffect(() => {
  if (!assignedMechanic) return

  const subscription = supabase
    .channel(`location:${assignedMechanic.id}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'mechanic_profiles',
        filter: `user_id=eq.${assignedMechanic.user_id}`
      },
      (payload) => {
        // Update mechanic marker on map
        updateMechanicLocation({
          lat: payload.new.current_latitude,
          lng: payload.new.current_longitude
        })
      }
    )
    .subscribe()

  return () => subscription.unsubscribe()
}, [assignedMechanic])
```

### Example 4: Request Status Transitions

**All Subscribers Track Status Changes**
```javascript
useEffect(() => {
  const subscription = supabase
    .channel(`request:${requestId}:status`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'rescue_requests',
        filter: `id=eq.${requestId}`
      },
      (payload) => {
        const { status } = payload.new

        switch (status) {
          case 'accepted':
            showNotification('Mechanic accepted your request')
            break
          case 'en_route':
            showNotification('Your mechanic is on the way')
            break
          case 'completed':
            showNotification('Service completed!')
            showRatingModal()
            break
          case 'cancelled':
            showNotification('Request was cancelled')
            break
        }
      }
    )
    .subscribe()

  return () => subscription.unsubscribe()
}, [requestId])
```

---

## Mechanic Real-time Flow

### 1. Listen for Assigned Requests
```javascript
// Subscribe to requests assigned to this mechanic
useEffect(() => {
  const subscription = supabase
    .channel(`mechanic:${user.id}:requests`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'rescue_requests',
        filter: `mechanic_id=eq.${user.id}`
      },
      (payload) => {
        setRequestData(payload.new)
        // Show status change notification
      }
    )
    .subscribe()

  return () => subscription.unsubscribe()
}, [user.id])
```

---

## Subscription Patterns

### Channel Naming Conventions
```
request:{requestId}:status     - Status updates
location:{mechanicId}          - Mechanic location
user:{userId}:notifications    - Personal notifications
admin:system                  - All admin events
```

### Best Practices
1. **Cleanup**: Always unsubscribe to avoid memory leaks
   ```javascript
   useEffect(() => {
     const sub = supabase.channel('...').on(...).subscribe()
     return () => sub.unsubscribe()
   }, [])
   ```

2. **Filter at Database**: Use filter clause to reduce payload
   ```javascript
   filter: `user_id=eq.${userId}` // Filtered at DB level
   ```

---

## Security Notes

- RLS policies enforced on realtime updates
- Users can only subscribe to data they have access to via RLS
- SSL/TLS encryption for WebSocket connections