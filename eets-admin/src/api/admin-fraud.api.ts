import api from './axios';
import { ApiResponse, FraudFlagResponse, FraudAuditLog, PageResponse } from '../types/admin.types';

export const adminFraudApi = {
  getFlags: async (page: number = 0, size: number = 20, status?: string) => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('size', size.toString());
    if (status) {
      params.append('status', status);
    }
    const response = await api.get<ApiResponse<PageResponse<FraudFlagResponse>>>(`/api/admin/fraud?${params.toString()}`);
    return response.data;
  },

  updateFlagStatus: async (id: number, status: 'OPEN' | 'INVESTIGATED' | 'DISMISSED') => {
    const response = await api.patch<ApiResponse<{ status: string }>>(`/api/admin/fraud/${id}/status?status=${status}`);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get<ApiResponse<Record<string, any>>>('/api/admin/fraud/stats');
    return response.data;
  },

  blockUser: async (id: number, reason: string) => {
    const response = await api.post<ApiResponse<{ status: string }>>(`/api/admin/fraud/users/${id}/block`, {
      reason,
    });
    return response.data;
  },

  blockDriver: async (id: number, reason: string) => {
    const response = await api.post<ApiResponse<{ status: string }>>(`/api/admin/fraud/drivers/${id}/block`, {
      reason,
    });
    return response.data;
  },

  getThresholds: async () => {
    const response = await api.get<ApiResponse<Record<string, string>>>('/api/admin/fraud/thresholds');
    return response.data;
  },

  updateThresholds: async (thresholds: Record<string, string>) => {
    const response = await api.post<ApiResponse<{ status: string }>>('/api/admin/fraud/thresholds', thresholds);
    return response.data;
  },

  getAuditLogs: async (page: number = 0, size: number = 20) => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('size', size.toString());
    const response = await api.get<ApiResponse<PageResponse<FraudAuditLog>>>(`/api/admin/fraud/audit-logs?${params.toString()}`);
    return response.data;
  },
};
