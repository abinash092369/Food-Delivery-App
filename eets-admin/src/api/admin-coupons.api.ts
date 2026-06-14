import api from './axios';
import { ApiResponse, CouponResponse, PageResponse } from '../types/admin.types';

export interface CouponCreatePayload {
  code: string;
  type: 'PERCENTAGE' | 'FLAT' | 'FREE_DELIVERY' | 'BOGO';
  value: number;
  maxDiscount?: number;
  minOrderAmount?: number;
  usageLimitPerUser?: number;
  totalUsageLimit?: number;
  validFrom?: string;
  validUntil: string;
  applicableRestaurantId?: number;
}

export const adminCouponsApi = {
  getCoupons: async (page: number = 0, size: number = 100) => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('size', size.toString());
    const response = await api.get<ApiResponse<PageResponse<CouponResponse>>>(`/api/admin/coupons?${params.toString()}`);
    return response.data;
  },

  createCoupon: async (payload: CouponCreatePayload) => {
    const response = await api.post<ApiResponse<CouponResponse>>('/api/admin/coupons', payload);
    return response.data;
  },

  deleteCoupon: async (id: number) => {
    const response = await api.delete<ApiResponse<{ status: string }>>(`/api/admin/coupons/${id}`);
    return response.data;
  },
};
