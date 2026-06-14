import { api } from './axios'
import { User, Address, Restaurant, NotificationPreferences } from '../types'

const normalizeAddress = (addr: any) => {
  let label = 'OTHER'
  const inputLabel = String(addr.label || '').trim().toUpperCase()
  if (inputLabel === 'HOME') {
    label = 'HOME'
  } else if (inputLabel === 'WORK' || inputLabel === 'OFFICE' || inputLabel === 'JOB') {
    label = 'WORK'
  }
  return {
    ...addr,
    label,
  }
}

export const userApi = {
  getMe: async (): Promise<User> => {
    console.log('[CUSTOMER_PROFILE_GET]')
    const response = await api.get('/api/users/me')
    const data = response.data
    const phoneNumber = data.phoneNumber || data.phone || data.mobile || data.mobileNumber || ""
    console.log('[CUSTOMER_PHONE_NORMALIZED]', phoneNumber)
    return {
      ...data,
      phone: phoneNumber
    }
  },

  updateMe: async (data: { name: string; phone: string; avatarUrl?: string; email?: string; toastMessage?: string }): Promise<User> => {
    const mapped = {
      name: data.name,
      email: data.email,
      profileImageUrl: data.avatarUrl,
      phone: data.phone,
    }
    console.log('[CUSTOMER_PROFILE_UPDATE_PAYLOAD]', mapped)
    const response = await api.put('/api/users/me', mapped)
    console.log('[CUSTOMER_PROFILE_UPDATE_RESPONSE]', response.data)
    const respData = response.data
    const phoneNumber = respData.phoneNumber || respData.phone || respData.mobile || respData.mobileNumber || ""
    console.log('[CUSTOMER_PHONE_NORMALIZED]', phoneNumber)
    return {
      ...respData,
      phone: phoneNumber
    }
  },

  getAddresses: async (): Promise<Address[]> => {
    const response = await api.get('/api/users/me/addresses')
    return response.data
  },

  addAddress: async (data: Omit<Address, 'id'>): Promise<Address> => {
    const response = await api.post('/api/users/me/addresses', normalizeAddress(data))
    return response.data
  },

  updateAddress: async (id: number, data: Partial<Omit<Address, 'id'>>): Promise<Address> => {
    const response = await api.put(`/api/users/me/addresses/${id}`, normalizeAddress(data))
    return response.data
  },

  deleteAddress: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/api/users/me/addresses/${id}`)
    return response.data
  },

  getFavorites: async (): Promise<Restaurant[]> => {
    const response = await api.get('/api/users/me/favorites')
    const favIds: number[] = response.data?.restaurants || []
    if (favIds.length === 0) return []
    
    // Fetch restaurants page with size 100 to map detailed objects
    const listResponse = await api.get('/api/restaurants', { params: { size: 100 } })
    const allRestaurants: any = listResponse.data?.content || []
    return allRestaurants.filter((r: any) => favIds.includes(r.id))
  },

  toggleFavorite: async (restaurantId: number): Promise<{ message: string }> => {
    const response = await api.post('/api/users/me/favorites', {
      type: 'RESTAURANT',
      referenceId: restaurantId,
    })
    return response.data
  },

  getNotificationPreferences: async (): Promise<NotificationPreferences> => {
    try {
      const response = await api.get('/api/users/me/notification-preferences')
      const data = response.data
      const normalized = {
        orderUpdatesEmail: data.email ?? data.orderUpdates ?? true,
        orderUpdatesSms: data.sms ?? true,
        promotionsEmail: data.promotions ?? true,
        promotionsPush: data.push ?? true
      }
      return normalized
    } catch (error) {
      console.error('[CUSTOMER_PREF_GET_FAILED]', error)
      const local = localStorage.getItem('customer_preferences')
      if (local) {
        try {
          const parsed = JSON.parse(local)
          return {
            orderUpdatesEmail: parsed.emailUpdates ?? true,
            orderUpdatesSms: parsed.smsUpdates ?? true,
            promotionsEmail: parsed.promotionalEmails ?? true,
            promotionsPush: parsed.promotionalPush ?? true
          }
        } catch (_) {}
      }
      return {
        orderUpdatesEmail: true,
        orderUpdatesSms: true,
        promotionsEmail: true,
        promotionsPush: true
      }
    }
  },

  updateNotificationPreferences: async (data: NotificationPreferences): Promise<NotificationPreferences> => {
    const payload = {
      push: data.promotionsPush ?? true,
      email: data.orderUpdatesEmail ?? true,
      sms: data.orderUpdatesSms ?? true,
      orderUpdates: data.orderUpdatesEmail ?? true,
      promotions: data.promotionsEmail ?? true
    }
    console.log('[CUSTOMER_PREF_UPDATE_PAYLOAD]', payload)

    const localObj = {
      emailUpdates: data.orderUpdatesEmail,
      smsUpdates: data.orderUpdatesSms,
      promotionalEmails: data.promotionsEmail
    }
    localStorage.setItem('customer_preferences', JSON.stringify(localObj))

    try {
      const response = await api.put('/api/users/me/notification-preferences', payload)
      console.log('[CUSTOMER_PREF_UPDATE_RESPONSE]', response.data)
      const respData = response.data
      return {
        orderUpdatesEmail: respData.email ?? respData.orderUpdates ?? true,
        orderUpdatesSms: respData.sms ?? true,
        promotionsEmail: respData.promotions ?? true,
        promotionsPush: respData.push ?? true
      }
    } catch (error) {
      console.error('[CUSTOMER_PREF_UPDATE_FAILED]', error)
      return data
    }
  },

  getCloudinarySignature: async (folder: string): Promise<{
    signature: string;
    timestamp: number;
    apiKey: string;
    cloudName: string;
    folder: string;
    uploadPreset: string;
  }> => {
    const response = await api.get('/api/cloudinary/upload-token', { params: { folder } })
    return response.data
  },
}

