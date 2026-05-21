// 'use client';

// /**
//  * useRequest Hook
//  * Manages rescue request state and operations
//  */

// import { useState, useEffect } from 'react';

// export function useRequest() {
//   const [requests, setRequests] = useState([]);
//   const [activeRequest, setActiveRequest] = useState(null);
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     // Fetch requests from API
//     fetchRequests();
//   }, []);

//   const fetchRequests = async () => {
//     setLoading(true);
//     try {
//       // In production, call actual API
//       const mockRequests = [
//         {
//           id: '101',
//           issue: 'Flat Tire',
//           vehicleDetails: '2020 Honda Civic',
//           location: 'Downtown',
//           status: 'PENDING',
//           createdAt: new Date().toISOString(),
//           latitude: 40.7128,
//           longitude: -74.006,
//         },
//       ];
//       setRequests(mockRequests);
//       const active = mockRequests.find((r) => r.status !== 'COMPLETED');
//       setActiveRequest(active);
//     } catch (error) {
//       console.error('Error fetching requests:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getRequestById = (id) => requests.find((r) => r.id === id);

//   return { requests, activeRequest, loading, getRequestById, fetchRequests };
// }

// web/src/hooks/useRequestStatus.js
// Driver subscribes to their active rescue request.
// Any status change (pending → accepted → en_route etc.)
// updates the UI instantly without refresh.

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useRequestStatus(requestId) {
  const [request, setRequest] = useState(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    if (!requestId) return

    // initial fetch — load current state before realtime kicks in
    async function fetchRequest() {
      const { data, error } = await supabase
        .from('rescue_requests')
        .select(`
          *,
          mechanic:mechanic_id (
            id,
            full_name,
            phone,
            avatar_url,
            mechanic_profiles (
              rating_avg,
              specializations,
              business_name
            )
          )
        `)
        .eq('id', requestId)
        .single()

      if (!error) setRequest(data)
      setLoading(false)
    }

    fetchRequest()

    // subscribe to any update on this specific request row
    // filter ensures we only get events for THIS request, not all requests
    const channel = supabase
      .channel(`request-status-${requestId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rescue_requests',
          filter: `id=eq.${requestId}`,
        },
        (payload) => {
          // merge updated fields into existing request state
          // payload.new contains only the changed row data
          setRequest(prev => ({ ...prev, ...payload.new }))
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [requestId])

  return { request, loading }
}