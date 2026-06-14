import { api } from './axios'
import { Cart } from '../types'

const mapCart = (cart: any): Cart => {
  if (!cart) return cart
  return {
    ...cart,
    totalAmount: cart.total,
    items: (cart.items || []).map((item: any) => ({
      ...item,
      price: item.itemPrice,
    })),
  }
}

export const cartApi = {
  getCart: async (): Promise<Cart> => {
    const response = await api.get('/api/cart')
    return mapCart(response.data)
  },

  addToCart: async (data: { menuItemId: number; quantity: number; specialInstructions?: string }): Promise<Cart> => {
    const response = await api.post('/api/cart/items', data)
    return mapCart(response.data)
  },

  updateCartItem: async (itemId: number, data: { quantity: number }): Promise<Cart> => {
    const response = await api.put(`/api/cart/items/${itemId}`, data)
    return mapCart(response.data)
  },

  clearCart: async (): Promise<{ message: string }> => {
    const response = await api.delete('/api/cart')
    return response.data
  },

  applyCoupon: async (couponCode: string): Promise<Cart> => {
    const response = await api.post('/api/cart/coupon', { code: couponCode })
    return mapCart(response.data)
  },

  removeCoupon: async (): Promise<Cart> => {
    const response = await api.delete('/api/cart/coupon')
    return mapCart(response.data)
  },
}


