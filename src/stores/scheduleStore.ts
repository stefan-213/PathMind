// src/stores/scheduleStore.ts
import { create } from 'zustand';
import type { Schedule } from '../types/api';

interface ScheduleStore {
  schedules: Schedule[];
  currentSchedule: Schedule | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setSchedules: (schedules: Schedule[]) => void;
  setCurrentSchedule: (schedule: Schedule | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addSchedule: (schedule: Schedule) => void;
  removeSchedule: (scheduleId: string) => void;
  clearSchedules: () => void;
}

export const useScheduleStore = create<ScheduleStore>((set) => ({
  schedules: [],
  currentSchedule: null,
  isLoading: false,
  error: null,

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
}));