'use client';

/**
 * Driver Request History Page
 * Historical view of all past rescue requests
 * Includes completion details and ratings
 */

import { useState, useEffect } from 'react';
import { useRequest } from '@/hooks/useRequest';

export default function DriverHistoryPage() {
  const { requests } = useRequest();
  const [filter, setFilter] = useState('all');

  const filteredRequests = requests.filter((req) => {
    if (filter === 'completed') return req.status === 'COMPLETED';
    if (filter === 'cancelled') return req.status === 'CANCELLED';
    return true;
  });

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Request History</h1>

      {/* Filter */}
      <div className="mb-6 flex gap-3">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            filter === 'all'
              ? 'bg-red-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            filter === 'completed'
              ? 'bg-red-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Completed
        </button>
        <button
          onClick={() => setFilter('cancelled')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            filter === 'cancelled'
              ? 'bg-red-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Cancelled
        </button>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredRequests.length > 0 ? (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">ID</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Vehicle</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Issue</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Mechanic</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredRequests.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-6 py-4 text-sm font-mono text-gray-700">#{req.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{req.vehicleDetails}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{req.issue}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {req.assignedMechanic?.name || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(req.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        req.status === 'COMPLETED'
                          ? 'bg-green-100 text-green-800'
                          : req.status === 'CANCELLED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {req.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-6 text-center text-gray-600">
            No requests found
          </div>
        )}
      </div>
    </div>
  );
}
