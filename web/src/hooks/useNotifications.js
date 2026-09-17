// web/src/hooks/useNotifications.js
// Every user role gets real-time notifications.
// When a notification row is inserted for this user,
// it surfaces immediately in the UI.

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { NOTIFICATION_TYPE, USER_ROLE } from '@/lib/constants'

function parseRequestIdFromBody(body) {
  if (!body) return null
  const match = body.match(/\[req_id:\s*([a-f0-9-]{36})\]/i)
  return match ? match[1] : null
}

function cleanNotificationMessage(message) {
  if (!message) return ''
  return message.replace(/\[req_id:\s*[a-f0-9-]{36}\]/i, '').trim()
}

function getNotificationHref(notification, role) {
  if (!notification) return null

  const requestId = notification.request_id || parseRequestIdFromBody(notification.body || notification.message)
  const userRole = role || USER_ROLE.DRIVER

  switch (notification.type) {
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

  useEffect(() => {
    if (!userId) return

    const supabase = createClient()

    // load existing unread notifications on mount
    async function fetchNotifications() {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        // New schema: notifications uses profile_id (not user_id)
        .eq('profile_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (data) {
        const mapped = data.map(n => ({
          ...n,
          message: cleanNotificationMessage(n.body)
        }))
        setNotifications(mapped)
        setUnreadCount(mapped.filter(n => !n.is_read).length)
      }
    }

    fetchNotifications()

    // subscribe to new notifications for this user only
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
         'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          // New schema: notifications uses profile_id (not user_id)
          filter: `profile_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new
          const mapped = {
            ...newNotification,
            message: cleanNotificationMessage(newNotification.body)
          }
          setNotifications(prev => [mapped, ...prev])
          setUnreadCount(prev => prev + 1)
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [userId])

  // mark a notification as read with optimistic update
  async function markAsRead(notificationId) {
    if (!notificationId) return

    // Optimistic update
    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, is_read: true } : n))
    )
    setUnreadCount(prev => Math.max(0, prev - 1))

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

      if (error) throw error
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
      // Rollback on error: re-fetch state
      const supabase = createClient()
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('profile_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (data) {
        const mapped = data.map(n => ({
          ...n,
          message: cleanNotificationMessage(n.body)
        }))
        setNotifications(mapped)
        setUnreadCount(mapped.filter(n => !n.is_read).length)
      }
    }
  }

  // mark all notifications as read with optimistic update
  async function markAllAsRead() {
    if (!userId) return

    const previousNotifications = notifications
    const previousUnreadCount = unreadCount

    // 1. Optimistically update state immediately
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)

    try {
      // 2. Execute database mutation
      const supabase = createClient()
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('profile_id', userId)
        .eq('is_read', false)

      if (error) throw error
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err)
      // Rollback on failure
      setNotifications(previousNotifications)
      setUnreadCount(previousUnreadCount)
    }
  }

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    getNotificationHref,
  }
}

