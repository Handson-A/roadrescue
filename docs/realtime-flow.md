# RoadRescue Realtime Event Flow

## Overview

RoadRescue uses Supabase Realtime for live updates via WebSocket subscriptions. This document describes real-time event flows and subscription patterns used throughout the application.

## Architecture

```
PostgreSQL Database Changes
        ↓
Supabase Realtime (WebSocket)
        ↓
    ┌───┴───┬────────┬────────┐
    ↓       ↓        ↓        ↓
 Driver  Mechanic  Admin   Other
 Subs    Subs      Subs     Subs
```

## Event Types by Role

### Driver Events
1. **rescue_requests:INSERT** - New request created by driver (status = PENDING)
2. **request_bids:INSERT** - Mechanic placed bid on driver's request
3. **rescue_requests:UPDATE** - Request assigned to mechanic
4. **rescue_requests:UPDATE** - Mechanic status changed (en route, arrived, completed)
5. **notifications:INSERT** - New notification (bid received, assigned, completed)
6. **request_bids:UPDATE** - Bid accepted/rejected by driver

### Mechanic Events
1. **rescue_requests:INSERT** - New request in service area (via channel filter)
2. **rescue_requests:UPDATE** - Their bid was accepted (assigned_mechanic_id matches user_id)
3. **rescue_requests:UPDATE** - Status transitions (ASSIGNED → IN_PROGRESS → COMPLETED)
4. **notifications:INSERT** - Bid accepted/rejected notification
5. **mechanic_profiles:UPDATE** - Profile or location changes

### Admin Events
1. **mechanic_profiles:INSERT** - New mechanic registration (verification_status = pending)
2. **profiles:INSERT** - New user registration
3. **rescue_requests:UPDATE** - Status changes needing oversight
4. **notifications:INSERT** - System alerts, including mechanic approval/rejection outcomes

## Real-time Flow Diagram

```
User Action → Database Update → Realtime Broadcast → Subscribed Clients Update UI
      ↓                              ↓                      ↓
Driver places               Row triggers fire          Driver sees pending
  bid                     Supabase notifies          bids in real-time
                         subscribed clients
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
      status: 'PENDING',
      ...data
    }])
    .select()
    .single()
  
  return request
}

// 2. Subscribe to bids on this request
useEffect(() => {
  const subscription = supabase
    .channel(`request:${requestId}:bids`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'request_bids',
        filter: `request_id=eq.${requestId}`
      },
      (payload) => {
        // New bid received - update UI
        setBids(prev => [...prev, payload.new])
        toast.success('New bid from ' + payload.new.mechanic_name)
      }
    )
    .subscribe()

  return () => subscription.unsubscribe()
}, [requestId])
```

**Database**
```sql
-- Request inserted
INSERT INTO rescue_requests (id, driver_id, status, ...)
VALUES (uuid, driver_uuid, 'PENDING', ...);

-- Trigger fires → Broadcasts via Supabase Realtime
-- All subscribed mechanics get notification if in service area
```

**Frontend (Mechanic)**
```javascript
// Mechanic subscribed to nearby requests
useEffect(() => {
  const subscription = supabase
    .channel('nearby-requests')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'rescue_requests',
        filter: `status=eq.PENDING`
      },
      (payload) => {
        // Check if request is in mechanic's service area
        if (isNearby(payload.new.latitude, payload.new.longitude)) {
          addToAvailableRequests(payload.new)
          // Ring alert sound, show notification
        }
      }
    )
    .subscribe()

  return () => subscription.unsubscribe()
}, [])
```

### Example 2: Mechanic Places Bid

**Frontend (Mechanic)**
```javascript
const placeBid = async (requestId, price, eta) => {
  const { data: bid } = await supabase
    .from('request_bids')
    .insert([{
      request_id: requestId,
      mechanic_id: user.id,
      proposed_price: price,
      estimated_arrival_time: eta,
      bid_status: 'pending'
    }])
    .select()
    .single()

  return bid
}
```

**Database → Realtime**
```sql
-- Bid inserted
INSERT INTO request_bids (...) VALUES (...);

-- Trigger fires - notification created
-- Supabase broadcasts INSERT event to subscribed drivers
```

