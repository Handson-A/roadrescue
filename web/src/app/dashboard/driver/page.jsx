'use client';

/**
 * Driver Dashboard
 * Main hub for drivers to:
 * - Create new rescue requests
 * - View current/active request with live tracking
 * - Access request history
 */

import { useState, useEffect } from 'react';
import { useRequest } from '@/hooks/useRequest';
import RequestForm from '@/components/request/RequestForm';
import RequestCard from '@/components/request/RequestCard';

export default function DriverPage() {
  const { requests, activeRequest, loading } = useRequest();
  const [showNewRequest, setShowNewRequest] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rescue Requests</h1>
          <p className="text-gray-600 mt-2">Manage your roadside assistance requests</p>
        </div>
        <button
          onClick={() => setShowNewRequest(true)}
          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition"
        >
          + New Request
        </button>
      </div>

      {/* New Request Modal */}
      {showNewRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Create New Request</h2>
              <button
                onClick={() => setShowNewRequest(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <RequestForm onSuccess={() => setShowNewRequest(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Active Request */}
      {activeRequest && (
        <div className="mb-8 p-6 bg-yellow-50 border-l-4 border-yellow-400 rounded">
          <h2 className="text-lg font-semibold text-yellow-900 mb-4">🔔 Active Request</h2>
          <RequestCard request={activeRequest} isActive={true} />
        </div>
      )}

      {/* Recent Requests */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Recent Requests</h2>
        </div>
        {loading ? (
          <div className="p-6 text-center text-gray-600">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          </div>
        ) : requests.length > 0 ? (
          <div className="divide-y">
            {requests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-gray-600">
            No requests yet. Create one to get started!
          </div>
        )}
      </div>
    </div>
  );
}
