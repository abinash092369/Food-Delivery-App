import { axiosInstance } from './axios';
import { ApiResponse, ReviewResponse } from '../types/vendor.types';

export const vendorReviewsApi = {
  replyToReview: async (reviewId: number, replyText: string) => {
    const response = await axiosInstance.post<ApiResponse<ReviewResponse>>(`/api/vendor/reviews/${reviewId}/reply`, { replyText });
    return response.data;
  },
};
