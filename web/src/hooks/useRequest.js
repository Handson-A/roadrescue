'use client';

/**
 * useRequest Hook
 * Manages rescue request state and operations
 */

import { useState, useEffect } from 'react';

export function useRequest() {
  const [requests, setRequests] = useState([]);
  const [activeRequest, setActiveRequest] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch requests from API
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      // In production, call actual API
      const mockRequests = [
        {
          id: '101',
          issue: 'Flat Tire',
          vehicleDetails: '2020 Honda Civic',
          location: 'Downtown',
          status: 'PENDING',
          createdAt: new Date().toISOString(),
          latitude: 40.7128,
          longitude: -74.006,
        },
      ];
      setRequests(mockRequests);
      const active = mockRequests.find((r) => r.status !== 'COMPLETED');
      setActiveRequest(active);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRequestById = (id) => requests.find((r) => r.id === id);

  return { requests, activeRequest, loading, getRequestById, fetchRequests };
}
