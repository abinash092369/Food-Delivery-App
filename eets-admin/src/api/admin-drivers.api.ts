import api from './axios';
import { ApiResponse, DriverProfileResponse, PageResponse } from '../types/admin.types';

export const adminDriversApi = {
  getDrivers: async (page: number = 0, size: number = 20) => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('size', size.toString());
    const response = await api.get<ApiResponse<PageResponse<DriverProfileResponse>>>(`/api/admin/drivers?${params.toString()}`);
    return response.data;
  },

  verifyDriver: async (id: number) => {
    const response = await api.patch<ApiResponse<{ status: string }>>(`/api/admin/drivers/${id}/verify`);
    return response.data;
  },

  rejectDriver: async (id: number) => {
    const response = await api.patch<ApiResponse<{ status: string }>>(`/api/admin/drivers/${id}/reject`);
    return response.data;
  },
};
