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
    updateStatus,
  }
}

