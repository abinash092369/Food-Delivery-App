import { api } from './axios'
import { Coupon } from '../types'

export const couponApi = {
  getAvailableCoupons: async (): Promise<Coupon[]> => {
    const response = await api.get('/api/coupons')
    return response.data
  },

  validateCoupon: async (data: { code: string; cartTotal: number; restaurantId: number }): Promise<Coupon> => {
    const response = await api.post('/api/coupons/validate', data)
    return response.data
  },
}

