import axios from 'axios';
import { useDriverAuthStore } from '../store/driver-auth.store';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token if present in store
axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = useDriverAuthStore.getState().accessToken;
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Catch 401 and trigger logout/redirect
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear auth state
      useDriverAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);
export default axiosInstance;
