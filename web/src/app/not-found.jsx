'use client';

/**
 * 404 Not Found Page
 * Displayed when user navigates to non-existent route
 */

import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold text-red-600 mb-4">404</h1>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h2>
        <p className="text-gray-600 mb-8">
          The route you're looking for doesn't exist. Let's get you back on track.
        </p>
        <button
          onClick={() => router.push('/')}
          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
        >
          Go Home
        </button>
      </div>
    </div>
  );
}
