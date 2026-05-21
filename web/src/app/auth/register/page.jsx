'use client';

/**
 * Register Page
 * New user account creation endpoint
 * Role selection between Driver and Mechanic
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import RegisterForm from '@/components/auth/RegisterForm';

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // Step 1: Role selection, Step 2: Form

  const handleRegistrationSuccess = () => {
    router.push('/login?registered=true');
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Account</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {step === 1 ? (
        <div className="space-y-4">
          <p className="text-gray-600 mb-4">Choose your role:</p>
          <button
            onClick={() => setStep(2)}
            className="w-full p-4 border-2 border-gray-300 rounded-lg hover:border-red-500 hover:bg-red-50 transition text-left"
          >
            <h3 className="font-semibold text-gray-900">🚗 Driver</h3>
            <p className="text-sm text-gray-600">Request roadside assistance</p>
          </button>
          <button
            onClick={() => setStep(2)}
            className="w-full p-4 border-2 border-gray-300 rounded-lg hover:border-red-500 hover:bg-red-50 transition text-left"
          >
            <h3 className="font-semibold text-gray-900">🔧 Mechanic</h3>
            <p className="text-sm text-gray-600">Provide professional assistance</p>
          </button>
        </div>
      ) : (
        <>
          <RegisterForm 
            onSuccess={handleRegistrationSuccess}
            onError={setError}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
          <button
            onClick={() => setStep(1)}
            className="mt-4 text-red-600 hover:text-red-700 text-sm"
          >
            ← Back
          </button>
        </>
      )}

      <p className="mt-6 text-center text-gray-600">
        Already have an account?{' '}
        <a href="/login" className="text-red-600 hover:text-red-700 font-semibold">
          Sign in
        </a>
      </p>
    </div>
  );
}
