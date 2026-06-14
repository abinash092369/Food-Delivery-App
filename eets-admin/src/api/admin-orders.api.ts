import api from './axios';
import { ApiResponse, OrderResponse, PageResponse } from '../types/admin.types';

export const adminOrdersApi = {
  getOrders: async (page: number = 0, size: number = 20, status?: string) => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('size', size.toString());
    if (status) {
      params.append('status', status);
    }
    const response = await api.get<ApiResponse<PageResponse<OrderResponse>>>(`/api/admin/orders?${params.toString()}`);
    return response.data;
  },

  getOrder: async (id: number) => {
    const response = await api.get<ApiResponse<OrderResponse>>(`/api/admin/orders/${id}`);
    return response.data;
  },

  refundOrder: async (id: number, amount: number, reason: string) => {
    const response = await api.post<ApiResponse<{ status: string; message?: string }>>(`/api/admin/orders/${id}/refund`, {
      amount,
      reason,
    });
    return response.data;
  },

  updateNotes: async (id: number, adminNotes: string) => {
    const response = await api.patch<ApiResponse<OrderResponse>>(`/api/admin/orders/${id}/notes`, {
      adminNotes,
    });
    return response.data;
  },
};
