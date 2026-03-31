/**
 * 认证 API 服务
 */
import { get, post } from './axios';
import type { User, LoginRequest, RegisterRequest, AuthResponse } from '../types/api';

/**
 * 用户登录
 * 后端返回 data 为 token 字符串（可能是 "Bearer xxx" 格式）
 */
export const login = (data: LoginRequest) => {
  return post<string>('/api/auth/login', data);
};

/**
 * 用户注册
 */
export const register = (data: RegisterRequest) => {
  return post<AuthResponse>('/api/auth/register', data);
};

/**
 * 退出登录
 */
export const logout = () => {
  return post<void>('/api/user/quitLogin');
};

/**
 * 获取当前用户信息
 */
export const getCurrentUser = () => {
  return get<User>('/api/user/info');
};

/**
 * 更新用户信息
 */
export const updateUser = (data: Partial<User>) => {
  return post<User>('/api/auth/update', data);
};

/**
 * 修改密码
 */
export const changePassword = (oldPassword: string, newPassword: string) => {
  return post<void>('/api/auth/change-password', { oldPassword, newPassword });
};
