/**
 * 学习任务 Store
 */
import { create } from 'zustand';
import type { UserProgress } from '../types/api';
import { getScheduleList } from '../api/tasks';

interface TasksState {
  tasks: unknown[];
  progress: UserProgress | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchTasks: (goalId?: string) => Promise<void>;
  fetchProgress: (goalId?: string) => Promise<void>;
  updateTaskStatus: (id: string, completed: boolean) => Promise<void>;
  clearError: () => void;
}

export const useTasksStore = create<TasksState>((set) => ({
  tasks: [],
  progress: null,
  isLoading: false,
  error: null,

  fetchTasks: async (goalId?: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await getScheduleList(goalId ?? '');
      const data = response.data;
      set({ tasks: Array.isArray(data) ? data : [], isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取任务失败';
      set({ error: message, isLoading: false });
    }
  },

  fetchProgress: async () => {
    // TODO: 确认后端是否有独立的进度接口
    set({ isLoading: false });
  },

  updateTaskStatus: async () => {
    // TODO: 确认后端是否有更新任务状态的接口
  },

  clearError: () => set({ error: null }),
}));