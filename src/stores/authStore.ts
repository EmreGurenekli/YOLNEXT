// @ts-expect-error - zustand type definitions may not be available
import { create } from 'zustand';
// @ts-expect-error - zustand middleware types
import { persist, createJSONStorage } from 'zustand/middleware';
import { logger } from '../services/logger';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  userType: 'individual' | 'corporate' | 'nakliyeci' | 'tasiyici';
  companyName?: string;
  taxNumber?: string;
  phone?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set: any, get: any) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: (user: User, token: string) => {
        logger.info('Kullanıcı giriş yaptı', {
          userId: user.id,
          userType: user.userType,
        });
        set({
          user,
          token,
          isAuthenticated: true,
          error: null,
        });
      },

      logout: () => {
        console.log('authStore logout çağrıldı - DEVRE DIŞI');
        console.trace('authStore logout çağrı izi');
        // const { user } = get();
        // logger.info('Kullanıcı çıkış yaptı', { userId: user?.id });
        // // Clear localStorage as well
        // try {
        //   localStorage.removeItem('authToken');
        //   localStorage.removeItem('user');
        // } catch (error) {
        //   console.error('Çıkışta localStorage temizlenirken hata:', error);
        // }
        // set({
        //   user: null,
        //   token: null,
        //   isAuthenticated: false,
        //   error: null,
        // });
      },

      updateUser: (userData: Partial<User>) => {
        const { user } = get();
        if (user) {
          const updatedUser = { ...user, ...userData };
          logger.info('Kullanıcı güncellendi', { userId: user.id, updates: userData });
          set({ user: updatedUser });
        }
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setError: (error: string | null) => {
        if (error) {
          logger.error('Kimlik doğrulama hatası', { error });
        }
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state: AuthStore) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Selectors
export const useUser = () => useAuthStore((state: AuthStore) => state.user);
export const useIsAuthenticated = () =>
  useAuthStore((state: AuthStore) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state: AuthStore) => state.isLoading);
export const useAuthError = () => useAuthStore((state: AuthStore) => state.error);
