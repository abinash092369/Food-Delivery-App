import { create } from 'zustand'
import { Cart } from '../types'

interface CartState {
  cart: Cart | null;
  isDrawerOpen: boolean;
  setCart: (cart: Cart | null) => void;
  clearCartLocal: () => void;
  setDrawerOpen: (open: boolean) => void;
}

export const useCartStore = create<CartState>((set) => ({
  cart: null,
  isDrawerOpen: false,
  setCart: (cart) => set({ cart }),
  clearCartLocal: () => set({ cart: null }),
  setDrawerOpen: (open) => set({ isDrawerOpen: open }),
}))
