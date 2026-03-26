/**
 * 认证 API 服务
 */
import { get, post } from './axios';
import type { User, LoginRequest, RegisterRequest, AuthResponse } from '../types/api';

/**
 * 用户登录
 */
export const login = (data: LoginRequest) => {
  return post<AuthResponse>('/auth/login', data);
};

/**
 * 用户注册
 */
export const register = (data: RegisterRequest) => {
  return post<AuthResponse>('/auth/register', data);
};

/**
 * 退出登录
 */
export const logout = () => {
  return post<void>('/auth/logout');
};

/**
 * 获取当前用户信息
 */
export const getCurrentUser = () => {
  return get<User>('/auth/me');
};

/**
 * 更新用户信息
 */
export const updateUser = (data: Partial<User>) => {
  return post<User>('/auth/update', data);
};

/**
 * 修改密码
 */
export const changePassword = (oldPassword: string, newPassword: string) => {
  return post<void>('/auth/change-password', { oldPassword, newPassword });
};
