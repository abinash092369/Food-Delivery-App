import axiosInstance from './axios';
import { ApiResponse } from './driver-auth.api';
import {
  DriverProfile,
  DeliveryAssignment,
  DriverEarnings,
} from '../types/driver.types';

export interface UpdateProfileRequest {
  name?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  upiId?: string;
}

export interface CloudinarySignResponse {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
  publicId?: string;
  uploadPreset?: string;
  responseParams: Record<string, string>;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export const driverApi = {
  getProfile: async () => {
    const response = await axiosInstance.get<ApiResponse<DriverProfile>>('/api/driver/profile');
    return response.data;
  },

  updateProfile: async (req: UpdateProfileRequest) => {
    const response = await axiosInstance.put<ApiResponse<DriverProfile>>('/api/driver/profile', req);
    return response.data;
  },

  toggleOnlineStatus: async (isOnline: boolean) => {
    const response = await axiosInstance.patch<ApiResponse<{ isOnline: boolean }>>(
      '/api/driver/status',
      { status: isOnline ? 'ONLINE' : 'OFFLINE' }
    );
    return response.data;
  },

  getCurrentAssignment: async () => {
    console.log('[DRIVER_API_CURRENT] [API Request] GET /api/driver/assignments/current');
    try {
      const response = await axiosInstance.get<ApiResponse<DeliveryAssignment | null>>(
        '/api/driver/assignments/current'
      );
      console.log('[DRIVER_API_CURRENT] [API Response] Success | GET /api/driver/assignments/current | Payload:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[DRIVER_API_CURRENT] [API Response] Error | GET /api/driver/assignments/current | Payload:', error.response?.data);
      throw error;
    }
  },

  getAvailableAssignments: async () => {
    console.log('[DRIVER_API_AVAILABLE] [API Request] GET /api/driver/assignments/available');
    try {
      const response = await axiosInstance.get<ApiResponse<DeliveryAssignment[]>>(
        '/api/driver/assignments/available'
      );
      console.log('[DRIVER_API_AVAILABLE] [API Response] Success | GET /api/driver/assignments/available | Payload:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[DRIVER_API_AVAILABLE] [API Response] Error | GET /api/driver/assignments/available | Payload:', error.response?.data);
      throw error;
    }
  },

  acceptAssignment: async (id: number) => {
    console.log(`[DRIVER_ASSIGNMENT_ACCEPT_REQUEST] [API Request] POST /api/driver/assignments/${id}/accept`);
    try {
      const response = await axiosInstance.post<ApiResponse<DeliveryAssignment>>(
        `/api/driver/assignments/${id}/accept`
      );
      console.log(`[DRIVER_ASSIGNMENT_ACCEPT_SUCCESS] [API Response] Success | POST /api/driver/assignments/${id}/accept | Payload:`, response.data);
      return response.data;
    } catch (error: any) {
      console.error(`[API Response] Error | POST /api/driver/assignments/${id}/accept | Payload:`, error.response?.data);
      throw error;
    }
  },

  rejectAssignment: async (id: number, reason: string) => {
    const response = await axiosInstance.post<ApiResponse<{ status: string }>>(
      `/api/driver/assignments/${id}/reject`,
      { reason }
    );
    return response.data;
  },

  updateAssignmentStatus: async (id: number, status: 'PICKED_UP' | 'DELIVERED', otp?: string) => {
    const response = await axiosInstance.patch<ApiResponse<DeliveryAssignment>>(
      `/api/driver/assignments/${id}/status`,
      { status, otp }
    );
    return response.data;
  },

  getHistory: async (page: number = 0, size: number = 20) => {
    const response = await axiosInstance.get<ApiResponse<PageResponse<DeliveryAssignment>>>(
      '/api/driver/history',
      { params: { page, size } }
    );
    return response.data;
  },

  getEarnings: async () => {
    const response = await axiosInstance.get<ApiResponse<DriverEarnings>>('/api/driver/earnings');
    return response.data;
  },

  getOrderDetails: async (orderId: number) => {
    const response = await axiosInstance.get<any>(`/api/orders/${orderId}`);
    return response.data;
  },

  signCloudinaryUpload: async (folder: string = 'driver-docs') => {
    const response = await axiosInstance.post<ApiResponse<CloudinarySignResponse>>(
      '/api/cloudinary/sign-upload',
      { folder }
    );
    return response.data;
  },
};