**Frontend (Driver)**
```javascript
// Driver hears about bid in near real-time
const onBidReceived = (bid) => {
  // Update bid list, show notification, play sound
  setBids(prev => [...prev, bid])
  toast.info(`Bid from ${bid.mechanic_name}: ₵${bid.proposed_price}`)
}
```

### Example 3: Driver Accepts Bid

**Frontend (Driver)**
```javascript
const acceptBid = async (bidId, mechanicId) => {
  const { data } = await supabase
    .from('rescue_requests')
    .update({
      assigned_mechanic_id: mechanicId,
      status: 'ASSIGNED',
      assigned_at: new Date().toISOString()
    })
    .eq('id', requestId)
    .select()

  // Update bid status
  await supabase
    .from('request_bids')
    .update({ bid_status: 'accepted' })
    .eq('id', bidId)
}
```

### Example 4: Admin Approves Mechanic

**Frontend (Admin)**
```javascript
const approveMechanic = async (mechanicId) => {
  const { data } = await supabase
    .from('mechanic_profiles')
    .update({ verification_status: 'verified' })
    .eq('id', mechanicId)
    .select()

  return data
}
```

**Database → Realtime**
```sql
-- Mechanic profile updated
UPDATE mechanic_profiles
SET verification_status = 'verified'
WHERE id = mechanic_uuid;

-- Trigger inserts an in-app notification
-- Mechanics see the update in realtime and can activate their profile
```

**Frontend (Mechanic)**
```javascript
// Mechanic receives notification immediately
// "Your RoadRescue professional profile has been verified..."
```

**Database → Realtime**
```
UPDATE rescue_requests SET assigned_mechanic_id = mechanic_uuid, status = 'ASSIGNED'
↓
Supabase broadcasts UPDATE event
↓
All subscribed clients (driver, mechanic, admins) get notified
```

**Frontend (Mechanic)**
```javascript
// Mechanic receives real-time notification of assignment
useEffect(() => {
  const subscription = supabase
    .channel(`mechanic:${user.id}:assigned`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'rescue_requests',
        filter: `assigned_mechanic_id=eq.${user.id}`
      },
      (payload) => {
        // They've been assigned a job!
        setAssignedRequest(payload.new)
        showAcceptedAlert()
        // Start navigation to location
      }
    )
    .subscribe()
}, [user.id])
```

### Example 4: Live Location Tracking

**Frontend (Mechanic - Updates Location)**
```javascript
useEffect(() => {
  // Update location every 10 seconds during active job
  if (activeJob?.status === 'IN_PROGRESS') {
    const interval = setInterval(() => {
      navigator.geolocation.getCurrentPosition((pos) => {
        // Update mechanic's current location
        supabase
          .from('mechanic_profiles')
          .update({
            service_area_lat: pos.coords.latitude,
            service_area_lon: pos.coords.longitude,
            last_location_update: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .then(() => {
            // Location updated and broadcast to driver
          })
      })
    }, 10000)

    return () => clearInterval(interval)
  }
}, [activeJob])
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
        // Update mechanic marker on map with new coordinates
        updateMechanicLocation({
          lat: payload.new.service_area_lat,
          lon: payload.new.service_area_lon
        })
      }
    )
    .subscribe()

  return () => subscription.unsubscribe()
}, [assignedMechanic])
```

### Example 5: Request Status Transitions

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
        const { status, started_at, completed_at } = payload.new

        switch (status) {
          case 'ASSIGNED':
            showNotification('Mechanic accepted your request')
            break
          case 'IN_PROGRESS':
            showNotification('Service has started')
            startTimer()
            break
          case 'COMPLETED':
            showNotification('Service completed!')
            showRatingModal()
            break
          case 'CANCELLED':
            showNotification('Request was cancelled')
            break
        }
      }
    )
    .subscribe()

  return () => subscription.unsubscribe()
}, [requestId])
```

## Subscription Patterns

### Channel Naming Conventions
```
request:{requestId}:bids       - All bids on a request
request:{requestId}:status     - Status updates
location:{mechanicId}          - Mechanic location
mechanic:{mechanicId}:assigned - Assignment notifications
nearby-requests                - All new pending requests
user:{userId}:notifications    - Personal notifications
admin:system                    - All admin events
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

3. **Presence**: Track online users (future enhancement)
   ```javascript
   // Show driver if mechanic is online
   const presence = supabase.channel('presence').track()
   ```

