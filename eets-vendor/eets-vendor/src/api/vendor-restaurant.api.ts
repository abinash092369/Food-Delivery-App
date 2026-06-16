import { axiosInstance } from './axios';
import { ApiResponse, RestaurantDetailResponse } from '../types/vendor.types';

export interface RestaurantUpdateRequest {
  name?: string;
  description?: string;
  cuisineTypes?: string[];
  coverImageUrl?: string;
  logoUrl?: string;
  addressLine?: string;
  city?: string;
  state?: string;
  pincode?: string;
  lat?: number;
  lng?: number;
  minOrderAmount?: number;
  deliveryTimeMin?: number;
  deliveryFee?: number;
  openingTime?: string; // "HH:mm:ss" or "HH:mm"
  closingTime?: string; // "HH:mm:ss" or "HH:mm"
  daysOpen?: number[];
  isOpen?: boolean;
}

export const vendorRestaurantApi = {
  getRestaurant: async () => {
    const response = await axiosInstance.get<ApiResponse<RestaurantDetailResponse>>('/api/vendor/restaurant');
    return response.data;
  },

  updateRestaurant: async (req: RestaurantUpdateRequest) => {
    const response = await axiosInstance.put<ApiResponse<RestaurantDetailResponse>>('/api/vendor/restaurant', req);
    return response.data;
  },

  setStatus: async (isOpen: boolean) => {
    const response = await axiosInstance.patch<ApiResponse<{ isOpen: boolean }>>('/api/vendor/restaurant/status', { isOpen });
    return response.data;
  },
};
