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
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, email: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  updateUser: (data: Partial<User>) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.login({ username, password });
          // 后端返回的 data 是 token 字符串（可能是 "Bearer xxx" 格式）
          let token = response.data as string;

          if (!token) {
            throw new Error('登录响应数据异常');
          }

          // 去掉 "Bearer " 前缀，只保留 token 本身
          if (token.startsWith('Bearer ')) {
            token = token.substring(7);
          }

          // 保存 token 到 localStorage
          localStorage.setItem('token', token);

          // 获取完整用户信息
          const userResponse = await authApi.getCurrentUser();
          const user = userResponse.data;

          if (!user) {
            throw new Error('获取用户信息失败');
          }

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : '登录失败';
          set({ error: message, isLoading: false });
          throw err;
        }
      },

      register: async (username: string, password: string, email: string, phone?: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.register({ username, password, email, phone });
          const data = response.data;

          if (!data) {
            throw new Error('注册响应数据异常');
          }

          // 保存 token 到 localStorage
          if (data.token) {
            localStorage.setItem('token', data.token);
          }

          // 获取完整用户信息
          const userResponse = await authApi.getCurrentUser();
          const user = userResponse.data;

          if (!user) {
            throw new Error('获取用户信息失败');
          }

          set({
            user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false
          });
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

      clearError: () => set({ error: null }),

      updateUser: async (data: Partial<User>) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.updateUser(data);
          const updatedUser = response.data;
          if (!updatedUser) {
            throw new Error('更新用户信息失败');
          }
          set({ user: updatedUser as User, isLoading: false });
        } catch (err) {
          const message = err instanceof Error ? err.message : '更新用户信息失败';
          set({ error: message, isLoading: false });
          throw err;
        }
      },

      changePassword: async (oldPassword: string, newPassword: string) => {
        set({ isLoading: true, error: null });
        try {
          await authApi.changePassword(oldPassword, newPassword);
          set({ isLoading: false });
        } catch (err) {
          const message = err instanceof Error ? err.message : '修改密码失败';
          set({ error: message, isLoading: false });
          throw err;
        }
      }
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
