/**
 * 学习任务 API 服务
 */
import { get, post, put, del } from './axios';
import type { UserTask, UserProgress, CreateTasksRequest, PaginatedResponse } from '../types/api';

/**
 * 获取用户任务（可按 goalId 筛选）
 */
export const getTasks = (params?: { goalId?: string; status?: string }) => {
  return get<PaginatedResponse<UserTask> | UserTask[]>('/api/tasks', params);
};

/**
 * 获取单个任务
 */
export const getTaskById = (id: string) => {
  return get<UserTask>(`/api/tasks/${id}`);
};

/**
 * 批量创建任务（从 AI 方案生成）
 */
export const createTasks = (data: CreateTasksRequest) => {
  return post<UserTask[]>('/api/tasks', data);
};

/**
 * 更新任务（包含完成/未完成状态）
 */
export const updateTask = (id: string, data: Partial<UserTask>) => {
  return put<UserTask>(`/api/tasks/${id}`, data);
};

/**
 * 删除任务
 */
export const deleteTask = (id: string) => {
  return del<void>(`/api/tasks/${id}`);
};

/**
 * 获取用户学习进度（可按 goalId 筛选）
 */
export const getProgress = (params?: { goalId?: string }) => {
  return get<UserProgress>('/api/progress', params);
};
