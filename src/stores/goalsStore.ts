/**
 * 学习目标 Store
 */
import { create } from 'zustand';
import type { UserGoal, PaginatedResponse } from '../types/api';
import { goalsApi } from '../api/useApi';

interface GoalsState {
  goals: UserGoal[];
  currentGoal: UserGoal | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchGoals: () => Promise<void>;
  fetchGoalById: (id: string) => Promise<void>;
  createGoal: (goal: string) => Promise<UserGoal>;
  updateGoal: (id: string, data: Partial<UserGoal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  setCurrentGoal: (goal: UserGoal | null) => void;
  clearError: () => void;
}

export const useGoalsStore = create<GoalsState>((set) => ({
  goals: [],
  currentGoal: null,
  isLoading: false,
  error: null,

  fetchGoals: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await goalsApi.getGoals();
      // 兼容 PaginatedResponse 和直接数组两种响应格式
      const goals: UserGoal[] = Array.isArray(response.data)
        ? response.data
        : (response.data as PaginatedResponse<UserGoal>).items || [];
      set({ goals, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取目标失败';
      set({ error: message, isLoading: false });
    }
  },

  fetchGoalById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await goalsApi.getGoalById(id);
      const goal = response.data;
      if (!goal) {
        throw new Error('目标不存在');
      }
      set({ currentGoal: goal as UserGoal, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取目标详情失败';
      set({ error: message, isLoading: false });
    }
  },

  createGoal: async (goalText: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await goalsApi.createGoal({ goal: goalText });
      const newGoal = response.data as UserGoal;
      set(state => ({
        goals: [newGoal, ...state.goals],
        currentGoal: newGoal,
        isLoading: false
      }));
      return newGoal;
    } catch (err) {
      const message = err instanceof Error ? err.message : '创建目标失败';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  updateGoal: async (id: string, data: Partial<UserGoal>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await goalsApi.updateGoal(id, data);
      const updatedGoal = response.data as UserGoal;
      set(state => ({
        goals: state.goals.map(g => g.id === id ? updatedGoal : g),
        currentGoal: state.currentGoal?.id === id ? updatedGoal : state.currentGoal,
        isLoading: false
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : '更新目标失败';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  deleteGoal: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await goalsApi.deleteGoal(id);
      set(state => ({
        goals: state.goals.filter(g => g.id !== id),
        currentGoal: state.currentGoal?.id === id ? null : state.currentGoal,
        isLoading: false
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : '删除目标失败';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  setCurrentGoal: (goal: UserGoal | null) => set({ currentGoal: goal }),

  clearError: () => set({ error: null })
}));
