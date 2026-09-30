'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * useMechanicVerificationAccess
 * 
 * Provides real-time mechanic verification access status, rejection reason,
 * and account moderation suspension flags.
 */
export function useMechanicVerificationAccess(mechanicId) {
  const [verificationStatus, setVerificationStatus] = useState('pending')
  const [rejectionReason, setRejectionReason] = useState(null)
  const [isSuspended, setIsSuspended] = useState(false)
  const [suspensionReason, setSuspensionReason] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadVerificationData = useCallback(async () => {
    if (!mechanicId) {
      setVerificationStatus('unverified')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const supabase = createClient()

      // 1. Fetch verification status from mechanic_profiles
      const { data: mechProfile, error: mechError } = await supabase
        .from('mechanic_profiles')
        .select('verification_status')
        .eq('user_id', mechanicId)
        .maybeSingle()

      if (mechError) throw mechError

      // 2. Fetch rejection reason if rejected / pending from mechanic_verifications
      const { data: verifyRow } = await supabase
        .from('mechanic_verifications')
        .select('status, rejection_reason')
        .eq('mechanic_id', mechanicId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      // 3. Fetch suspension state from profiles
      const { data: profileRow } = await supabase
        .from('profiles')
        .select('is_suspended, suspension_reason')
        .eq('id', mechanicId)
        .maybeSingle()

      const rawStatus = (mechProfile?.verification_status || verifyRow?.status || 'unverified').toLowerCase()
      setVerificationStatus(rawStatus)
      setRejectionReason(verifyRow?.rejection_reason || null)
      setIsSuspended(Boolean(profileRow?.is_suspended))
      setSuspensionReason(profileRow?.suspension_reason || null)
      setError(null)
    } catch (e) {
      console.warn('[useMechanicVerificationAccess] Load failed:', e?.message || e)
      setError(e)
    } finally {
      setLoading(false)
    }
  }, [mechanicId])

  useEffect(() => {
    loadVerificationData()

    if (!mechanicId) return

    const supabase = createClient()

    // Real-time subscription to update immediately on admin approvals/rejections/suspensions
    const channel = supabase
      .channel(`mechanic-verification-${mechanicId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'mechanic_profiles', filter: `user_id=eq.${mechanicId}` },
        (payload) => {
          if (payload.new?.verification_status) {
            setVerificationStatus(payload.new.verification_status.toLowerCase())
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'mechanic_verifications', filter: `mechanic_id=eq.${mechanicId}` },
        (payload) => {
          if (payload.new?.status) {
            setVerificationStatus(payload.new.status.toLowerCase())
          }
          if (payload.new?.rejection_reason !== undefined) {
            setRejectionReason(payload.new.rejection_reason)
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${mechanicId}` },
        (payload) => {
          if (payload.new?.is_suspended !== undefined) {
            setIsSuspended(Boolean(payload.new.is_suspended))
            setSuspensionReason(payload.new.suspension_reason || null)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [mechanicId, loadVerificationData])

  const isApproved = useMemo(
    () => verificationStatus === 'approved' || verificationStatus === 'verified',
    [verificationStatus]
  )
  const isRejected = useMemo(
    () => verificationStatus === 'rejected',
    [verificationStatus]
  )
  const isPending = useMemo(
    () => verificationStatus === 'pending' || verificationStatus === 'more_info',
    [verificationStatus]
  )
  const isUnverified = useMemo(
    () => !isApproved && !isRejected && !isPending,
    [isApproved, isRejected, isPending]
  )

  return {
    verificationStatus,
    rejectionReason,
    isSuspended,
    suspensionReason,
    isApproved,
    isRejected,
    isPending,
    isUnverified,
    loading,
    error,
    refetch: loadVerificationData,
  }
}
