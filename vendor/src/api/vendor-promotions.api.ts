import { axiosInstance } from './axios';
import { ApiResponse, PromotionResponse } from '../types/vendor.types';

export interface PromotionRequest {
  type: 'PERCENTAGE' | 'FLAT';
  value: number;
  minOrder: number;
  applicableTo: 'ALL' | 'CATEGORY' | 'ITEM';
  applicableId?: number | null;
  bannerUrl?: string;
  usageLimit?: number | null;
  validFrom: string; // ISO DateTime
  validUntil: string; // ISO DateTime
}

export const vendorPromotionsApi = {
  getPromotions: async () => {
    const response = await axiosInstance.get<ApiResponse<PromotionResponse[]>>('/api/vendor/promotions');
    return response.data;
  },

  addPromotion: async (req: PromotionRequest) => {
    const response = await axiosInstance.post<ApiResponse<PromotionResponse>>('/api/vendor/promotions', req);
    return response.data;
  },

  deletePromotion: async (id: number) => {
    const response = await axiosInstance.delete<ApiResponse<{ status: string }>>(`/api/vendor/promotions/${id}`);
    return response.data;
  },
};
