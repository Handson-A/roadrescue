'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useMechanicVerificationAccess(mechanicId) {
  const [verificationStatus, setVerificationStatus] = useState('pending')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true

    async function load() {
      if (!mechanicId) {
        if (!mounted) return
        setVerificationStatus('pending')
        setLoading(false)
        return
      }

      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('mechanic_profiles')
          .select('verification_status')
          .eq('user_id', mechanicId)
          .maybeSingle()

        if (!mounted) return

        if (error) throw error

        setVerificationStatus(data?.verification_status || 'pending')
        setError(null)
      } catch (e) {
        if (!mounted) return
        setVerificationStatus('pending')
        setError(e)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()

    return () => {
      mounted = false
    }
  }, [mechanicId])

  const isApproved = useMemo(() => verificationStatus === 'approved', [verificationStatus])
  const isRejected = useMemo(() => verificationStatus === 'rejected', [verificationStatus])
  const isPendingOrMoreInfo = useMemo(() => !isApproved && !isRejected, [isApproved, isRejected])

  return {
    verificationStatus,
    isApproved,
    isRejected,
    isPendingOrMoreInfo,
    loading,
    error,
  }
}

