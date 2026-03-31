/**
 * 学习任务 API 服务
 */
import { get, post, put, del } from './axios';
import type { UserTask, UserProgress, CreateTasksRequest, PaginatedResponse } from '../types/api';

/**
 * 获取用户所有任务
 */
export const getTasks = (params?: { goalId?: string; status?: string; page?: number; pageSize?: number }) => {
  return get<PaginatedResponse<UserTask>>('/api/tasks', params);
};

/**
 * 获取任务详情
 */
export const getTaskById = (id: string) => {
  return get<UserTask>(`/api/tasks/${id}`);
};

/**
 * 获取特定目标的任务
 */
export const getTasksByGoal = (goalId: string) => {
  return get<UserTask[]>(`/api/tasks/goal/${goalId}`);
};

/**
 * 批量创建任务（从 AI 方案生成）
 */
export const createTasks = (data: CreateTasksRequest) => {
  return post<UserTask[]>('/api/tasks', data);
};

/**
 * 更新任务
 */
export const updateTask = (id: string, data: Partial<UserTask>) => {
  return put<UserTask>(`/api/tasks/${id}`, data);
};

/**
 * 标记任务完成
 */
export const completeTask = (id: string) => {
  return put<UserTask>(`/api/tasks/${id}/complete`);
};

/**
 * 标记任务未完成
 */
export const uncompleteTask = (id: string) => {
  return put<UserTask>(`/api/tasks/${id}/uncomplete`);
};

/**
 * 删除任务
 */
export const deleteTask = (id: string) => {
  return del<void>(`/api/tasks/${id}`);
};

/**
 * 获取用户学习进度
 */
export const getProgress = () => {
  return get<UserProgress>('/api/progress');
};

/**
 * 获取特定目标的进度
 */
export const getProgressByGoal = (goalId: string) => {
  return get<UserProgress>(`/api/progress/${goalId}`);
};
