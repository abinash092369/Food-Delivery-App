import { api } from './axios'
import { Notification } from '../types'

export const notificationApi = {
  getNotifications: async (): Promise<Notification[]> => {
    const response = await api.get('/api/notifications')
    // Extract content from page wrapper
    const data = response.data
    return data && typeof data === 'object' && 'content' in data ? (data as any).content : []
  },

  getUnreadCount: async (): Promise<{ count: number }> => {
    const response = await api.get('/api/notifications/unread')
    const totalElements = response.data && typeof response.data === 'object' && 'totalElements' in response.data 
      ? (response.data as any).totalElements 
      : 0
    return { count: totalElements }
  },

  markAsRead: async (id: number): Promise<any> => {
    const response = await api.patch(`/api/notifications/${id}/read`)
    return response.data
  },

  markAllAsRead: async (): Promise<{ message: string }> => {
    const response = await api.patch('/api/notifications/read-all')
    return response.data
  },

  saveDeviceToken: async (data: { token: string; platform: 'web' | 'android' | 'ios' }): Promise<{ message: string }> => {
    const response = await api.post('/api/notifications/device-token', data)
    return response.data
  },
}

