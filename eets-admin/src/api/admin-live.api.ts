import api from './axios';
import { ApiResponse, OrderResponse } from '../types/admin.types';

export const adminLiveApi = {
  getLiveOrders: async () => {
    const response = await api.get<ApiResponse<OrderResponse[]>>('/api/admin/live/orders');
    return response.data;
  },
};
