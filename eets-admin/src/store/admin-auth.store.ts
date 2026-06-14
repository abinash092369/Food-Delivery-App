import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types/admin.types';

interface AuthState {
  accessToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (accessToken: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      isAuthenticated: false,
      login: (accessToken, user) => {
        // Ensure user is an admin or super admin
        if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
          set({
            accessToken,
            user,
            isAuthenticated: true,
          });
        }
      },
      logout: () => {
        set({
          accessToken: null,
          user: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'eets-admin-auth',
    }
  )
);
