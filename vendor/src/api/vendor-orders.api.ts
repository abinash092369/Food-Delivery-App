import { axiosInstance } from './axios';
import { ApiResponse, OrderResponse, PageResponse } from '../types/vendor.types';

export const vendorOrdersApi = {
  getOrders: async (page: number = 0, size: number = 50) => {
    const response = await axiosInstance.get<ApiResponse<PageResponse<OrderResponse>>>(`/api/vendor/orders?page=${page}&size=${size}`);
    return response.data;
  },

  updateOrderStatus: async (id: number, status: string) => {
    console.log(`[API Request] PATCH /api/vendor/orders/${id}/status | Payload:`, { status });
    try {
      const response = await axiosInstance.patch<ApiResponse<OrderResponse>>(`/api/vendor/orders/${id}/status`, { status });
      console.log(`[API Response] Success | Status: ${response.status} | Payload:`, response.data);
      return response.data;
    } catch (error: any) {
      console.error(`[API Response] Error | Status: ${error.response?.status} | Payload:`, error.response?.data);
      throw error;
    }
  },

  rejectOrder: async (id: number, reason: string) => {
    console.log(`[API Request] PATCH /api/vendor/orders/${id}/reject | Payload:`, { reason });
    try {
      const response = await axiosInstance.patch<ApiResponse<OrderResponse>>(`/api/vendor/orders/${id}/reject`, { reason });
      console.log(`[API Response] Success | Status: ${response.status} | Payload:`, response.data);
      return response.data;
    } catch (error: any) {
      console.error(`[API Response] Error | Status: ${error.response?.status} | Payload:`, error.response?.data);
      throw error;
    }
  },
};
