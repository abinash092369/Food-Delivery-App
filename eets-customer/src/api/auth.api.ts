import { api } from './axios'
import { AuthTokens, User } from '../types'

export const authApi = {
  register: async (data: any): Promise<AuthTokens & { user: User }> => {
    const response = await api.post('/api/auth/register', data)
    return response.data
  },

  login: async (data: any): Promise<AuthTokens & { user: User }> => {
    const response = await api.post('/api/auth/login', data)
    return response.data
  },

  sendOtp: async (data: { phone: string; countryCode: string }): Promise<{ message: string }> => {
    const response = await api.post('/api/auth/otp/send', data)
    return response.data
  },

  verifyOtp: async (data: { phone: string; countryCode: string; otp: string }): Promise<AuthTokens & { user: User }> => {
    const response = await api.post('/api/auth/otp/verify', data)
    return response.data
  },

  googleLogin: async (data: { idToken: string }): Promise<AuthTokens & { user: User }> => {
    const response = await api.post('/api/auth/google', data)
    return response.data
  },

  refresh: async (): Promise<AuthTokens> => {
    const response = await api.post('/api/auth/refresh')
    return response.data
  },

  logout: async (): Promise<{ message: string }> => {
    const response = await api.post('/api/auth/logout')
    return response.data
  },

  forgotPassword: async (data: { email: string }): Promise<{ message: string }> => {
    const response = await api.post('/api/auth/forgot-password', data)
    return response.data
  },

  resetPassword: async (data: any): Promise<{ message: string }> => {
    const response = await api.post('/api/auth/reset-password', data)
    return response.data
  },
}

