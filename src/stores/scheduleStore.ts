// src/stores/scheduleStore.ts
import { create } from 'zustand';
import type { Schedule } from '../types/api';
import { getScheduleList, convertDTOToSchedule } from '../api/tasks';

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
  toggleTask: (scheduleId: string, taskId: number) => void;
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

    // 后端有数据时使用后端数据并同步到 localStorage
    if (backendSchedules.length > 0) {
      set({
        schedules: backendSchedules,
        currentSchedule: backendSchedules[0] || null,
        isLoading: false,
      });
      localStorage.setItem('pathmind_plan_data', JSON.stringify(backendSchedules));
      // 用后端返回的 scheduleName 更新标题（修复 option_1 等占位符问题）
      const scheduleName = backendSchedules[0]?.scheduleName?.trim();
      if (scheduleName) {
        localStorage.setItem('pathmind_plan_title', scheduleName);
      }
      return;
    }

    // 后端无数据，从 localStorage 读取
    try {
      const localData = localStorage.getItem('pathmind_plan_data');
      if (localData) {
        const parsed = JSON.parse(localData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          set({
            schedules: parsed,
            currentSchedule: parsed[0] || null,
            isLoading: false,
          });
          return;
        }
      }
    } catch (localErr) {
      console.error('读取本地数据失败:', localErr);
    }

    // 都没有数据
    set({ schedules: [], currentSchedule: null, isLoading: false });
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
   * 切换任务状态 (本地状态，暂不调用后端)
   */
  toggleTask: (scheduleId: string, taskId: number) => {
    const { schedules } = get();
    const updatedSchedules = schedules.map(schedule => {
      if (schedule.scheduleId !== scheduleId) return schedule;
      return {
        ...schedule,
        subScheduleList: schedule.subScheduleList.map(task => {
          if (task.id !== taskId) return task;
          return {
            ...task,
            status: task.status === 1 ? 0 : 1,
            completedAt: task.status === 1 ? null : new Date().toISOString(),
          };
        }),
      };
    });

    const updatedCurrent = updatedSchedules.find(s => s.scheduleId === scheduleId) || null;
    set({ schedules: updatedSchedules, currentSchedule: updatedCurrent });

    // 同步到 localStorage
    localStorage.setItem('pathmind_plan_data', JSON.stringify(updatedSchedules));
  },
}));
