import { axiosInstance } from './axios';
import { ApiResponse, VendorEarningsResponse, PageResponse, ReviewResponse } from '../types/vendor.types';

export const vendorAnalyticsApi = {
  getEarnings: async (days: number = 30) => {
    const response = await axiosInstance.get<ApiResponse<VendorEarningsResponse>>(`/api/vendor/analytics/earnings?days=${days}`);
    return response.data;
  },

  getReviews: async (page: number = 0, size: number = 20) => {
    const response = await axiosInstance.get<ApiResponse<PageResponse<ReviewResponse>>>(`/api/vendor/reviews?page=${page}&size=${size}`);
    return response.data;
  },
};
