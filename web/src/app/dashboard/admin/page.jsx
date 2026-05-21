'use client';

/**
 * Admin Dashboard
 * Overview of system metrics and quick actions
 * Links to admin sections (mechanics verification, requests, users)
 */

import { useEffect, useState } from 'react';

export default function AdminPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeMechanics: 0,
    pendingRequests: 0,
    pendingVerifications: 0,
  });

  useEffect(() => {
    // Fetch admin stats
    setStats({
      totalUsers: 1250,
      activeMechanics: 340,
      pendingRequests: 23,
      pendingVerifications: 8,
    });
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Total Users</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalUsers}</p>
          <p className="text-xs text-gray-500 mt-2">↑ 12% from last month</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Active Mechanics</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{stats.activeMechanics}</p>
          <p className="text-xs text-gray-500 mt-2">✓ Verified</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Pending Requests</p>
          <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.pendingRequests}</p>
          <p className="text-xs text-gray-500 mt-2">Awaiting assignment</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Pending Verifications</p>
          <p className="text-3xl font-bold text-red-600 mt-2">{stats.pendingVerifications}</p>
          <p className="text-xs text-gray-500 mt-2">⚠️ Action needed</p>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mechanics Verification */}
        <a
          href="/admin/mechanics"
          className="block bg-white rounded-lg shadow p-6 hover:shadow-lg hover:border-red-500 border-2 border-transparent transition"
        >
          <h3 className="text-lg font-bold text-gray-900">🔧 Verify Mechanics</h3>
          <p className="text-gray-600 text-sm mt-2">Review and approve mechanic applications</p>
          <div className="mt-4 inline-block px-4 py-2 bg-red-100 text-red-700 rounded text-sm font-semibold">
            {stats.pendingVerifications} pending
          </div>
        </a>

        {/* All Requests */}
        <a
          href="/admin/requests"
          className="block bg-white rounded-lg shadow p-6 hover:shadow-lg hover:border-red-500 border-2 border-transparent transition"
        >
          <h3 className="text-lg font-bold text-gray-900">📋 All Requests</h3>
          <p className="text-gray-600 text-sm mt-2">Monitor rescue requests across the system</p>
          <div className="mt-4 inline-block px-4 py-2 bg-yellow-100 text-yellow-700 rounded text-sm font-semibold">
            {stats.pendingRequests} active
          </div>
        </a>

        {/* User Management */}
        <a
          href="/admin/users"
          className="block bg-white rounded-lg shadow p-6 hover:shadow-lg hover:border-red-500 border-2 border-transparent transition"
        >
          <h3 className="text-lg font-bold text-gray-900">👥 User Management</h3>
          <p className="text-gray-600 text-sm mt-2">Manage user accounts and permissions</p>
          <div className="mt-4 inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded text-sm font-semibold">
            {stats.totalUsers} users
          </div>
        </a>

        {/* System Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900">🎯 System Status</h3>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">API Status</span>
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded font-semibold">✓ Operating</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Database</span>
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded font-semibold">✓ Healthy</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Cache</span>
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded font-semibold">✓ Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
