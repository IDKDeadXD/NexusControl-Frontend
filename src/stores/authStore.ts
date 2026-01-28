import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  username: string;
}

interface AuthState {
  accessToken: string | null;
  user: User | null;
  requiresPasswordChange: boolean;
  isAuthenticated: boolean;
  setAccessToken: (token: string) => void;
  setUser: (user: User) => void;
  setRequiresPasswordChange: (requires: boolean) => void;
  login: (token: string, user: User, requiresPasswordChange: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      requiresPasswordChange: false,
      isAuthenticated: false,

      setAccessToken: (token) => set({ accessToken: token }),

      setUser: (user) => set({ user }),

      setRequiresPasswordChange: (requires) =>
        set({ requiresPasswordChange: requires }),

      login: (token, user, requiresPasswordChange) =>
        set({
          accessToken: token,
          user,
          requiresPasswordChange,
          isAuthenticated: true,
        }),

      logout: () =>
        set({
          accessToken: null,
          user: null,
          requiresPasswordChange: false,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        // Persist auth state including token for session continuity
        // Token will be validated/refreshed on app load via AuthInitializer
        accessToken: state.accessToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        requiresPasswordChange: state.requiresPasswordChange,
      }),
    }
  )
);
