import api from './axios';
import { ApiResponse, AdminUserResponse } from '../types/admin.types';

export interface LoginResponse {
  accessToken: string;
  user: AdminUserResponse;
  isNewUser?: boolean;
}

export const adminAuthApi = {
  login: async (credentials: Record<string, string>) => {
    const response = await api.post<ApiResponse<LoginResponse>>('/api/admin/auth/login', credentials);
    return response.data;
  },
};