4. **Broadcast**: For immediate updates without DB change
   ```javascript
   // Real-time chat (not stored in DB)
   supabase.channel('chat').send('broadcast', { message: '...' })
   ```

## Performance Considerations

- Each subscription maintains WebSocket connection
- Multiple subscriptions reuse single connection
- Unsubscribe unused channels to reduce memory
- Limit subscription filters to essential data
- Use batch updates for multiple records

```javascript
// Subscribe to request status changes
useEffect(() => {
  const subscription = supabase
    .channel(`requests:${requestId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'rescue_requests',
        filter: `id=eq.${requestId}`
      },
      (payload) => {
        setRequestStatus(payload.new.status);
      }
    )
    .subscribe();

  return () => subscription.unsubscribe();
}, [requestId]);
```

---

## Mechanic Real-time Flow

### 1. Listen for New Nearby Requests

```javascript
// Subscribe to new requests in service area
useEffect(() => {
  const subscription = supabase
    .channel('new_requests')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'rescue_requests',
        filter: 'status=eq.PENDING'
      },
      async (payload) => {
        const distance = calculateDistance(
          payload.new.latitude,
          payload.new.longitude,
          mechanicLat,
          mechanicLon
        );

        if (distance <= SERVICE_RADIUS_KM) {
          onNewRequestNearby(payload.new);
        }
      }
    )
    .subscribe();

  return () => subscription.unsubscribe();
}, []);
```

### 2. Place Bid

```javascript
const placeBid = async (requestId, price, eta) => {
  const { data } = await supabase
    .from('request_bids')
    .insert([{
      request_id: requestId,
      mechanic_id: currentMechanicId,
      proposed_price: price,
      estimated_arrival_time: eta
    }])
    .select();

  return data;
};
```

### 3. Listen for Bid Accept/Reject

```javascript
// Subscribe to bid status changes
useEffect(() => {
  const subscription = supabase
    .channel(`my_bids:${mechanicId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'request_bids',
        filter: `mechanic_id=eq.${mechanicId}`
      },
      (payload) => {
        if (payload.new.bid_status === 'accepted') {
          onBidAccepted(payload.new);
          // Navigate to active job
        } else if (payload.new.bid_status === 'rejected') {
          onBidRejected(payload.new);
        }
      }
    )
    .subscribe();

  return () => subscription.unsubscribe();
}, [mechanicId]);
```

### 4. Broadcast Location Updates

```javascript
// Send location updates while en route
useEffect(() => {
  if (status !== 'ASSIGNED') return;

  const interval = setInterval(async () => {
    const location = await getCurrentLocation();
    
    await supabase
      .from('mechanic_profiles')
      .update({
        service_area_lat: location.latitude,
        service_area_lon: location.longitude
      })
      .eq('id', mechanicId);

    // This UPDATE triggers all subscribed drivers' listeners
  }, 10000); // Every 10 seconds

  return () => clearInterval(interval);
}, [status]);
```

---

## Admin Real-time Monitoring

```javascript
// Admin dashboard - monitor all active requests
const subscription = supabase
  .channel('admin_requests')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'rescue_requests'
    },
    (payload) => {
      updateAdminDashboard(payload);
    }
  )
  .subscribe();
```

---

## Performance Considerations

1. **Channel Names**: Be specific to reduce broadcast load
2. **Filters**: Use `filter` clause to reduce messages
3. **Subscriptions**: Unsubscribe when component unmounts
4. **Throttling**: Limit location updates to reasonable intervals
5. **Message Size**: Keep payloads small
6. **Concurrent Subs**: Max ~10-20 active subscriptions per client

---

## Handling Connection Issues

```javascript
// Detect connection state
const handleRealtimeStatus = (status) => {
  if (status === 'SUBSCRIBED') {
    console.log('Connected to realtime');
    setIsOnline(true);
  } else if (status === 'CLOSED') {
    console.log('Disconnected from realtime');
    setIsOnline(false);
  }
};

// Implement retry logic and offline queue (future)
```

---

## Security Notes

- RLS policies still apply to realtime updates
- Users can only subscribe to data they have access to
- Admin subscriptions need elevated permissions
- SSL/TLS encryption for WebSocket connections
