import { api } from './axios'
import { Order, OrderStatus } from '../types'
import { PaginatedResponse } from './restaurant.api'

export interface InitiateOrderResponse {
  id: number;
  orderNumber: string;
  totalAmount: number;
  razorpayOrderId?: string;
  paymentMethod: string;
  status: OrderStatus;
}

const mapOrder = (order: any): Order => {
  if (!order) return order
  return {
    ...order,
    items: (order.items || []).map((item: any) => ({
      ...item,
      price: item.unitPrice,
    })),
  }
}

export const orderApi = {
  initiateOrder: async (data: {
    addressId: number;
    paymentMethod: string;
    couponCode?: string;
    specialInstructions?: string;
  }): Promise<InitiateOrderResponse> => {
    const mappedData = {
      ...data,
      paymentMethod: data.paymentMethod === 'ONLINE' ? 'RAZORPAY' : data.paymentMethod,
    }
    const response = await api.post('/api/orders/initiate', mappedData, { timeout: 10000 })
    const raw = response.data
    return {
      id: raw.orderId,
      orderNumber: raw.orderNumber,
      totalAmount: raw.amount,
      razorpayOrderId: raw.razorpayOrderId,
      paymentMethod: data.paymentMethod,
      status: 'PENDING',
    }
  },

  verifyPayment: async (data: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    orderId: number;
  }): Promise<Order> => {
    const response = await api.post('/api/orders/verify-payment', data, { timeout: 10000 })
    return mapOrder(response.data)
  },

  getOrders: async (params?: { page?: number; size?: number }): Promise<PaginatedResponse<Order>> => {
    const response = await api.get('/api/orders', { params })
    const data = response.data
    if (data && data.content) {
      data.content = data.content.map(mapOrder)
    }
    return data
  },

  getOrderById: async (id: number | string): Promise<Order> => {
    const response = await api.get(`/api/orders/${id}`)
    return mapOrder(response.data)
  },

  cancelOrder: async (id: number | string, data: { reason: string }): Promise<any> => {
    const response = await api.patch(`/api/orders/${id}/cancel`, data)
    return response.data
  },

  reorder: async (id: number | string): Promise<{ message: string }> => {
    const response = await api.post(`/api/orders/${id}/reorder`)
    return response.data
  },

  getOrderTracking: async (id: number | string): Promise<{
    status: OrderStatus;
    estimatedDeliveryAt: string;
    driver?: {
      name: string;
      phone: string;
      vehicleNumber?: string;
      vehicleType?: string;
      avgRating?: number;
      lat?: number;
      lng?: number;
    };
  }> => {
    const response = await api.get(`/api/orders/${id}/tracking`)
    return response.data
  },
}

