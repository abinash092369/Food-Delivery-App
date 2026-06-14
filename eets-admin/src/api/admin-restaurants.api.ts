import api from './axios';
import { ApiResponse, RestaurantDetailResponse, PageResponse, MenuResponse } from '../types/admin.types';

export const adminRestaurantsApi = {
  getRestaurants: async (page: number = 0, size: number = 20, q?: string) => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('size', size.toString());
    if (q) {
      params.append('q', q);
    }
    const response = await api.get<ApiResponse<PageResponse<RestaurantDetailResponse>>>(`/api/admin/restaurants?${params.toString()}`);
    return response.data;
  },

  getPendingRestaurants: async () => {
    const response = await api.get<ApiResponse<RestaurantDetailResponse[]>>('/api/admin/restaurants/pending');
    return response.data;
  },

  approveRestaurant: async (id: number) => {
    const response = await api.patch<ApiResponse<{ status: string }>>(`/api/admin/restaurants/${id}/approve`);
    return response.data;
  },

  rejectRestaurant: async (id: number, reason: string) => {
    const response = await api.patch<ApiResponse<{ status: string }>>(`/api/admin/restaurants/${id}/reject`, {
      reason,
    });
    return response.data;
  },

  updateRestaurantStatus: async (id: number, active: boolean) => {
    const response = await api.patch<ApiResponse<{ status: string }>>(`/api/admin/restaurants/${id}/status`, {
      status: active ? 'ACTIVE' : 'INACTIVE',
    });
    return response.data;
  },

  getRestaurantBySlug: async (slug: string) => {
    const response = await api.get<ApiResponse<RestaurantDetailResponse>>(`/api/restaurants/${slug}`);
    return response.data;
  },

  getRestaurantMenu: async (slug: string) => {
    const response = await api.get<ApiResponse<MenuResponse>>(`/api/restaurants/${slug}/menu`);
    return response.data;
  },
};

