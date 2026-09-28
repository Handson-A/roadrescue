// web/src/hooks/useNotifications.js
// Real-time notification hook with auto-cleanup of read items and 3-item cap.

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { NOTIFICATION_TYPE, USER_ROLE } from '@/lib/constants'

export const MAX_NOTIFICATIONS_CAP = 3

function parseRequestIdFromBody(body) {
  if (!body) return null
  const match = body.match(/\[req_id:\s*([a-f0-9-]{36})\]/i)
  return match ? match[1] : null
}

function cleanNotificationMessage(message) {
  if (!message) return ''
  return message.replace(/\[req_id:\s*[a-f0-9-]{36}\]/i, '').trim()
}

export function getNotificationHref(notification, role) {
  if (!notification) return null

  const requestId = notification.request_id || parseRequestIdFromBody(notification.body || notification.message)
  const userRole = role || USER_ROLE.DRIVER

  switch (notification.type) {
    case NOTIFICATION_TYPE.CHAT:
      return requestId
        ? userRole === USER_ROLE.MECHANIC
          ? `/dashboard/mechanic/job/${requestId}`
          : `/dashboard/driver/request/${requestId}`
        : null
    case NOTIFICATION_TYPE.NEW_REQUEST:
      return requestId && userRole === USER_ROLE.MECHANIC ? `/dashboard/mechanic/job/${requestId}` : null
    case NOTIFICATION_TYPE.MECHANIC_ACCEPTED:
    case NOTIFICATION_TYPE.MECHANIC_EN_ROUTE:
    case NOTIFICATION_TYPE.MECHANIC_ARRIVED:
    case NOTIFICATION_TYPE.JOB_COMPLETED:
    case NOTIFICATION_TYPE.REQUEST_CANCELLED:
      return requestId
        ? userRole === USER_ROLE.MECHANIC
          ? `/dashboard/mechanic/job/${requestId}`
          : `/dashboard/driver/request/${requestId}`
        : null
    default:
      return requestId
        ? userRole === USER_ROLE.MECHANIC
          ? `/dashboard/mechanic/job/${requestId}`
          : `/dashboard/driver/request/${requestId}`
        : null
  }
}

export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  // 1. Fetch active unread notifications on mount or user change
  const fetchNotifications = useCallback(async () => {
    if (!userId) return
    const supabase = createClient()

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('profile_id', userId)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(10)

    if (data) {
      const mapped = data.map((n) => ({
        ...n,
        message: cleanNotificationMessage(n.body),
      }))
      setNotifications(mapped)
      setUnreadCount(mapped.length)
    }
  }, [userId])

  useEffect(() => {
    if (!userId) return

    fetchNotifications()

    const supabase = createClient()

    // 2. Real-time subscription to notifications table
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `profile_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newNotification = payload.new
            if (!newNotification.is_read) {
              const mapped = {
                ...newNotification,
                message: cleanNotificationMessage(newNotification.body),
              }
              setNotifications((prev) => {
                const updated = [mapped, ...prev.filter((n) => n.id !== mapped.id)]
                return updated
              })
              setUnreadCount((prev) => prev + 1)
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new
            if (updated.is_read) {
              // Auto-clear read notification from feed
              setNotifications((prev) => prev.filter((n) => n.id !== updated.id))
              setUnreadCount((prev) => Math.max(0, prev - 1))
            } else {
              const mapped = {
                ...updated,
                message: cleanNotificationMessage(updated.body),
              }
              setNotifications((prev) =>
                prev.map((n) => (n.id === mapped.id ? mapped : n))
              )
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old?.id
            if (deletedId) {
              setNotifications((prev) => prev.filter((n) => n.id !== deletedId))
              setUnreadCount((prev) => Math.max(0, prev - 1))
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, fetchNotifications])

  // 3. Mark single notification as read (auto-clears from feed)
  async function markAsRead(notificationId) {
    if (!notificationId) return

    // Optimistic removal from active feed
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
    setUnreadCount((prev) => Math.max(0, prev - 1))

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

      if (error) throw error
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
      fetchNotifications()
    }
  }

  // 4. Mark all notifications as read (clears entire active feed)
  async function markAllAsRead() {
    if (!userId) return

    setNotifications([])
    setUnreadCount(0)

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('profile_id', userId)
        .eq('is_read', false)

      if (error) throw error
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err)
      fetchNotifications()
    }
  }

  // 5. Mark notifications related to a specific rescue request/job as read (e.g., when opening chat modal)
  async function markJobNotificationsAsRead(requestId, type = null) {
    if (!userId || !requestId) return

    // Optimistically remove matching notifications from feed
    setNotifications((prev) =>
      prev.filter((n) => {
        const nReqId = n.request_id || parseRequestIdFromBody(n.body || n.message)
        const matchesReq = nReqId === requestId
        const matchesType = type ? n.type === type : true
        return !(matchesReq && matchesType)
      })
    )
    setUnreadCount((prev) => {
      const remaining = notifications.filter((n) => {
        const nReqId = n.request_id || parseRequestIdFromBody(n.body || n.message)
        const matchesReq = nReqId === requestId
        const matchesType = type ? n.type === type : true
        return !(matchesReq && matchesType) && !n.is_read
      })
      return remaining.length
    })

    try {
      const supabase = createClient()
      let query = supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('profile_id', userId)
        .eq('is_read', false)

      if (requestId) {
        query = query.eq('request_id', requestId)
      }
      if (type) {
        query = query.eq('type', type)
      }

      const { error } = await query
      if (error) throw error
    } catch (err) {
      console.error('Failed to mark job notifications as read:', err)
    }
  }

  // Active items capped at MAX_NOTIFICATIONS_CAP (3)
  const activeNotifications = notifications.slice(0, MAX_NOTIFICATIONS_CAP)

  return {
    notifications: activeNotifications,
    rawNotifications: notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    markJobNotificationsAsRead,
    getNotificationHref,
    refetch: fetchNotifications,
  }
}
