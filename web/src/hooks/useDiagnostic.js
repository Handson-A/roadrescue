'use client';

/**
 * useDiagnostic Hook
 * Manages AI diagnostic flow and API calls
 */

import { useState } from 'react';

export function useDiagnostic() {
  const [diagnosis, setDiagnosis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getDiagnosis = async (vehicleDescription, symptoms) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleDescription, symptoms }),
      });

      if (!response.ok) throw new Error('Failed to get diagnosis');

      const data = await response.json();
      setDiagnosis(data.diagnosis);
      return data.diagnosis;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { diagnosis, loading, error, getDiagnosis };
}
