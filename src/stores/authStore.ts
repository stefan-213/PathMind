/**
 * 用户认证 Store
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types/api';
import { authApi, isMockMode } from '../api/useApi';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = isMockMode()
            ? await authApi.login({ email, password })
            : await authApi.login({ email, password });

          const data = isMockMode() ? response : (response as any).data;

          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false
          });

          // 保存 token 到 localStorage
          if (data.token) {
            localStorage.setItem('token', data.token);
          }
        } catch (error: any) {
          set({
            error: error.message || '登录失败',
            isLoading: false
          });
          throw error;
        }
      },

      register: async (email: string, username: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = isMockMode()
            ? await authApi.register({ email, username, password })
            : await authApi.register({ email, username, password });

          const data = isMockMode() ? response : (response as any).data;

          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false
          });

          if (data.token) {
            localStorage.setItem('token', data.token);
          }
        } catch (error: any) {
          set({
            error: error.message || '注册失败',
            isLoading: false
          });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          if (!isMockMode()) {
            await authApi.logout();
          }
        } catch (error) {
          // 忽略登出错误
        } finally {
          localStorage.removeItem('token');
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false
          });
        }
      },

      checkAuth: async () => {
        const token = localStorage.getItem('token');
        if (!token) {
          set({ isAuthenticated: false, user: null });
          return;
        }

        set({ isLoading: true });
        try {
          const response = isMockMode()
            ? await authApi.getCurrentUser()
            : await authApi.getCurrentUser();

          const user = isMockMode() ? response : (response as any).data;

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false
          });
        } catch (error) {
          localStorage.removeItem('token');
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false
          });
        }
      },

      clearError: () => set({ error: null })
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);
