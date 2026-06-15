// web/src/hooks/useMechanicPresence.js
// Tracks whether a mechanic is actively online on the platform.
// Uses Supabase Presence — a shared state channel where
// each connected client declares itself and everyone sees who's there.
//
// When mechanic closes the tab or loses connection,
// Supabase automatically removes them from presence state.
// We use this to update is_available in the DB on leave.

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useMechanicPresence(mechanicId) {
  const channelRef = useRef(null)

  useEffect(() => {
    if (!mechanicId) return

    const supabase = createClient()
    const channel = supabase.channel('mechanic-presence', {
      config: { presence: { key: mechanicId } }
    })

    channel
      .on('presence', { event: 'join' }, () => {
      })
      .on('presence', { event: 'leave' }, async ({ key }) => {        // mechanic disconnected — mark them unavailable in DB
        if (key === mechanicId) {
          await supabase
            .from('mechanic_profiles')
            .update({ is_available: false })
            .eq('user_id', mechanicId)
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // declare this mechanic as present
          await channel.track({ mechanicId, online_at: new Date().toISOString() })

          // mark available in DB when they connect
          await supabase
            .from('mechanic_profiles')
            .update({ is_available: true })
            .eq('user_id', mechanicId)
        }
      })

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [mechanicId])
}