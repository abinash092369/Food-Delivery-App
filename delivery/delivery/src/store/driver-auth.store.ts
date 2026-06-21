import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DriverProfile } from '../types/driver.types';

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  driver: DriverProfile | null;
  setAuth: (accessToken: string | null, driver: DriverProfile | null, refreshToken?: string | null) => void;
  setDriver: (driver: DriverProfile | null) => void;
  logout: () => void;
}

export const useDriverAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      driver: null,
      setAuth: (accessToken, driver, refreshToken = null) =>
        set({ accessToken, driver, refreshToken }),
      setDriver: (driver) => set({ driver }),
      logout: () => set({ accessToken: null, refreshToken: null, driver: null }),
    }),
    {
      name: 'eets-driver-auth',
    }
  )
);
