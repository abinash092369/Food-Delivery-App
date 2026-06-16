import { axiosInstance } from './axios';
import { ApiResponse, MenuResponse, MenuCategoryResponse, MenuItemResponse } from '../types/vendor.types';

export interface MenuCategoryRequest {
  name: string;
  description?: string;
  imageUrl?: string;
  sortOrder?: number;
}

export interface CustomizationOptionRequest {
  name: string;
  extraPrice: number;
}

export interface CustomizationGroupRequest {
  name: string;
  type: 'SINGLE' | 'MULTIPLE';
  isRequired: boolean;
  options: CustomizationOptionRequest[];
}

export interface MenuItemRequest {
  name: string;
  description?: string;
  price: number;
  categoryId: number;
  isVeg: boolean;
  imageUrl?: string;
  isAvailable?: boolean;
  isFeatured?: boolean;
  customizationGroups?: CustomizationGroupRequest[];
}

export const vendorMenuApi = {
  getMenu: async () => {
    const response = await axiosInstance.get<ApiResponse<MenuResponse>>('/api/vendor/menu');
    return response.data;
  },

  addCategory: async (req: MenuCategoryRequest) => {
    const response = await axiosInstance.post<ApiResponse<MenuCategoryResponse>>('/api/vendor/menu/categories', req);
    return response.data;
  },

  updateCategory: async (id: number, req: MenuCategoryRequest) => {
    const response = await axiosInstance.put<ApiResponse<MenuCategoryResponse>>(`/api/vendor/menu/categories/${id}`, req);
    return response.data;
  },

  deleteCategory: async (id: number) => {
    const response = await axiosInstance.delete<ApiResponse<{ status: string }>>(`/api/vendor/menu/categories/${id}`);
    return response.data;
  },

  addItem: async (req: MenuItemRequest) => {
    const response = await axiosInstance.post<ApiResponse<MenuItemResponse>>('/api/vendor/menu/items', req);
    return response.data;
  },

  updateItem: async (id: number, req: MenuItemRequest) => {
    const response = await axiosInstance.put<ApiResponse<MenuItemResponse>>(`/api/vendor/menu/items/${id}`, req);
    return response.data;
  },

  deleteItem: async (id: number) => {
    const response = await axiosInstance.delete<ApiResponse<{ status: string }>>(`/api/vendor/menu/items/${id}`);
    return response.data;
  },

  setItemAvailability: async (id: number, isAvailable: boolean) => {
    const response = await axiosInstance.patch<ApiResponse<MenuItemResponse>>(`/api/vendor/menu/items/${id}/availability`, { isAvailable });
    return response.data;
  },

  setItemFeatured: async (id: number, isFeatured: boolean) => {
    const response = await axiosInstance.patch<ApiResponse<MenuItemResponse>>(`/api/vendor/menu/items/${id}/featured`, { isFeatured });
    return response.data;
  },
};
