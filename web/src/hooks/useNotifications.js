// web/src/hooks/useNotifications.js
// Every user role gets real-time notifications.
// When a notification row is inserted for this user,
// it surfaces immediately in the UI.

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { NOTIFICATION_TYPE, USER_ROLE } from '@/lib/constants'

function getNotificationHref(notification, role) {
  if (!notification) return null

  const requestId = notification.request_id
  const userRole = role || USER_ROLE.DRIVER

  switch (notification.type) {
    case NOTIFICATION_TYPE.NEW_REQUEST:
      return requestId && userRole === USER_ROLE.MECHANIC ? `/dashboard/mechanic/job/${requestId}` : null
    case NOTIFICATION_TYPE.MECHANIC_BID:
    case NOTIFICATION_TYPE.BID_ACCEPTED:
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

  useEffect(() => {
    if (!userId) return

    const supabase = createClient()

    // load existing unread notifications on mount
    async function fetchNotifications() {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (data) {
        setNotifications(data)
        setUnreadCount(data.filter(n => !n.is_read).length)
      }
    }

    fetchNotifications()

    // subscribe to new notifications for this user only
    // filter by user_id so each user only gets their own events
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new
          setNotifications(prev => [newNotification, ...prev])
          setUnreadCount(prev => prev + 1)
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [userId])

  // mark a notification as read
  async function markAsRead(notificationId) {
    const supabase = createClient()
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)

    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  async function markAllAsRead() {
    const supabase = createClient()
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    getNotificationHref,
  }
}