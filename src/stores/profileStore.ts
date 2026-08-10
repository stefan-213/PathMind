/**
 * 个人中心 Store
 * 注意：当前 API 返回 mock 数据，后端接口提供后替换 profile.ts 中的实现即可
 */
import { create } from 'zustand';
import type { Achievement, StudyStats, UserPlan } from '../types/api';
import { getPlans, getAchievements, getStudyStats, deleteGoal } from '../api/profile';

interface ProfileState {
  plans: UserPlan[];
  achievements: Achievement[];
  stats: StudyStats | null;

  // 分离的 loading 状态，避免并发请求互相覆盖
  loadingPlans: boolean;
  loadingAchievements: boolean;
  loadingStats: boolean;

  error: string | null;

  // Actions
  fetchPlans: () => Promise<void>;
  fetchAchievements: () => Promise<void>;
  fetchStats: () => Promise<void>;
  deleteGoal: (goalId: number) => Promise<void>;
  clearError: () => void;
}

export const useProfileStore = create<ProfileState>((set) => ({
  plans: [],
  achievements: [],
  stats: null,

  loadingPlans: false,
  loadingAchievements: false,
  loadingStats: false,

  error: null,

  fetchPlans: async () => {
    set({ loadingPlans: true, error: null });
    try {
      const response = await getPlans();
      set({ plans: response.data ?? [], loadingPlans: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取计划列表失败';
      set({ error: message, loadingPlans: false });
    }
  },

  fetchAchievements: async () => {
    set({ loadingAchievements: true, error: null });
    try {
      const response = await getAchievements();
      set({ achievements: response.data ?? [], loadingAchievements: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取成就列表失败';
      set({ error: message, loadingAchievements: false });
    }
  },

  fetchStats: async () => {
    set({ loadingStats: true, error: null });
    try {
      const response = await getStudyStats();
      set({ stats: response.data ?? null, loadingStats: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取学习统计失败';
      set({ error: message, loadingStats: false });
    }
  },

  deleteGoal: async (goalId: number) => {
    set({ error: null });
    try {
      await deleteGoal(goalId);
      set((state) => ({
        plans: state.plans.filter((p) => p.id !== goalId),
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : '删除目标失败';
      set({ error: message });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));

/** 计算是否正在加载（任一接口加载中即为 true） */
export const useProfileLoading = () => {
  const { loadingPlans, loadingAchievements, loadingStats } = useProfileStore();
  return loadingPlans || loadingAchievements || loadingStats;
};
