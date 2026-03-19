/**
 * 学习任务 Store
 */
import { create } from 'zustand';
import type { UserTask, UserProgress } from '../types/api';
import { tasksApi, isMockMode } from '../api/useApi';

interface TasksState {
  tasks: UserTask[];
  progress: UserProgress | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchTasks: (goalId?: string) => Promise<void>;
  fetchProgress: () => Promise<void>;
  completeTask: (id: string) => Promise<void>;
  uncompleteTask: (id: string) => Promise<void>;
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
      const response = isMockMode()
        ? await tasksApi.getTasks(goalId ? { goalId } : undefined)
        : await tasksApi.getTasks(goalId ? { goalId } : undefined);

      const tasks = isMockMode() ? response : (response as any).data.items || response;

      set({ tasks, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || '获取任务失败', isLoading: false });
    }
  },

  fetchProgress: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = isMockMode()
        ? await tasksApi.getProgress()
        : await tasksApi.getProgress();

      const progress = isMockMode() ? response : (response as any).data;

      set({ progress, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || '获取进度失败', isLoading: false });
    }
  },

  completeTask: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = isMockMode()
        ? await tasksApi.completeTask(id)
        : await tasksApi.completeTask(id);

      const updatedTask = isMockMode() ? response : (response as any).data;

      set(state => ({
        tasks: state.tasks.map(t => t.id === id ? updatedTask : t),
        isLoading: false
      }));

      // 完成后重新获取进度
      get().fetchProgress();
    } catch (error: any) {
      set({ error: error.message || '完成任务失败', isLoading: false });
      throw error;
    }
  },

  uncompleteTask: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = isMockMode()
        ? await tasksApi.uncompleteTask(id)
        : await tasksApi.uncompleteTask(id);

      const updatedTask = isMockMode() ? response : (response as any).data;

      set(state => ({
        tasks: state.tasks.map(t => t.id === id ? updatedTask : t),
        isLoading: false
      }));

      // 重新获取进度
      get().fetchProgress();
    } catch (error: any) {
      set({ error: error.message || '取消任务失败', isLoading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null })
}));

// Helper function to get store instance for recursive calls
const get = () => useTasksStore.getState();
