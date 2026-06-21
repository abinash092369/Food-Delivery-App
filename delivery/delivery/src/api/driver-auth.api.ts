import axiosInstance from './axios';
import { AuthResponse, VehicleType } from '../types/driver.types';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface RegisterDriverRequest {
  name: string;
  phone: string;
  email: string;
  dob: string;
  vehicleType: VehicleType;
  vehicleMake: string;
  vehicleModel: string;
  vehicleRegNumber: string;
  aadhaarFrontUrl: string;
  aadhaarBackUrl: string;
  licenseUrl: string;
  rcUrl: string;
  selfieUrl: string;
  bankAccountNumber: string;
  bankIfsc: string;
  upiId?: string;
}

export const driverAuthApi = {
  sendOtp: async (phone: string, countryCode: string = '+91') => {
    const response = await axiosInstance.post<ApiResponse<{ status: string }>>(
      '/api/driver/auth/otp/send',
      { phone, countryCode }
    );
    return response.data;
  },

  verifyOtp: async (phone: string, otp: string, countryCode: string = '+91') => {
    const response = await axiosInstance.post<ApiResponse<AuthResponse>>(
      '/api/driver/auth/otp/verify',
      { phone, otp, countryCode }
    );
    return response.data;
  },

  register: async (req: RegisterDriverRequest) => {
    const response = await axiosInstance.post<ApiResponse<{ userId: number; driverId: number; accessToken?: string; message: string }>>(
      '/api/driver/auth/register',
      req
    );
    return response.data;
  },
};
