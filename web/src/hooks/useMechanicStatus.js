'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const ALLOWED_STATUSES = new Set(['available', 'offline'])

function normalizeStatus(value) {
  if (value === 'available') return 'available'
  return 'offline'
}


export function useMechanicStatus(mechanicId) {
  const supabaseRef = useRef(null)
  const channelRef = useRef(null)

  const [status, setStatus] = useState('offline')
  const [loading, setLoading] = useState(!!mechanicId)

  useEffect(() => {
    if (!mechanicId) {
      // Leave initial state as-is (status='offline', loading=false by default from useState)
      return
    }



    const supabase = createClient()
    supabaseRef.current = supabase

    let cancelled = false

    async function loadInitial() {
      setLoading(true)
      const { data, error } = await supabase
        .from('mechanic_profiles')
        .select('is_available')
        .eq('user_id', mechanicId)
        .maybeSingle()

      if (cancelled) return

      if (error) {
        console.error('[useMechanicStatus] initial load failed:', error.message)
        setStatus('offline')
      } else {
        // New schema: availability is boolean is_available (no current_status enum)
        setStatus(data?.is_available ? 'available' : 'offline')
      }
      setLoading(false)
    }

    loadInitial()

    // realtime subscription: keep a single source of truth in sync
    const channel = supabase.channel(`mechanic-status-${mechanicId}`)
    channelRef.current = channel

    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mechanic_profiles',
          filter: `user_id=eq.${mechanicId}`,
        },
        (payload) => {
          // New schema: availability is boolean `is_available`
          const next = payload?.new?.is_available ? 'available' : 'offline'
          setStatus(next)
        }
      )
      .subscribe()

    return () => {
      cancelled = true
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [mechanicId])

  const isAvailable = useMemo(() => status === 'available', [status])
  const isBusy = useMemo(() => status === 'busy', [status])
  const [localCoords, setLocalCoords] = useState(null)

  useEffect(() => {
    if (!isAvailable || !mechanicId) {
      Promise.resolve().then(() => {
        setLocalCoords(null)
      })
      return
    }

    if (!navigator.geolocation) return

    const supabase = supabaseRef.current || createClient()
    const channel = supabase.channel('online-mechanics')
    channel.subscribe()

    let lastDBSync = 0

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        const currentNow = { lat: latitude, lng: longitude }
        setLocalCoords(currentNow)

        // 1. Broadcast coordinates to 'online-mechanics' channel
        channel.send({
          type: 'broadcast',
          event: 'location_update',
          payload: {
            mechanicId,
            latitude,
            longitude,
            timestamp: Date.now()
          }
        })

        // 2. Persist to DB (throttle 30s)
        const timeNow = Date.now()
        if (timeNow - lastDBSync > 30000) {
          lastDBSync = timeNow
          await supabase
            .from('mechanic_profiles')
            .update({
              current_location: `POINT(${longitude} ${latitude})`,
              location_updated_at: new Date().toISOString()
            })
            .eq('user_id', mechanicId)
        }
      },
      (error) => console.warn('[useMechanicStatus GPS FAULT]:', error.message),
      { enableHighAccuracy: true, maximumAge: 10000 }
    )

    return () => {
      navigator.geolocation.clearWatch(watchId)
      supabase.removeChannel(channel)
    }
  }, [isAvailable, mechanicId])

  const updateStatus = useCallback(
    async (nextStatus) => {
      if (!mechanicId) return
      const normalized = normalizeStatus(nextStatus)

      const supabase = supabaseRef.current || createClient()

      // New schema: mechanic availability is boolean `is_available`
      const is_available = normalized === 'available'

      const { error } = await supabase
        .from('mechanic_profiles')
        .update({ is_available })
        .eq('user_id', mechanicId)

      if (error) {
        console.error('[useMechanicStatus] update failed:', error.message)
        throw error
      }

      // reflect DB result quickly; realtime subscription is the ultimate source
      setStatus(normalized)
    },
    [mechanicId]
  )

  return {
    status,
    isAvailable,
    isBusy,
    loading,
    localCoords,
    updateStatus,
  }
}

