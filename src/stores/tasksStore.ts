/**
 * 学习任务 Store
 */
import { create } from 'zustand';
import type { UserTask, UserProgress, PaginatedResponse } from '../types/api';
import { tasksApi } from '../api/useApi';

interface TasksState {
  tasks: UserTask[];
  progress: UserProgress | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchTasks: (goalId?: string) => Promise<void>;
  fetchProgress: (goalId?: string) => Promise<void>;
  updateTaskStatus: (id: string, completed: boolean) => Promise<void>;
  clearError: () => void;
}

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  progress: null,
  isLoading: false,
  error: null,

  fetchTasks: async (goalId?: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await tasksApi.getTasks(goalId ? { goalId } : undefined);
      const tasks: UserTask[] = Array.isArray(response.data)
        ? response.data
        : (response.data as PaginatedResponse<UserTask>).items || [];
      set({ tasks, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取任务失败';
      set({ error: message, isLoading: false });
    }
  },

  fetchProgress: async (goalId?: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await tasksApi.getProgress(goalId ? { goalId } : undefined);
      set({ progress: response.data as UserProgress, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取进度失败';
      set({ error: message, isLoading: false });
    }
  },

  updateTaskStatus: async (id: string, completed: boolean) => {
    set({ isLoading: true, error: null });
    try {
      const response = await tasksApi.updateTask(id, { status: completed ? 'completed' : 'pending' });
      const updatedTask = response.data as UserTask;
      set(state => ({
        tasks: state.tasks.map(t => t.id === id ? updatedTask : t),
        isLoading: false
      }));
      // 状态变更后重新获取进度
      get().fetchProgress();
    } catch (err) {
      const message = err instanceof Error ? err.message : '更新任务状态失败';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  clearError: () => set({ error: null })
}));
