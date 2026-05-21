'use client';

/**
 * Global Error Page
 * Catches and displays application-level errors
 */

import { useEffect } from 'react';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
      <div className="text-center max-w-md bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-bold text-red-600 mb-4">⚠️ Oops!</h1>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
        <p className="text-gray-600 mb-8">
          We encountered an unexpected error. Please try again or contact support if the problem persists.
        </p>
        <button
          onClick={() => reset()}
          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
