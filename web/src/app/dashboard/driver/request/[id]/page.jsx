'use client';

/**
 * Driver Request Detail Page
 * Live tracking of a specific rescue request
 * Shows real-time location updates, assigned mechanic, ETA
 */

import { useParams } from 'next/navigation';
import { useRequest } from '@/hooks/useRequest';
import RescueMap from '@/components/map/RescueMap';
import RequestTimeline from '@/components/request/RequestTimeline';

export default function RequestDetailPage() {
  const params = useParams();
  const requestId = params.id;
  const { getRequestById } = useRequest();
  const request = getRequestById(requestId);

  if (!request) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Request not found</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Request #{requestId}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2">
          <RescueMap request={request} />
        </div>

        {/* Request Details */}
        <div className="space-y-6">
          {/* Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Status</h2>
            <RequestTimeline request={request} />
          </div>

          {/* Assigned Mechanic */}
          {request.assignedMechanic && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Assigned Mechanic</h2>
              <div className="flex items-center">
                <img
                  src={request.assignedMechanic.avatar || '/images/placeholder-avatar.png'}
                  alt={request.assignedMechanic.name}
                  className="w-12 h-12 rounded-full mr-4"
                />
                <div>
                  <p className="font-semibold text-gray-900">{request.assignedMechanic.name}</p>
                  <p className="text-sm text-gray-600">{request.assignedMechanic.phone}</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-gray-600">
                ETA: {request.assignedMechanic.eta || 'Calculating...'}
              </p>
            </div>
          )}

          {/* Vehicle Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Vehicle</h2>
            <p className="text-gray-700">{request.vehicleDetails}</p>
            <p className="text-sm text-gray-600 mt-2">Issue: {request.issue}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
