/**
 * PathMind 本地存储工具
 * 提供 Consult/Graph/Tasks 页面的数据持久化功能
 */

import type { UserProfile, Task, LocalUserProgress as UserProgress } from '../types/copilot';
import { STORAGE_KEYS as PATHMIND_KEYS } from '../constants';

// ============================================================
// PathMind Storage（Consult/Graph/Tasks 页面用）
// ============================================================
import type { Schedule } from '../types/api';

export interface ConsultChartData {
  agentId: string;
  sessionId: string;
  optionId?: string;
  consultationMsg?: {
    goal: string;
    base: string;
  };
}

export const pathmindStorage = {
  consult: {
    save: (data: ConsultChartData): void =>
      localStorage.setItem(PATHMIND_KEYS.CONSULT_CHART, JSON.stringify(data)),
    load: (): ConsultChartData | null => {
      const raw = localStorage.getItem(PATHMIND_KEYS.CONSULT_CHART);
      return raw ? JSON.parse(raw) : null;
    },
    clear: (): void => localStorage.removeItem(PATHMIND_KEYS.CONSULT_CHART),
  },
  plan: {
    save: (schedules: Schedule[], sessionId?: string): void => {
      if (sessionId) {
        localStorage.setItem(`${PATHMIND_KEYS.PLAN_DATA}_${sessionId}`, JSON.stringify(schedules));
      } else {
        localStorage.setItem(PATHMIND_KEYS.PLAN_DATA, JSON.stringify(schedules));
      }
    },
    load: (sessionId?: string): Schedule[] => {
      const key = sessionId ? `${PATHMIND_KEYS.PLAN_DATA}_${sessionId}` : PATHMIND_KEYS.PLAN_DATA;
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    },
    saveTitle: (title: string, sessionId?: string): void => {
      if (sessionId) {
        localStorage.setItem(`${PATHMIND_KEYS.PLAN_TITLE}_${sessionId}`, title);
      } else {
        localStorage.setItem(PATHMIND_KEYS.PLAN_TITLE, title);
      }
    },
    loadTitle: (sessionId?: string): string => {
      const key = sessionId ? `${PATHMIND_KEYS.PLAN_TITLE}_${sessionId}` : PATHMIND_KEYS.PLAN_TITLE;
      return localStorage.getItem(key) || '';
    },
    clear: (sessionId?: string): void => {
      if (sessionId) {
        localStorage.removeItem(`${PATHMIND_KEYS.PLAN_DATA}_${sessionId}`);
        localStorage.removeItem(`${PATHMIND_KEYS.PLAN_TITLE}_${sessionId}`);
      } else {
        localStorage.removeItem(PATHMIND_KEYS.PLAN_DATA);
        localStorage.removeItem(PATHMIND_KEYS.PLAN_TITLE);
      }
    },
  },
};

const STORAGE_KEYS = {
  USER_GOAL: 'zaplink_user_goal',
  USER_ANSWERS: 'zaplink_user_answers',
  USER_PROFILE: 'zaplink_user_profile',
  USER_TASKS: 'zaplink_user_tasks'
} as const;

// User Goal
export function saveUserGoal(goal: string): void {
  localStorage.setItem(STORAGE_KEYS.USER_GOAL, goal);
}

export function getUserGoal(): string {
  return localStorage.getItem(STORAGE_KEYS.USER_GOAL) || '';
}

// User Answers
export function saveUserAnswers(answers: number[]): void {
  localStorage.setItem(STORAGE_KEYS.USER_ANSWERS, JSON.stringify(answers));
}

export function getUserAnswers(): number[] {
  const data = localStorage.getItem(STORAGE_KEYS.USER_ANSWERS);
  return data ? JSON.parse(data) : [];
}

// User Profile
export function saveUserProfile(profile: UserProfile): void {
  localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
}

export function getUserProfile(): UserProfile | null {
  const data = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
  return data ? JSON.parse(data) : null;
}

// User Tasks
export function saveUserTasks(tasks: Task[]): void {
  localStorage.setItem(STORAGE_KEYS.USER_TASKS, JSON.stringify(tasks));
}

export function getUserTasks(): Task[] {
  const data = localStorage.getItem(STORAGE_KEYS.USER_TASKS);
  return data ? JSON.parse(data) : [];
}

// Check if has active plan
export function hasActivePlan(): boolean {
  const profile = getUserProfile();
  const tasks = getUserTasks();
  return !!profile && tasks.length > 0;
}

// Get user progress
export function getUserProgress(): UserProgress {
  const tasks = getUserTasks();
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalTasks = tasks.length;
  const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return {
    completedTasks,
    totalTasks,
    percentage
  };
}

// Clear all data
export function clearUserData(): void {
  localStorage.removeItem(STORAGE_KEYS.USER_GOAL);
  localStorage.removeItem(STORAGE_KEYS.USER_ANSWERS);
  localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
  localStorage.removeItem(STORAGE_KEYS.USER_TASKS);
}
