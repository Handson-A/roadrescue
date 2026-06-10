/**
 * AuthProvider.jsx — ENHANCED VERSION
 * Global authentication provider with Supabase session management
 */

'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from '@/store/authStore'
import { createClient } from '@/lib/supabase/client'

const MAX_RETRIES = 3
const RETRY_DELAY_MS = 1000 // Start with 1s, exponential backoff after

const isRlsStyleError = (error) => {
  const message = `${error?.message || ''} ${error?.details || ''}`.toLowerCase()
  return (
    error?.code === '42501' ||
    error?.code === 'PGRST301' ||
    message.includes('row level security') ||
    message.includes('violates rls policy') ||
    message.includes('permission denied')
  )
}

export default function AuthProvider({ children }) {
  const {
    setAuthState,
    setUser,
    setProfile,
    setLoading,
    setError,
    setNetworkStatus,
    resetAuth,
  } = useAuthStore()

  const retryCountRef = useRef({})
  const subscriptionRef = useRef(null)

  // Fetch user profile from database with retry logic
  const fetchUserProfile = useCallback(async (user) => {
    if (!user?.id) return null

    const userId = user.id
    const fallbackProfile = {
      id: userId,
      email: user.email || null,
      full_name: user.user_metadata?.full_name || null,
      phone: user.user_metadata?.phone || null,
      role: user.user_metadata?.role || null,
    }

    const supabase = createClient()

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle()

        if (error) {
          if (isRlsStyleError(error)) {
            console.warn(
              `Profile fetch blocked by policy for user ${userId}; using auth metadata fallback`,
              error
            )
            setError(null)
            setNetworkStatus('connected')
            return fallbackProfile
          }

          if (error.code === 'PGRST100') {
            console.warn(`Profile not yet created for user ${userId} — will be created by trigger`)
            return null
          }

          if (attempt < MAX_RETRIES) {
            const delay = RETRY_DELAY_MS * Math.pow(2, attempt)
            console.warn(
              `Profile fetch failed (attempt ${attempt + 1}/${MAX_RETRIES}), retrying in ${delay}ms:`,
              error
            )
            await new Promise((resolve) => setTimeout(resolve, delay))
            continue
          }

          console.error(`Profile fetch failed after ${MAX_RETRIES} retries for user ${userId}:`, error)
          setError(`Failed to load profile: ${error.message}`)
          setNetworkStatus('degraded')
          return null
        }

        // Success
        retryCountRef.current[userId] = 0
        setError(null)
        setNetworkStatus('connected')

        if (!profile) return fallbackProfile

        const extendedProfile = { ...fallbackProfile, ...profile }

        if (profile?.role === 'driver') {
          const { data: driverProfile } = await supabase
            .from('driver_profiles')
            .select('vehicle_make, vehicle_model, vehicle_year, vehicle_color, vehicle_plate, emergency_contact_name, emergency_contact_phone, home_area, rating_avg, total_requests')
            .eq('user_id', userId)
            .maybeSingle()

          if (driverProfile) {
            extendedProfile.driver_profile = driverProfile
            extendedProfile.vehicle_make = driverProfile.vehicle_make || null
            extendedProfile.vehicle_model = driverProfile.vehicle_model || null
            extendedProfile.vehicle_year = driverProfile.vehicle_year || null
            extendedProfile.vehicle_color = driverProfile.vehicle_color || null
            extendedProfile.vehicle_plate = driverProfile.vehicle_plate || null
            extendedProfile.emergency_contact_name = driverProfile.emergency_contact_name || null
            extendedProfile.emergency_contact_phone = driverProfile.emergency_contact_phone || null
            extendedProfile.home_area = driverProfile.home_area || null
            extendedProfile.rating_avg = driverProfile.rating_avg ?? null
            extendedProfile.total_requests = driverProfile.total_requests ?? null
          }
        }

        if (profile?.role === 'mechanic') {
          const { data: mechanicProfile } = await supabase
            .from('mechanic_profiles')
            .select('specializations, years_experience, business_name, verification_status, rating_avg, total_jobs, is_available, location_label')
            .eq('user_id', userId)
            .maybeSingle()

          if (mechanicProfile) {
            extendedProfile.mechanic_profile = mechanicProfile
            extendedProfile.business_name = mechanicProfile.business_name || null
            extendedProfile.verification_status = mechanicProfile.verification_status || null
            extendedProfile.specializations = mechanicProfile.specializations || []
            extendedProfile.years_experience = mechanicProfile.years_experience ?? null
            extendedProfile.rating_avg = mechanicProfile.rating_avg ?? null
            extendedProfile.total_jobs = mechanicProfile.total_jobs ?? null
            extendedProfile.is_available = mechanicProfile.is_available ?? null
            extendedProfile.location_label = mechanicProfile.location_label || null
          }
        }

        return extendedProfile
      } catch (err) {
        console.error('Unexpected error fetching profile:', err)
        setError('Unexpected error loading profile')
        setNetworkStatus('degraded')

        if (attempt < MAX_RETRIES) {
          const delay = RETRY_DELAY_MS * Math.pow(2, attempt)
          await new Promise((resolve) => setTimeout(resolve, delay))
          continue
        }

        return fallbackProfile
      }
    }
    return null
  }, [setError, setNetworkStatus])

  const setSession = useCallback(async (session) => {
    try {
      if (session?.user) {
        const profile = await fetchUserProfile(session.user)

        setAuthState({
          user: session.user,
          profile,
        })

        setUser(session.user)
        setProfile(profile)
      } else {
        resetAuth()
      }

      setLoading(false)
    } catch (err) {
      console.error('Error in setSession:', err)
      setError('Failed to initialize auth session')
      setLoading(false)
    }
  }, [fetchUserProfile, setAuthState, setUser, setProfile, resetAuth, setLoading, setError])

  useEffect(() => {
    let isMounted = true

    const initializeAuth = async () => {
      try {
        const supabase = createClient()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (_event, session) => {
            if (_event === 'SIGNED_OUT' || _event === 'USER_DELETED') {
              if (isMounted) {
                resetAuth()
                setNetworkStatus('connected')
              }
            } else if (session?.user) {
              if (isMounted) {
                await setSession(session)
              }
            }
          }
        )

        subscriptionRef.current = subscription

        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.warn('Error fetching initial session:', error)
          setNetworkStatus('degraded')
        }

        if (isMounted) {
          await setSession(session)
        }
      } catch (err) {
        console.error('Auth initialization error:', err)
        if (isMounted) {
          setError('Failed to initialize authentication')
          setLoading(false)
        }
      }
    }

    initializeAuth()

    return () => {
      isMounted = false
      if (subscriptionRef.current?.unsubscribe) {
        subscriptionRef.current.unsubscribe()
      }
    }
  }, [setSession, resetAuth, setError, setLoading, setNetworkStatus])

  return children
}
