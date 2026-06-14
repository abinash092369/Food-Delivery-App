import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationApi } from '../../api/notification.api'
import { Bell, Loader2, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'

export const NotificationsPage: React.FC = () => {
  const queryClient = useQueryClient()

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.getNotifications(),
  })

  const markRead = useMutation({
    mutationFn: (id: number) => notificationApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] })
    },
  })

  const markAllRead = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] })
      toast.success('All notifications marked as read')
    },
  })

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-sm font-semibold text-mutedColor">Loading notifications...</span>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-bold text-mutedColor hover:text-primary mb-8">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Home</span>
      </Link>

      <div className="flex items-center justify-between mb-8 pb-3 border-b border-gray-100">
        <h1 className="font-heading text-3xl font-extrabold text-textMain flex items-center gap-3">
          <Bell className="w-8 h-8 text-primary" />
          <span>Notifications</span>
        </h1>
        {notifications && notifications.length > 0 && (
          <button
            onClick={() => markAllRead.mutate()}
            type="button"
            className="text-xs text-primary font-bold hover:underline"
          >
            Mark all as read
          </button>
        )}
      </div>

      {notifications && notifications.length > 0 ? (
        <div className="space-y-4">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => !notif.isRead && markRead.mutate(notif.id)}
              className={`p-5 rounded-2xl border flex gap-4 transition-colors ${
                notif.isRead
                  ? 'border-gray-100 bg-white text-gray-500'
                  : 'border-primary/20 bg-primary-light/10 text-textMain cursor-pointer hover:bg-primary-light/20'
              }`}
            >
              <div className={`mt-0.5 ${notif.isRead ? 'text-gray-400' : 'text-primary'}`}>
                <Bell className="w-4 h-4 fill-current" />
              </div>
              <div className="flex-1 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <strong className="font-bold">{notif.title}</strong>
                  <span className="text-[10px] text-mutedColor font-medium">
                    {new Date(notif.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs mt-1 leading-relaxed">{notif.message}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white border border-gray-100 rounded-2xl shadow-sm">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4 stroke-1" />
          <h4 className="font-heading font-bold text-textMain mb-1">All Caught Up</h4>
          <p className="text-sm text-mutedColor">No notifications at this time.</p>
        </div>
      )}
    </div>
  )
}
export default NotificationsPage
