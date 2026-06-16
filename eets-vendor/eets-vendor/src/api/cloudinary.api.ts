import { axiosInstance } from './axios';
import { ApiResponse } from '../types/vendor.types';

export interface CloudinarySignRequest {
  folder: string;
  publicId?: string;
  uploadPreset?: string;
  extraParams?: Record<string, string>;
}

export interface CloudinarySignResponse {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
  publicId?: string;
  uploadPreset?: string;
  params: Record<string, string>;
}

export const cloudinaryApi = {
  signUpload: async (req: CloudinarySignRequest) => {
    const response = await axiosInstance.post<ApiResponse<CloudinarySignResponse>>('/api/cloudinary/sign-upload', req);
    return response.data;
  },
};
