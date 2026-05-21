'use client';

/**
 * RoleGuard Component
 * Protects routes by checking user role
 */

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function RoleGuard({ children, requiredRole }) {
  const router = useRouter();
  const { role, loading } = useAuth();

  useEffect(() => {
    if (!loading && role !== requiredRole) {
      router.replace('/login');
    }
  }, [role, requiredRole, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (role !== requiredRole) {
    return null;
  }

  return children;
}
