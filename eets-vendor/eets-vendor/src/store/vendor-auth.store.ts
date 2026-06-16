import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, RestaurantDetailResponse } from '../types/vendor.types';

export interface AuthState {
  token: string | null;
  user: User | null;
  restaurant: RestaurantDetailResponse | null;
  setAuth: (token: string | null, user: User | null) => void;
  setRestaurant: (restaurant: RestaurantDetailResponse | null) => void;
  logout: () => void;
}

export const useVendorAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      restaurant: null,
      setAuth: (token, user) => set((state) => {
        const newUser = user ? { ...user } : null;
        if (newUser && state.user?.restaurantName && !newUser.restaurantName) {
          newUser.restaurantName = state.user.restaurantName;
        }
        return { token, user: newUser };
      }),
      setRestaurant: (restaurant) => set((state) => {
        if (!restaurant) return { restaurant: null };
        const newRestaurant = { ...restaurant };
        if (!newRestaurant.name && state.restaurant?.name) {
          newRestaurant.name = state.restaurant.name;
        }
        if (!newRestaurant.name && state.user?.restaurantName) {
          newRestaurant.name = state.user.restaurantName;
        }

        const isApprovedValue = (r: any) =>
          r?.isApproved === true ||
          r?.is_approved === true ||
          r?.is_approved === 1 ||
          r?.approved === true ||
          r?.approved === 1;

        const prevApproved = isApprovedValue(state.restaurant);
        const hasIncomingApprovalField = 
          newRestaurant.isApproved !== undefined || 
          (newRestaurant as any).is_approved !== undefined || 
          (newRestaurant as any).approved !== undefined;

        if (isApprovedValue(newRestaurant)) {
          newRestaurant.isApproved = true;
        } else if (prevApproved && !hasIncomingApprovalField) {
          newRestaurant.isApproved = true;
        }

        return { restaurant: newRestaurant };
      }),
      logout: () => set({ token: null, user: null, restaurant: null }),
    }),
    {
      name: 'eets-vendor-auth',
    }
  )
);
