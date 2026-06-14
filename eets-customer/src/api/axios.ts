import axios from 'axios'
import { useAuthStore } from '../store/auth.store'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to attach bearer token
api.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState()
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

let isRefreshing = false
let failedRequestsQueue: Array<{
  resolve: (token: string | null) => void;
  reject: (err: any) => void;
}> = []

const processQueue = (error: any, token: string | null = null) => {
  failedRequestsQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedRequestsQueue = []
}

// Response interceptor to handle ApiResponse unpacking and token refresh on 401
api.interceptors.response.use(
  (response) => {
    // Unpack Spring Boot standard ApiResponse wrapper
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      if (response.data.success) {
        response.data = response.data.data
      } else {
        const errorMsg = response.data.error?.message || response.data.message || 'API Error'
        return Promise.reject(new Error(errorMsg))
      }
    }
    return response
  },
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise<string | null>((resolve, reject) => {
          failedRequestsQueue.push({ resolve, reject })
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`
            }
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const { logout, setTokens } = useAuthStore.getState()

      try {
        // Post with credentials so the refresh cookie is sent
        const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {}, {
          withCredentials: true,
        })
        
        // Extract from ApiResponse wrapper
        const data = response.data?.data || response.data
        const newAccessToken = data?.accessToken
        
        if (!newAccessToken) {
          throw new Error('Refresh token invalid or missing access token in response')
        }

        setTokens(newAccessToken, '')
        
        processQueue(null, newAccessToken)
        
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        }
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        logout()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)
export default api

