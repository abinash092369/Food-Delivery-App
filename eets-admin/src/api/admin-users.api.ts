import api from './axios';
import { ApiResponse, AdminUserResponse, PageResponse } from '../types/admin.types';

export const adminUsersApi = {
  getUsers: async (page: number = 0, size: number = 20, role?: string, q?: string) => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('size', size.toString());
    if (role) {
      params.append('role', role);
    }
    if (q) {
      params.append('q', q);
    }
    const response = await api.get<ApiResponse<PageResponse<AdminUserResponse>>>(`/api/admin/users?${params.toString()}`);
    return response.data;
  },

  getUser: async (id: number) => {
    const response = await api.get<ApiResponse<AdminUserResponse>>(`/api/admin/users/${id}`);
    return response.data;
  },

  updateUser: async (id: number, data: { name?: string; email?: string; isActive?: boolean }) => {
    const response = await api.put<ApiResponse<AdminUserResponse>>(`/api/admin/users/${id}`, data);
    return response.data;
  },

  banUser: async (id: number, reason: string) => {
    const response = await api.patch<ApiResponse<{ status: string }>>(`/api/admin/users/${id}/ban`, {
      reason,
    });
    return response.data;
  },
};
