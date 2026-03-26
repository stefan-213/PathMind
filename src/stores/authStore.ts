/**
 * 用户认证 Store
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types/api';
import { authApi } from '../api/useApi';

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
          const response = await authApi.login({ email, password });
          const data = response.data;

          if (!data) {
            throw new Error('登录响应数据异常');
          }

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
        } catch (err) {
          const message = err instanceof Error ? err.message : '登录失败';
          set({ error: message, isLoading: false });
          throw err;
        }
      },

      register: async (email: string, username: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.register({ email, username, password });
          const data = response.data;

          if (!data) {
            throw new Error('注册响应数据异常');
          }

          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false
          });

          if (data.token) {
            localStorage.setItem('token', data.token);
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : '注册失败';
          set({ error: message, isLoading: false });
          throw err;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await authApi.logout();
        } catch {
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
          const response = await authApi.getCurrentUser();
          const user = response.data;

          if (!user) {
            throw new Error('获取用户信息失败');
          }

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false
          });
        } catch {
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
