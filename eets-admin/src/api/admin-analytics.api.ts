import api from './axios';
import {
  ApiResponse,
  AdminDashboardMetrics,
  RevenueAnalyticsResponse,
  OrderAnalyticsResponse,
  UserAnalyticsResponse,
  HeatmapCell,
} from '../types/admin.types';

export const adminAnalyticsApi = {
  getDashboardMetrics: async () => {
    const response = await api.get<ApiResponse<AdminDashboardMetrics>>('/api/admin/analytics/dashboard');
    return response.data;
  },

  getRevenueAnalytics: async (days: number = 30) => {
    const response = await api.get<ApiResponse<RevenueAnalyticsResponse>>(`/api/admin/analytics/revenue?days=${days}`);
    return response.data;
  },

  getOrderAnalytics: async (days: number = 30) => {
    const response = await api.get<ApiResponse<OrderAnalyticsResponse>>(`/api/admin/analytics/orders?days=${days}`);
    return response.data;
  },

  getUserAnalytics: async (days: number = 30) => {
    const response = await api.get<ApiResponse<UserAnalyticsResponse>>(`/api/admin/analytics/users?days=${days}`);
    return response.data;
  },

  getHeatmap: async () => {
    const response = await api.get<ApiResponse<HeatmapCell[]>>('/api/admin/analytics/heatmap');
    return response.data;
  },
};
