// 'use client';

// /**
//  * useDiagnostic Hook
//  * Manages AI diagnostic flow and API calls
//  */

// import { useState } from 'react';

// export function useDiagnostic() {
//   const [diagnosis, setDiagnosis] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   const getDiagnosis = async (vehicleDescription, symptoms) => {
//     setLoading(true);
//     setError(null);

//     try {
//       const response = await fetch('/api/ai/diagnose', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ vehicleDescription, symptoms }),
//       });

//       if (!response.ok) throw new Error('Failed to get diagnosis');

//       const data = await response.json();
//       setDiagnosis(data.diagnosis);
//       return data.diagnosis;
//     } catch (err) {
//       setError(err.message);
//       throw err;
//     } finally {
//       setLoading(false);
//     }
//   };

//   return { diagnosis, loading, error, getDiagnosis };
// }

// web/src/hooks/useDiagnostic.js
// Manages the full diagnostic flow on the frontend.
// Called from the RequestForm before the driver submits.

import { useState } from 'react'

export function useDiagnostic() {
  const [diagnosis, setDiagnosis] = useState(null)

  // loading state specifically for the AI call
  const [diagnosing, setDiagnosing] = useState(false)

  // tracks if we used the fallback (to show a subtle warning in UI)
  const [isFallback, setIsFallback] = useState(false)

  const [error, setError] = useState(null)

  async function diagnose({ symptoms, vehicleMake, vehicleModel, vehicleYear }) {
    if (!symptoms || symptoms.trim().length < 10) {
      setError('Please describe your problem in more detail')
      return null
    }

    setDiagnosing(true)
    setError(null)
    setDiagnosis(null)

    try {
      const res = await fetch('/api/ai/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptoms,
          vehicleMake,
          vehicleModel,
          vehicleYear,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Diagnostic failed')
      }

      setDiagnosis(data.diagnosis)
      setIsFallback(data.fallback || false)

      return data.diagnosis

    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setDiagnosing(false)
    }
  }

  function resetDiagnosis() {
    setDiagnosis(null)
    setIsFallback(false)
    setError(null)
  }

  return {
    diagnosis,      // the structured result object
    diagnosing,     // true while waiting for OpenAI
    isFallback,     // true if we used the fallback response
    error,          // error message if something went wrong
    diagnose,       // call this with symptom text
    resetDiagnosis, // clear state for a fresh attempt
  }
}