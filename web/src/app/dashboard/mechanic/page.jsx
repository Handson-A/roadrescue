'use client';

/**
 * Mechanic Dashboard
 * Main hub for mechanics to:
 * - View incoming rescue requests/job postings
 * - Bid on jobs
 * - View active jobs with live tracking
 * - Access completed jobs history
 */

import { useState, useEffect } from 'react';
import { useRequest } from '@/hooks/useRequest';
import RequestCard from '@/components/request/RequestCard';

export default function MechanicPage() {
  const { requests } = useRequest();
  const [activeTab, setActiveTab] = useState('incoming');

  const incomingRequests = requests.filter((r) => r.status === 'PENDING');
  const activeJobs = requests.filter((r) => r.status === 'ASSIGNED' && r.assignedMechanic?.id === 'current-user-id');

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Job Dashboard</h1>
        <p className="text-gray-600 mt-2">Find and manage rescue jobs in your area</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('incoming')}
          className={`px-4 py-2 font-semibold transition border-b-2 ${
            activeTab === 'incoming'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          📋 Incoming Requests ({incomingRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 font-semibold transition border-b-2 ${
            activeTab === 'active'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          🚗 Active Jobs ({activeJobs.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'incoming' ? (
        <div className="space-y-4">
          {incomingRequests.length > 0 ? (
            incomingRequests.map((request) => (
              <div key={request.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-lg">{request.issue}</h3>
                    <p className="text-gray-600 text-sm mt-1">📍 {request.location}</p>
                    <p className="text-gray-600 text-sm">🚗 {request.vehicleDetails}</p>
                    <p className="text-gray-500 text-sm mt-2">
                      Posted {new Date(request.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <button className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition">
                    Bid
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-600">
              No incoming requests at the moment
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {activeJobs.length > 0 ? (
            activeJobs.map((job) => (
              <RequestCard key={job.id} request={job} isActive={true} />
            ))
          ) : (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-600">
              No active jobs
            </div>
          )}
        </div>
      )}
    </div>
  );
}
