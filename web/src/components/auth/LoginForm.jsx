'use client';

/**
 * LoginForm Component
 * User login form with email and password
 */

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';

export default function LoginForm({ onSuccess, onError, isLoading, setIsLoading }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      // In production, call your Supabase/auth API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        sessionStorage.setItem('auth_token', data.token);
        onSuccess?.();
      } else {
        onError?.('Invalid email or password');
      }
    } catch (error) {
      onError?.('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Email"
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
        required
      />

      <Input
        label="Password"
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
        required
      />

      <Button
        type="submit"
        variant="primary"
        className="w-full"
        disabled={isLoading || !email || !password}
      >
        {isLoading ? <Spinner size="sm" /> : 'Sign In'}
      </Button>
    </form>
  );
}
