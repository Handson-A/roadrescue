// 'use client';

// /**
//  * RoleGuard Component
//  * Protects routes by checking user role
//  */

// import { useAuth } from '@/hooks/useAuth';
// import { useRouter } from 'next/navigation';
// import { useEffect } from 'react';

// export default function RoleGuard({ children, requiredRole }) {
//   const router = useRouter();
//   const { role, loading } = useAuth();

//   useEffect(() => {
//     if (!loading && role !== requiredRole) {
//       router.replace('/login');
//     }
//   }, [role, requiredRole, loading, router]);

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-screen">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
//           <p className="text-gray-600">Loading...</p>
//         </div>
//       </div>
//     );
//   }

//   if (role !== requiredRole) {
//     return null;
//   }

//   return children;
// }

// web/src/components/auth/RoleGuard.jsx
// Client-side role protection for components and pages.
// Middleware handles route-level protection.
// RoleGuard handles component-level protection inside a page.
// Use this to hide UI sections from the wrong role.

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Spinner from '@/components/ui/Spinner'

export default function RoleGuard({ children, allowedRoles }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
    }

    if (!loading && user && !allowedRoles.includes(user.role)) {
      // logged in but wrong role — send them to their own dashboard
      router.replace(`/${user.role}`)
    }
  }, [user, loading, allowedRoles, router])

  if (loading) return <Spinner />

  if (!user || !allowedRoles.includes(user.role)) return null

  return children
}