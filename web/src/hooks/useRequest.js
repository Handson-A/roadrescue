import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useRequestStatus(requestId) {
  const [request, setRequest] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!requestId) return

    const supabase = createClient()

    async function fetchRequest() {
      const { data, error } = await supabase
        .from('rescue_requests')
        .select(`
          *,
          mechanic:mechanic_id (
            id,
            full_name,
            phone,
            avatar_url,
            mechanic_profiles (
              rating_avg,
              specializations,
              business_name,
              location_label,
              service_mode,
              current_location
            )
          )
        `)
        .eq('id', requestId)
        .single()

      if (!error) setRequest(data)
      setLoading(false)
    }

    fetchRequest()

    const channel = supabase
      .channel(`request-status-${requestId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rescue_requests',
          filter: `id=eq.${requestId}`,
        },
        (payload) => {
          // Trigger a full fetch to resolve nested relationships in real-time
          fetchRequest()
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [requestId])

  return { request, loading }
}
