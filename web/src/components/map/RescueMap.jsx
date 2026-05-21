'use client';

/**
 * RescueMap Component
 * Displays live map with rescue location and mechanics nearby
 * Integrates with Leaflet or Google Maps
 */

import { useEffect, useRef } from 'react';

export default function RescueMap({ request }) {
  const mapContainerRef = useRef(null);

  useEffect(() => {
    // Initialize map (using Leaflet.js example structure)
    // In production: import L from 'leaflet'
    // const map = L.map(mapContainerRef.current).setView([request.latitude, request.longitude], 15);
    // L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    // L.marker([request.latitude, request.longitude]).addTo(map).bindPopup('Your Location');
    // if (request.assignedMechanic?.latitude) {
    //   L.marker([request.assignedMechanic.latitude, request.assignedMechanic.longitude]).addTo(map);
    // }
  }, [request]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Live Location</h2>
      <div
        ref={mapContainerRef}
        className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center text-gray-600"
      >
        {/* Map will be rendered here */}
        <div className="text-center">
          <p className="text-lg font-semibold">📍 Map Integration</p>
          <p className="text-sm text-gray-500 mt-2">
            Location: {request.latitude.toFixed(4)}, {request.longitude.toFixed(4)}
          </p>
          <p className="text-xs text-gray-400 mt-4">
            (Setup with Leaflet.js or Google Maps API)
          </p>
        </div>
      </div>
    </div>
  );
}
