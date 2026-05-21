'use client';

/**
 * Authentication Layout
 * Wraps all auth-related pages (login, register)
 * No dashboard navbar or sidebar - clean auth experience
 */

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function AuthLayout({ children }) {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    // Redirect to dashboard if already authenticated
    if (user) {
      router.replace('/driver');
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/icons/logo.svg" alt="RoadRescue" className="h-16 w-16 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">RoadRescue</h1>
          <p className="text-gray-600 mt-2">Emergency vehicle assistance at your fingertips</p>
        </div>

        {/* Auth form container */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {children}
        </div>

        {/* Footer */}
        <p className="text-center text-gray-600 text-sm mt-6">
          &copy; 2026 RoadRescue. All rights reserved.
        </p>
      </div>
    </div>
  );
}
