'use client'

import { useState, useEffect, useCallback } from 'react'
import { userNotificationAPI } from '@/services/api'
import { UserLayout } from '@/components/layout/UserLayout'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  Bell, BellRing, Package, Wrench, CreditCard, Info,
  CheckCheck, Loader2, Inbox,
} from 'lucide-react'

interface NotificationData {
  _id: string
  title: string
  message: string
  type: string
  priority?: string
  actionUrl?: string
  imageUrl?: string
  createdAt: string
  sentAt?: string
}

interface UserNotificationItem {
  _id: string
  notification: NotificationData
  isRead: boolean
  readAt?: string
  createdAt: string
}

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} day${days !== 1 ? 's' : ''} ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} month${months !== 1 ? 's' : ''} ago`
  const years = Math.floor(months / 12)
  return `${years} year${years !== 1 ? 's' : ''} ago`
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'order':
      return Package
    case 'service':
      return Wrench
    case 'payment':
      return CreditCard
    default:
      return Info
  }
}

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<UserNotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [markingAll, setMarkingAll] = useState(false)
  const [markingId, setMarkingId] = useState<string | null>(null)

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const [notifRes, countRes] = await Promise.all([
        userNotificationAPI.getAll({ page: 1, limit: 50 }),
        userNotificationAPI.getUnreadCount(),
      ])
      if (notifRes.data.success) {
        const items = notifRes.data.data || []
        // Filter out entries where the notification was deleted
        setNotifications(items.filter((item: UserNotificationItem) => item.notification))
      }
      if (countRes.data.success) {
        setUnreadCount(countRes.data.data.count)
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const handleMarkAsRead = async (userNotifId: string, notificationId: string) => {
    const item = notifications.find(n => n._id === userNotifId)
    if (!item || item.isRead) return

    setMarkingId(userNotifId)
    try {
      await userNotificationAPI.markAsRead(notificationId)
      setNotifications(prev =>
        prev.map(n => (n._id === userNotifId ? { ...n, isRead: true } : n))
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Failed to mark as read:', err)
      toast.error('Failed to mark notification as read')
    } finally {
      setMarkingId(null)
    }
  }

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return
    setMarkingAll(true)
    try {
      await userNotificationAPI.markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
      toast.success('All notifications marked as read')
    } catch (err) {
      console.error('Failed to mark all as read:', err)
      toast.error('Failed to mark all as read')
    } finally {
      setMarkingAll(false)
    }
  }

  if (loading) {
    return (
      <UserLayout>
        <div className="container mx-auto px-4 py-8 max-w-3xl animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6" />
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 bg-gray-200 rounded-xl mb-3" />
          ))}
        </div>
      </UserLayout>
    )
  }

  return (
    <UserLayout>
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Notifications</h1>
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center h-6 min-w-[24px] px-2 rounded-full bg-[#FF6B35] text-white text-xs font-bold">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={markingAll}
            >
              {markingAll ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <CheckCheck className="h-4 w-4 mr-1" />
              )}
              Mark All Read
            </Button>
          )}
        </div>

        {/* Notification List */}
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Inbox className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">No notifications</h3>
            <p className="text-sm text-muted-foreground">
              You&apos;re all caught up! We&apos;ll notify you when something happens.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(item => {
              const notif = item.notification
              const Icon = getNotificationIcon(notif.type)
              const isMarking = markingId === item._id

              return (
                <button
                  key={item._id}
                  onClick={() => handleMarkAsRead(item._id, notif._id)}
                  disabled={isMarking}
                  className={`w-full text-left rounded-xl border p-4 transition-colors ${
                    item.isRead
                      ? 'bg-white hover:bg-gray-50'
                      : 'bg-blue-50/60 border-l-4 border-l-[#1B3B6F] hover:bg-blue-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`h-10 w-10 shrink-0 rounded-lg flex items-center justify-center ${
                        item.isRead ? 'bg-gray-100' : 'bg-[#1B3B6F]/10'
                      }`}
                    >
                      {isMarking ? (
                        <Loader2 className="h-5 w-5 animate-spin text-[#1B3B6F]" />
                      ) : (
                        <Icon
                          className={`h-5 w-5 ${
                            item.isRead ? 'text-gray-500' : 'text-[#1B3B6F]'
                          }`}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3
                          className={`text-sm truncate ${
                            item.isRead ? 'font-medium text-gray-700' : 'font-semibold text-foreground'
                          }`}
                        >
                          {notif.title}
                        </h3>
                        <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                          {timeAgo(notif.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                        {notif.message}
                      </p>
                    </div>
                    {!item.isRead && (
                      <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#FF6B35] mt-1.5" />
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </UserLayout>
  )
}
