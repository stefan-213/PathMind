/**
 * 个人中心相关 API
 * 真实后端接口调用
 */
import { get, del } from './axios';
import type { ApiResponse, Achievement, StudyStats, UserPlan } from '../types/api';

/** 获取用户学习计划列表 */
export const getPlans = (): Promise<ApiResponse<UserPlan[]>> => {
  return get<UserPlan[]>('/api/profile/plans');
};

/** 获取用户成就列表 */
export const getAchievements = (): Promise<ApiResponse<Achievement[]>> => {
  return get<Achievement[]>('/api/profile/achievements');
};

/** 获取学习统计 */
export const getStudyStats = (): Promise<ApiResponse<StudyStats>> => {
  return get<StudyStats>('/api/profile/stats');
};

/** 删除学习目标 */
export const deleteGoal = (goalId: number): Promise<ApiResponse<void>> => {
  return del<void>(`/api/profile/goals/${goalId}`);
};
