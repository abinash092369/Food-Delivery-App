import { api } from './axios'
import { Restaurant, MenuItem } from '../types'

export interface SearchRestaurantsParams {
  q?: string;
  city?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  cuisineType?: string;
  sortBy?: string;
}

export const searchApi = {
  searchRestaurants: async (params: SearchRestaurantsParams): Promise<Restaurant[]> => {
    try {
      const mapped = {
        keyword: params.q || undefined,
        cuisine: params.cuisineType || undefined,
        lat: params.lat,
        lng: params.lng,
        city: params.city,
        sortBy: params.sortBy,
      }
      const response = await api.get('/api/search/restaurants', { params: mapped })
      const data = response.data
      if (Array.isArray(data)) return data
      if (data && typeof data === 'object') {
        if (Array.isArray(data.data)) return data.data
        if (data.data && Array.isArray(data.data.content)) return data.data.content
        if (Array.isArray(data.content)) return data.content
      }
      return []
    } catch (err) {
      console.error('searchRestaurants failed, returning empty array', err)
      return []
    }
  },

  searchMenuItems: async (q: string): Promise<MenuItem[]> => {
    try {
      const response = await api.get('/api/search/menu-items', { params: { keyword: q } })
      const data = response.data
      if (Array.isArray(data)) return data
      if (data && typeof data === 'object') {
        if (Array.isArray(data.data)) return data.data
        if (data.data && Array.isArray(data.data.content)) return data.data.content
        if (Array.isArray(data.content)) return data.content
      }
      return []
    } catch (err) {
      console.error('searchMenuItems failed, returning empty array', err)
      return []
    }
  },

  searchAll: async (q: string): Promise<{ restaurants: Restaurant[]; menuItems: MenuItem[] }> => {
    try {
      const response = await api.get('/api/search/all', { params: { keyword: q } })
      const data = response.data
      if (data && typeof data === 'object') {
        return {
          restaurants: Array.isArray(data.restaurants) ? data.restaurants : (data.data?.restaurants || []),
          menuItems: Array.isArray(data.menuItems) ? data.menuItems : (data.data?.menuItems || []),
        }
      }
      return { restaurants: [], menuItems: [] }
    } catch (err) {
      console.error('searchAll failed, returning empty fallback object', err)
      return { restaurants: [], menuItems: [] }
    }
  },

  autocomplete: async (q: string): Promise<string[]> => {
    try {
      const response = await api.get('/api/search/autocomplete', { params: { keyword: q } })
      const data = response.data
      if (Array.isArray(data)) return data
      if (data && Array.isArray(data.data)) return data.data
      return []
    } catch (err) {
      console.error('autocomplete failed, returning empty array', err)
      return []
    }
  },

  getPopularSuggestions: async (): Promise<string[]> => {
    try {
      const response = await api.get('/api/search/suggestions/popular')
      const data = response.data
      const list = Array.isArray(data) ? data : (data && Array.isArray(data.data) ? data.data : null)
      if (list && list.length > 0) {
        return list
      }
      return ['Pizza', 'Biryani', 'Burgers', 'Dosa', 'Cake']
    } catch (err) {
      console.error('getPopularSuggestions failed, returning fallback popular keywords', err)
      return ['Pizza', 'Biryani', 'Burgers', 'Dosa', 'Cake']
    }
  },
}

