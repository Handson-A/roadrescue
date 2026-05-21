'use client';

/**
 * LocationPicker Component
 * Allows driver to select/confirm rescue location on map
 */

import { useState } from 'react';
import Button from '@/components/ui/Button';

export default function LocationPicker({ onLocationSelect }) {
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [address, setAddress] = useState('');

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setLatitude(lat.toString());
        setLongitude(lon.toString());
        // Reverse geocode to get address
        setAddress(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
      });
    }
  };

  const handleConfirmLocation = () => {
    if (latitude && longitude) {
      onLocationSelect({ latitude: parseFloat(latitude), longitude: parseFloat(longitude), address });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Select Your Location</h3>

      <div className="mb-4">
        <Button
          onClick={handleGetCurrentLocation}
          variant="primary"
          className="w-full"
        >
          📍 Use Current Location
        </Button>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Or enter address
        </label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter address or coordinates"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <input
          type="number"
          value={latitude}
          onChange={(e) => setLatitude(e.target.value)}
          placeholder="Latitude"
          step="0.00001"
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
        <input
          type="number"
          value={longitude}
          onChange={(e) => setLongitude(e.target.value)}
          placeholder="Longitude"
          step="0.00001"
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
      </div>

      <Button
        onClick={handleConfirmLocation}
        variant="success"
        className="w-full"
        disabled={!latitude || !longitude}
      >
        Confirm Location
      </Button>
    </div>
  );
}
