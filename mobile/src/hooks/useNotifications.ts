import { useState, useCallback } from 'react'
import api from '../lib/api'
import type { Notification, NotificationsResponse } from '../types'

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchNotifications = useCallback(async (page = 1) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await api.get<NotificationsResponse>('/api/notifications', {
        params: { page, limit: 20 },
      })
      setNotifications(res.data.notifications ?? [])
      setUnreadCount(res.data.unreadCount ?? 0)
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Errore nel caricamento delle notifiche.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const markRead = useCallback(async (id: string) => {
    try {
      await api.patch('/api/notifications', { id })
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch {
      // ignore
    }
  }, [])

  const markAllRead = useCallback(async () => {
    try {
      await api.patch('/api/notifications', { markAll: true })
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch {
      // ignore
    }
  }, [])

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    markRead,
    markAllRead,
  }
}
