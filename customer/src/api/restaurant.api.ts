import { api } from './axios'
import { Restaurant, MenuResponse } from '../types'

export interface GetRestaurantsParams {
  page?: number;
  size?: number;
  cuisineType?: string;
  city?: string;
  sortBy?: string;
  lat?: number;
  lng?: number;
}

export interface PaginatedResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export const restaurantApi = {
  getRestaurants: async (params: GetRestaurantsParams): Promise<PaginatedResponse<Restaurant>> => {
    const response = await api.get('/api/restaurants', { params })
    return response.data
  },

  getRestaurantBySlug: async (slug: string): Promise<Restaurant> => {
    const response = await api.get(`/api/restaurants/${slug}`)
    return response.data
  },

  getRestaurantMenu: async (slug: string): Promise<MenuResponse> => {
    const response = await api.get(`/api/restaurants/${slug}/menu`)
    return response.data
  },

  getRestaurantMenuFallback: async (id: string): Promise<MenuResponse> => {
    const response = await api.get(`/api/menu/restaurant/${id}`)
    return response.data
  },
}
