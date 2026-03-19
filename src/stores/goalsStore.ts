/**
 * 学习目标 Store
 */
import { create } from 'zustand';
import type { UserGoal } from '../types/api';
import { goalsApi, isMockMode } from '../api/useApi';

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

export const useGoalsStore = create<GoalsState>((set, get) => ({
  goals: [],
  currentGoal: null,
  isLoading: false,
  error: null,

  fetchGoals: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = isMockMode()
        ? await goalsApi.getGoals()
        : await goalsApi.getGoals();

      const goals = isMockMode() ? response : (response as any).data.items || response;

      set({ goals, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || '获取目标失败', isLoading: false });
    }
  },

  fetchGoalById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = isMockMode()
        ? await goalsApi.getGoalById(id)
        : await goalsApi.getGoalById(id);

      const goal = isMockMode() ? response : (response as any).data;

      set({ currentGoal: goal, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || '获取目标详情失败', isLoading: false });
    }
  },

  createGoal: async (goalText: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = isMockMode()
        ? await goalsApi.createGoal(goalText)
        : await goalsApi.createGoal(goalText);

      const newGoal = isMockMode() ? response : (response as any).data;

      set(state => ({
        goals: [newGoal, ...state.goals],
        currentGoal: newGoal,
        isLoading: false
      }));

      return newGoal;
    } catch (error: any) {
      set({ error: error.message || '创建目标失败', isLoading: false });
      throw error;
    }
  },

  updateGoal: async (id: string, data: Partial<UserGoal>) => {
    set({ isLoading: true, error: null });
    try {
      const response = isMockMode()
        ? await goalsApi.updateGoal(id, data)
        : await goalsApi.updateGoal(id, data);

      const updatedGoal = isMockMode() ? response : (response as any).data;

      set(state => ({
        goals: state.goals.map(g => g.id === id ? updatedGoal : g),
        currentGoal: state.currentGoal?.id === id ? updatedGoal : state.currentGoal,
        isLoading: false
      }));
    } catch (error: any) {
      set({ error: error.message || '更新目标失败', isLoading: false });
      throw error;
    }
  },

  deleteGoal: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      if (!isMockMode()) {
        await goalsApi.deleteGoal(id);
      }

      set(state => ({
        goals: state.goals.filter(g => g.id !== id),
        currentGoal: state.currentGoal?.id === id ? null : state.currentGoal,
        isLoading: false
      }));
    } catch (error: any) {
      set({ error: error.message || '删除目标失败', isLoading: false });
      throw error;
    }
  },

  setCurrentGoal: (goal: UserGoal | null) => set({ currentGoal: goal }),

  clearError: () => set({ error: null })
}));
