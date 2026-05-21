'use client';

/**
 * Login Page
 * User authentication endpoint
 * Supports email/password authentication via Supabase
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSuccess = () => {
    // Navigate to appropriate dashboard based on user role
    router.push('/driver');
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Sign In</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <LoginForm 
        onSuccess={handleLoginSuccess}
        onError={setError}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
      />

      <p className="mt-6 text-center text-gray-600">
        Don't have an account?{' '}
        <a href="/register" className="text-red-600 hover:text-red-700 font-semibold">
          Register here
        </a>
      </p>
    </div>
  );
}
