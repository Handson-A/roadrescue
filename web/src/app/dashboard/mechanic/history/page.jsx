'use client';

/**
 * Mechanic Job History Page
 * Historical view of all completed jobs
 * Includes earnings, ratings received, and performance stats
 */

import { useRequest } from '@/hooks/useRequest';

export default function MechanicHistoryPage() {
  const { requests } = useRequest();
  const completedJobs = requests.filter((r) => r.status === 'COMPLETED');

  const totalEarnings = completedJobs.reduce((sum, job) => sum + (job.earnings || 0), 0);
  const averageRating = completedJobs.length > 0
    ? (completedJobs.reduce((sum, job) => sum + (job.rating || 0), 0) / completedJobs.length).toFixed(1)
    : 0;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Job History</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Completed Jobs</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{completedJobs.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Total Earnings</p>
          <p className="text-3xl font-bold text-green-600 mt-2">${totalEarnings.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Average Rating</p>
          <p className="text-3xl font-bold text-yellow-600 mt-2">⭐ {averageRating}</p>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {completedJobs.length > 0 ? (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Job ID</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Driver</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Issue</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Earnings</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {completedJobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-mono text-gray-700">#{job.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{job.driver?.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{job.issue}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(job.completedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-green-600">
                    ${job.earnings?.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-yellow-600">
                    ⭐ {job.rating?.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-6 text-center text-gray-600">
            No completed jobs yet
          </div>
        )}
      </div>
    </div>
  );
}
