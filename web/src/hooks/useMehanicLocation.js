// web/src/hooks/useMechanicLocation.js
// Two responsibilities:
// 1. Mechanic side  → broadcasts their GPS position every 15 seconds
// 2. Driver side    → receives mechanic location updates live
//
// We use Supabase Broadcast channel for this, NOT postgres_changes.
// Reason: location updates are high-frequency and ephemeral.
// We don't need every location ping stored in the DB permanently.
// We DO update mechanic_profiles.current_location in DB every 60s
// for the geospatial matching function to stay accurate.

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// --- MECHANIC SIDE ---
// Call this when a mechanic has an active job
// requestId scopes the broadcast to this specific rescue only
export function useBroadcastLocation(requestId, mechanicId) {
  const supabase = createClient()
  const intervalRef = useRef(null)
  const dbSyncCountRef = useRef(0)

  useEffect(() => {
    if (!requestId || !mechanicId) return

    const channel = supabase.channel(`location-${requestId}`)
    channel.subscribe()

    async function broadcastPosition() {
      // get current GPS from browser
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords

        // broadcast to driver via realtime channel (ephemeral, fast)
        channel.send({
          type: 'broadcast',
          event: 'location_update',
          payload: { latitude, longitude, mechanicId },
        })

        // every 4 broadcasts (~60 seconds) also update the DB
        // so the geospatial matching function stays accurate
        dbSyncCountRef.current += 1
        if (dbSyncCountRef.current >= 4) {
          dbSyncCountRef.current = 0

          await supabase
            .from('mechanic_profiles')
            .update({
              current_location: `POINT(${longitude} ${latitude})`,
              location_updated_at: new Date().toISOString(),
            })
            .eq('user_id', mechanicId)
        }
      })
    }

    // broadcast every 15 seconds
    intervalRef.current = setInterval(broadcastPosition, 15000)
    broadcastPosition() // fire immediately on mount

    return () => {
      clearInterval(intervalRef.current)
      supabase.removeChannel(channel)
    }
  }, [requestId, mechanicId])
}

// --- DRIVER SIDE ---
// Call this on the active request tracking page
// receives mechanic location updates as they come in
export function useWatchMechanicLocation(requestId) {
  const [mechanicLocation, setMechanicLocation] = useState(null)
  const supabase = createClient()

  useEffect(() => {
    if (!requestId) return

    const channel = supabase
      .channel(`location-${requestId}`)
      .on('broadcast', { event: 'location_update' }, (payload) => {
        setMechanicLocation({
          latitude: payload.payload.latitude,
          longitude: payload.payload.longitude,
        })
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [requestId])

  return { mechanicLocation }
}