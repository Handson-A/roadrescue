/**
 * AuthProvider.jsx — ENHANCED VERSION
 * Global authentication provider with Supabase session management
 * 
 * Responsibilities:
 * 1. Listen to supabase.auth.onAuthStateChange()
 * 2. Fetch and sync current user's database profile
 * 3. Update Zustand authStore with user + profile
 * 4. Handle network errors with exponential backoff retry
 * 5. Gracefully handle permission errors and profile mismatches
 */

'use client'

import { useEffect, useRef } from 'react'
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

  /**
   * Fetch user profile from database with retry logic
   * Returns profile or null if fetch fails after retries
   */
  const fetchUserProfile = async (user, retryCount = 0) => {
    if (!user?.id) return null

    const userId = user?.id

    const fallbackProfile = {
      id: userId,
      email: user.email || null,
      full_name: user.user_metadata?.full_name || null,
      phone: user.user_metadata?.phone || null,
      role: user.user_metadata?.role || null,
    }

    try {
      const supabase = createClient()

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        if (isRlsStyleError(error)) {
          console.warn(`Profile fetch blocked by policy for user ${userId}; using auth metadata fallback`, error)
          setError(null)
          setNetworkStatus('connected')
          return fallbackProfile
        }

        // Permission or network error
        if (error.code === 'PGRST100') {
          // Row not found (newly created user, profile will sync via trigger)
          console.warn(`Profile not yet created for user ${userId} — will be created by trigger`)
          return null
        }

        // Network or permission error — retry with exponential backoff
        if (retryCount < MAX_RETRIES) {
          const delay = RETRY_DELAY_MS * Math.pow(2, retryCount)
          console.warn(
            `Profile fetch failed (attempt ${retryCount + 1}/${MAX_RETRIES}), retrying in ${delay}ms:`,
            error
          )
          await new Promise((resolve) => setTimeout(resolve, delay))
          return fetchUserProfile(user, retryCount + 1)
        }

        // Max retries exceeded
        console.error(`Profile fetch failed after ${MAX_RETRIES} retries for user ${userId}:`, error)
        setError(`Failed to load profile: ${error.message}`)
        setNetworkStatus('degraded')
        return null
      }

      // Success — profile found or null (newly created user)
      retryCountRef.current[userId] = 0
      setError(null) // Clear previous errors
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

      // Retry on unexpected errors too
      if (retryCount < MAX_RETRIES) {
        const delay = RETRY_DELAY_MS * Math.pow(2, retryCount)
        await new Promise((resolve) => setTimeout(resolve, delay))
        return fetchUserProfile(user, retryCount + 1)
      }

      return fallbackProfile
    }
  }

  /**
   * Primary session setter
   * Called when auth state changes or on initial load
   */
  const setSession = async (session) => {
    try {
      if (session?.user) {
        // User is signed in — fetch and sync profile
        const profile = await fetchUserProfile(session.user)

        setAuthState({
          user: session.user,
          profile,
        })

        // Update individual stores for component subscribers
        setUser(session.user)
        setProfile(profile)
      } else {
        // User is signed out
        resetAuth()
      }

      setLoading(false)
    } catch (err) {
      console.error('Error in setSession:', err)
      setError('Failed to initialize auth session')
      setLoading(false)
    }
  }

  /**
   * Initialize auth on mount
   * 1. Set up realtime listener for auth changes
   * 2. Get initial session
   * 3. Return cleanup function
   */
  useEffect(() => {
    let isMounted = true
    let unsubscribe

    const initializeAuth = async () => {
      try {
        const supabase = createClient()

        // 1. Subscribe to auth state changes (sign in/out/signup)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (_event, session) => {
            // Handle auth events: INITIAL_SESSION, SIGNED_IN, SIGNED_OUT, USER_UPDATED, etc
            if (_event === 'SIGNED_OUT' || _event === 'USER_DELETED') {
              // User signed out or was deleted
              if (isMounted) {
                resetAuth()
                setNetworkStatus('connected')
              }
            } else if (session?.user) {
              // User signed in or session refreshed
              if (isMounted) {
                await setSession(session)
              }
            }
          }
        )

        subscriptionRef.current = subscription

        // 2. Get initial session (restores from browser storage if valid)
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.warn('Error fetching initial session:', error)
          setNetworkStatus('degraded')
        }

        // 3. Set initial auth state
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

    // Cleanup
    return () => {
      isMounted = false
      if (subscriptionRef.current?.unsubscribe) {
        subscriptionRef.current.unsubscribe()
      }
    }
  }, [])

  /**
   * Expose auth state to all children via Zustand store
   * Components can use: useAuthStore() to access user, profile, loading, error, networkStatus
   */
  return children
}
