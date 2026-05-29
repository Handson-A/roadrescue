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

import { useAuthStore } from '@/store/authStore'

export function useAuth() {
  const { user, profile, loading } = useAuthStore()
  const role = profile?.role || user?.role || null

  return {
    user,
    profile,
    loading,
    role,
    isDriver: role === 'driver',
    isMechanic: role === 'mechanic',
    isAdmin: role === 'admin',
    isLoggedIn: !!user,
  }
}