import { axiosInstance } from './axios';
import { ApiResponse, User, GoogleVendorAuthResponse } from '../types/vendor.types';

export interface LoginRequest {
  email: string;
  password?: string;
  otp?: string; // in case OTP auth is supported, but standard is email/password
}

export interface LoginResponse {
  accessToken: string;
  user: User;
  isNewUser?: boolean;
}

export interface VendorRegisterRequest {
  name: string;
  email: string;
  password?: string;
  phone: string;
  restaurantName: string;
  description?: string;
  cuisineTypes: string[];
  coverImageUrl?: string;
  logoUrl?: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  lat: number;
  lng: number;
  fssaiLicense: string;
  gstNumber?: string;
}

export const vendorAuthApi = {
  login: async (req: LoginRequest) => {
    const response = await axiosInstance.post<ApiResponse<LoginResponse>>('/api/vendor/auth/login', req);
    return response.data;
  },

  register: async (req: VendorRegisterRequest) => {
    const response = await axiosInstance.post<ApiResponse<{ token: string; user: User }>>('/api/vendor/auth/register', req);
    return response.data;
  },

  googleLogin: async (req: { credential: string }) => {
    const response = await axiosInstance.post<ApiResponse<GoogleVendorAuthResponse>>('/api/auth/google/vendor', req);
    return response.data;
  },
};
