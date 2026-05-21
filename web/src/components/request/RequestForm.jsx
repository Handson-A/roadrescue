'use client';

/**
 * RequestForm Component
 * Form for creating new rescue requests
 */

import { useState } from 'react';
import { useLocation } from '@/hooks/useLocation';
import { useDiagnostic } from '@/hooks/useDiagnostic';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LocationPicker from '@/components/map/LocationPicker';
import Spinner from '@/components/ui/Spinner';

export default function RequestForm({ onSuccess }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    vehicleDetails: '',
    issue: '',
    location: '',
    latitude: null,
    longitude: null,
  });
  const [diagnostics, setDiagnostics] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { location } = useLocation();
  const { getDiagnosis } = useDiagnostic();

  const handleGetDiagnosis = async () => {
    setIsLoading(true);
    try {
      const diagnosis = await getDiagnosis(formData.vehicleDetails, formData.issue);
      setDiagnostics(diagnosis);
      setStep(3);
    } catch (error) {
      console.error('Error getting diagnosis:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          diagnostics,
        }),
      });

      if (response.ok) {
        onSuccess?.();
      }
    } catch (error) {
      console.error('Error creating request:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {step === 1 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Vehicle & Issue Details</h3>
          <Input
            label="Vehicle Details"
            placeholder="e.g., 2020 Toyota Camry, Blue"
            value={formData.vehicleDetails}
            onChange={(e) => setFormData({ ...formData, vehicleDetails: e.target.value })}
            required
          />
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              What's the problem? <span className="text-red-600">*</span>
            </label>
            <textarea
              value={formData.issue}
              onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
              placeholder="Describe the issue..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              rows="4"
            />
          </div>
          <Button
            onClick={() => setStep(2)}
            variant="primary"
            className="w-full"
            disabled={!formData.vehicleDetails || !formData.issue}
          >
            Next: Location
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <LocationPicker
            onLocationSelect={(loc) => {
              setFormData({ ...formData, ...loc });
              handleGetDiagnosis();
            }}
          />
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">AI Diagnosis</h3>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg max-h-40 overflow-y-auto">
            <p className="text-gray-700">{diagnostics || 'Analyzing...'}</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setStep(2)}
              variant="secondary"
              className="flex-1"
            >
              Back
            </Button>
            <Button
              onClick={handleSubmit}
              variant="success"
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? <Spinner size="sm" /> : 'Submit Request'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
