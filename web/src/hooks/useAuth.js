// 'use client';

// /**
//  * useAuth Hook
//  * Manages current user authentication state and role
//  */

// import { useState, useEffect } from 'react';


// export function useAuth() {
//   const [user, setUser] = useState(null);
//   const [role, setRole] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     // Check if user is logged in
//     const token = sessionStorage.getItem('auth_token');
    
//     if (token) {
//       // In production, verify token with backend
//       const mockUser = {
//         id: '1',
//         name: 'John Driver',
//         email: 'john@example.com',
//         avatar: '/images/placeholder-avatar.png',
//       };
//       const mockRole = localStorage.getItem('user_role') || 'driver';
      
//       setUser(mockUser);
//       setRole(mockRole);
//     }

//     setLoading(false);
//   }, []);

//   return { user, role, loading };
// }
// web/src/hooks/useAuth.js

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getCurrentUser } from '@/lib/auth'

// Central auth hook. Every component that needs the current user calls this.
// It also listens for auth state changes (login, logout, token refresh)
// so the UI always reflects the real session state.
export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // initial load — fetch user on mount
    getCurrentUser().then(currentUser => {
      setUser(currentUser)
      setLoading(false)
    })

    // subscribe to auth state changes
    // this fires on: sign in, sign out, token refresh
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          // session exists — re-fetch full profile
          const currentUser = await getCurrentUser()
          setUser(currentUser)
        } else {
          // signed out
          setUser(null)
        }
        setLoading(false)
      }
    )

    // cleanup subscription on unmount
    return () => subscription.unsubscribe()
  }, [])

  return {
    user,          // null if not logged in, full user+profile object if logged in
    loading,       // true while initial auth check is running
    isDriver: user?.role === 'driver',
    isMechanic: user?.role === 'mechanic',
    isAdmin: user?.role === 'admin',
    isLoggedIn: !!user,
  }
}