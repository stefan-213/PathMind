// src/stores/scheduleStore.ts
import { create } from 'zustand';
import type { Schedule } from '../types/api';
import { getScheduleList, convertDTOToSchedule, updateSubScheduleStatus } from '../api/tasks';
import { STORAGE_KEYS } from '../constants';

interface ScheduleStore {
  schedules: Schedule[];
  currentSchedule: Schedule | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchSchedules: (sessionId: string) => Promise<void>;
  setSchedules: (schedules: Schedule[]) => void;
  setCurrentSchedule: (schedule: Schedule | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addSchedule: (schedule: Schedule) => void;
  removeSchedule: (scheduleId: string) => void;
  clearSchedules: () => void;
  toggleTask: (scheduleId: string, taskId: string) => void;
}

export const useScheduleStore = create<ScheduleStore>((set, get) => ({
  schedules: [],
  currentSchedule: null,
  isLoading: false,
  error: null,

  /**
   * 从后端获取日程表列表，失败或为空时降级到 localStorage
   */
  fetchSchedules: async (sessionId: string) => {
    if (!sessionId) {
      set({ error: 'sessionId 不能为空' });
      return;
    }

    set({ isLoading: true, error: null });

    // 先尝试从后端获取
    let backendSchedules: Schedule[] = [];
    try {
      const response = await getScheduleList(sessionId);
      const dtoList = response.data || [];
      backendSchedules = dtoList.map(convertDTOToSchedule);
    } catch (err) {
      console.warn('从后端获取日程表失败:', err);
    }

    // 使用后端数据并同步到 localStorage
    set({
      schedules: backendSchedules,
      currentSchedule: backendSchedules[0] || null,
      isLoading: false,
    });
    // 使用 sessionId 缀的 key 存储
    localStorage.setItem(`${STORAGE_KEYS.PLAN_DATA}_${sessionId}`, JSON.stringify(backendSchedules));
    // 用后端返回的 scheduleName 更新标题（修复 option_1 等占位符问题）
    const scheduleName = backendSchedules[0]?.scheduleName?.trim();
    if (scheduleName) {
      localStorage.setItem(`${STORAGE_KEYS.PLAN_TITLE}_${sessionId}`, scheduleName);
    }
    return;
  },

  setSchedules: (schedules) => set({ schedules }),
  setCurrentSchedule: (schedule) => set({ currentSchedule: schedule }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  addSchedule: (schedule) =>
    set((state) => ({ schedules: [...state.schedules, schedule] })),

  removeSchedule: (scheduleId) =>
    set((state) => ({
      schedules: state.schedules.filter((s) => s.scheduleId !== scheduleId),
    })),

  clearSchedules: () => set({ schedules: [], currentSchedule: null }),

  /**
   * 切换任务状态
   */
  toggleTask: async (scheduleId: string, taskId: string) => {
    const { schedules } = get();
    // console.log('[toggleTask] called with:', { scheduleId, taskId });
    // console.log('[toggleTask] available schedules:', schedules.map(s => ({ scheduleId: s.scheduleId, taskCount: s.subScheduleList.length })));
    const schedule = schedules.find(s => s.scheduleId === scheduleId);
    if (!schedule) return;
    const task = schedule.subScheduleList.find(t => t.id === taskId);
    if (!task) return;

    // 计算新状态
    const newStatus = task.status === 1 ? 'pending' : 'completed';

    // 先乐观更新本地状态
    const updatedSchedules = schedules.map(s => {
      if (s.scheduleId !== scheduleId) return s;
      return {
        ...s,
        subScheduleList: s.subScheduleList.map(t => {
          if (t.id !== taskId) return t;
          return {
            ...t,
            status: t.status === 1 ? 0 : 1,
            completedAt: t.status === 1 ? null : new Date().toISOString(),
          };
        }),
      };
    });

    const updatedCurrent = updatedSchedules.find(s => s.scheduleId === scheduleId) || null;
    set({ schedules: updatedSchedules, currentSchedule: updatedCurrent });

    // 同步到 localStorage
    localStorage.setItem(STORAGE_KEYS.PLAN_DATA, JSON.stringify(updatedSchedules));

    // 调用后端 API
    try {
      // console.log('[toggleTask] calling API with:', { scheduleId: schedule.id, subScheduleId: taskId, status: newStatus });
      await updateSubScheduleStatus(taskId, newStatus, schedule.id);
    } catch (err) {
      console.error('更新子日程状态失败:', err);
      // 失败时回滚本地状态
      set({ schedules, currentSchedule: schedule });
      localStorage.setItem(STORAGE_KEYS.PLAN_DATA, JSON.stringify(schedules));
    }
  },
}));
