'use client';

/**
 * Admin Requests Management Page
 * Overview and management of all rescue requests in the system
 * Filter by status, location, mechanic
 */

import { useState } from 'react';

export default function AdminRequestsPage() {
  const [filter, setFilter] = useState('all');

  const requests = [
    { id: 101, driver: 'Alice Johnson', issue: 'Flat Tire', location: 'Downtown', status: 'COMPLETED', mechanic: 'John Smith' },
    { id: 102, driver: 'Bob Wilson', issue: 'Engine Trouble', location: 'Highway', status: 'ASSIGNED', mechanic: 'Maria Garcia' },
    { id: 103, driver: 'Carol Davis', issue: 'Battery Dead', location: 'Mall Parking', status: 'PENDING', mechanic: '-' },
  ];

  const filteredRequests = requests.filter((r) => {
    if (filter === 'pending') return r.status === 'PENDING';
    if (filter === 'assigned') return r.status === 'ASSIGNED';
    if (filter === 'completed') return r.status === 'COMPLETED';
    return true;
  });

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">All Rescue Requests</h1>

      {/* Filters */}
      <div className="mb-6 flex gap-3">
        {['all', 'pending', 'assigned', 'completed'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-semibold transition capitalize ${
              filter === status
                ? 'bg-red-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredRequests.length > 0 ? (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">ID</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Driver</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Issue</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Location</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Mechanic</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredRequests.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-mono text-gray-700">#{req.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{req.driver}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{req.issue}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{req.location}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{req.mechanic}</td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        req.status === 'COMPLETED'
                          ? 'bg-green-100 text-green-800'
                          : req.status === 'ASSIGNED'
                          ? 'bg-blue-100 text-blue-800'
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
          <div className="p-6 text-center text-gray-600">No requests found</div>
        )}
      </div>
    </div>
  );
}
