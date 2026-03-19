/**
 * 学习目标 API 服务
 */
import { get, post, put, del } from './axios';
import type { UserGoal, CreateGoalRequest, ApiResponse, PaginatedResponse } from '../types/api';

/**
 * 获取用户所有学习目标
 */
export const getGoals = (params?: { status?: string; page?: number; pageSize?: number }) => {
  return get<PaginatedResponse<UserGoal>>('/goals', params);
};

/**
 * 获取学习目标详情
 */
export const getGoalById = (id: string) => {
  return get<UserGoal>(`/goals/${id}`);
};

/**
 * 创建学习目标
 */
export const createGoal = (data: CreateGoalRequest) => {
  return post<UserGoal>('/goals', data);
};

/**
 * 更新学习目标
 */
export const updateGoal = (id: string, data: Partial<UserGoal>) => {
  return put<UserGoal>(`/goals/${id}`, data);
};

/**
 * 删除学习目标
 */
export const deleteGoal = (id: string) => {
  return del<void>(`/goals/${id}`);
};

/**
 * 归档学习目标
 */
export const archiveGoal = (id: string) => {
  return put<UserGoal>(`/goals/${id}/archive`);
};

/**
 * 激活学习目标
 */
export const activateGoal = (id: string) => {
  return put<UserGoal>(`/goals/${id}/activate`);
};
