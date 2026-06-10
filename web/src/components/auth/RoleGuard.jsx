'use client';

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Spinner from '@/components/ui/Spinner'
import { useAuth } from '@/hooks/useAuth'

/**
 * RoleGuard Component
 *
 * This component protects UI elements by checking the user's role.
 * It should be used to wrap components that should only be visible to users with a specific role.
 *
 * @param {object} props - The component props.
 * @param {string[]} props.allowedRoles - The roles required to view the children components.
 * @param {React.ReactNode} props.children - The components to render if the user has the required role.
 * @returns {React.ReactNode|null} The children components if the user has the required role, otherwise null.
 */
export default function RoleGuard({
  allowedRoles,
  children,
}) {
  const router = useRouter()
  const { role, loading, isLoggedIn } = useAuth()

  useEffect(() => {
    if (!loading && !isLoggedIn) {
      router.replace('/auth/login')
      return
    }

    if (!loading && role && !allowedRoles.includes(role)) {
      router.replace(`/dashboard/${role}`)
    }
  }, [
    allowedRoles,
    role,
    isLoggedIn,
    loading,
    router,
  ])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!isLoggedIn || !role || !allowedRoles.includes(role)) {
    return null
  }

  return children
}