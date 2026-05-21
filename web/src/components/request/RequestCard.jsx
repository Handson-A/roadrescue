'use client';

/**
 * RequestCard Component
 * Displays rescue request summary with key details
 */

import Badge from '@/components/ui/Badge';

export default function RequestCard({ request, isActive = false }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'ASSIGNED':
        return 'info';
      case 'COMPLETED':
        return 'success';
      case 'CANCELLED':
        return 'danger';
      default:
        return 'primary';
    }
  };

  return (
    <div className={`p-6 border rounded-lg ${isActive ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">{request.issue}</h3>
          <p className="text-sm text-gray-600 mt-1">📍 {request.location}</p>
          <p className="text-sm text-gray-600">🚗 {request.vehicleDetails}</p>
        </div>
        <Badge variant={getStatusColor(request.status)}>{request.status}</Badge>
      </div>

      {request.diagnostics && (
        <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
          <p className="text-sm text-gray-600">
            <strong>AI Diagnosis:</strong> {request.diagnostics}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          Requested {new Date(request.createdAt).toLocaleTimeString()}
        </span>
        {request.assignedMechanic && (
          <span>Mechanic: {request.assignedMechanic.name}</span>
        )}
      </div>
    </div>
  );
}
