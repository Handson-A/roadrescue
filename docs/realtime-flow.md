# RoadRescue Realtime Event Flow

## Overview

RoadRescue uses Supabase Realtime for live updates. This document describes real-time event flows and subscription patterns.

## Event Types

### Driver Events
1. **request_created**: Driver submits new rescue request
2. **bid_received**: Mechanic bids on driver's request
3. **mechanic_assigned**: Request assigned to mechanic
4. **mechanic_en_route**: Mechanic accepted and heading to location
5. **mechanic_arrived**: Mechanic at rescue location
6. **completion_received**: Mechanic marked job as complete
7. **request_cancelled**: Request cancelled

### Mechanic Events
1. **new_request_nearby**: New rescue request in service area
2. **bid_accepted**: Their bid was accepted
3. **bid_rejected**: Their bid was rejected
4. **request_details**: Full details of assigned request
5. **driver_location_update**: Real-time location of driver (active job)
6. **job_cancelled**: Assigned job was cancelled

### Admin Events
1. **verification_request_pending**: New mechanic needs verification
2. **fraud_alert**: Suspicious activity detected
3. **system_alert**: System metrics alert

---

## Real-time Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  Supabase Realtime (PostgreSQL Subscriptions via WebSocket) │
└────────────┬────────────────────────────────────────────────┘
             │
    ┌────────┴────────┬────────────┬────────────┐
    │                 │            │            │
    ▼                 ▼            ▼            ▼
┌──────────┐    ┌────────┐   ┌─────────┐  ┌─────────┐
│ Driver   │    │Mechanic│   │  Admin  │  │ Others  │
│ Subscript│    │Subscribe   │Subscribe   │Subscribe│
└────┬─────┘    └────┬───┘   └────┬────┘  └────┬────┘
     │               │            │            │
     ▼               ▼            ▼            ▼
  Receives      Receives       Receives    Broadcast
  Driver       Mechanic       Admin       Notifications
  Updates      Updates        Updates     (Firebase)
```

---

## Implementation Example: Driver's Active Request

### 1. Driver Creates Request

```javascript
// Driver submits rescue request
const createRequest = async (data) => {
  const { data: request } = await supabase
    .from('rescue_requests')
    .insert([data])
    .select();
  
  return request;
};
```

### 2. Listen for Mechanics Bidding

```javascript
// Subscribe to bids on this request
useEffect(() => {
  const subscription = supabase
    .channel(`bids:${requestId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'request_bids',
        filter: `request_id=eq.${requestId}`
      },
      (payload) => {
        // New bid received
        onBidReceived(payload.new);
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}, [requestId]);
```

### 3. Driver Accepts Bid

```javascript
// Accept mechanic's bid
const acceptBid = async (bidId, mechanicId) => {
  // Update request status
  await supabase
    .from('rescue_requests')
    .update({ 
      status: 'ASSIGNED', 
      assigned_mechanic_id: mechanicId,
      assigned_at: new Date().toISOString()
    })
    .eq('id', requestId);

  // Update bid status
  await supabase
    .from('request_bids')
    .update({ bid_status: 'accepted' })
    .eq('id', bidId);
};
```

### 4. Listen for Live Location Updates

```javascript
// Subscribe to mechanic location updates
useEffect(() => {
  const subscription = supabase
    .channel(`location:${mechanicId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'mechanic_profiles',
        filter: `id=eq.${mechanicId}`
      },
      (payload) => {
        // Update map with new location
        updateMechanicLocation(payload.new);
      }
    )
    .subscribe();

  return () => subdivision.unsubscribe();
}, [mechanicId]);
```

### 5. Listen for Request Status Changes

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
