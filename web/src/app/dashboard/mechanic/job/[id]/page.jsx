'use client';

/**
 * Mechanic Active Job Detail Page
 * Shows job details, driver info, live location tracking
 * Allows mechanic to mark job as completed
 */

import { useParams } from 'next/navigation';
import { useRequest } from '@/hooks/useRequest';
import RescueMap from '@/components/map/RescueMap';

export default function JobDetailPage() {
  const params = useParams();
  const jobId = params.id;
  const { getRequestById } = useRequest();
  const job = getRequestById(jobId);

  if (!job) {
    return <div className="text-center py-12">Job not found</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Job #{jobId}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2">
          <RescueMap request={job} />
        </div>

        {/* Job Details */}
        <div className="space-y-6">
          {/* Driver Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Driver</h2>
            <div className="flex items-center mb-4">
              <img
                src={job.driver?.avatar || '/images/placeholder-avatar.png'}
                alt={job.driver?.name}
                className="w-12 h-12 rounded-full mr-4"
              />
              <div>
                <p className="font-semibold text-gray-900">{job.driver?.name}</p>
                <p className="text-sm text-gray-600">{job.driver?.phone}</p>
              </div>
            </div>
            <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">
              📞 Call Driver
            </button>
          </div>

          {/* Vehicle & Issue */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Details</h2>
            <p className="text-sm text-gray-600 mb-2">
              <strong>Vehicle:</strong> {job.vehicleDetails}
            </p>
            <p className="text-sm text-gray-600 mb-2">
              <strong>Issue:</strong> {job.issue}
            </p>
            {job.diagnostics && (
              <p className="text-sm text-gray-600">
                <strong>AI Diagnosis:</strong> {job.diagnostics}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold mb-3">
              ✓ Complete Job
            </button>
            <button className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-semibold">
              × Decline Job
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
