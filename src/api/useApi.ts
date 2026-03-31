/**
 * API 开关配置
 * 各模块可独立控制使用 Mock API 或真实 API
 */
import { mockAuth, mockGoalsApi, mockTasksApi, mockAI } from './mock';
import * as realAuth from './auth';
import * as realGoals from './goals';
import * as realTasks from './tasks';
import * as realAI from './ai';

// ================ Mock 开关配置 ================
// 设置为 true 使用 Mock API，false 使用真实 API
const MOCK_AUTH = false;      // 登录/注册
const MOCK_GOALS = true;     // 学习目标
const MOCK_TASKS = true;     // 学习任务
const MOCK_AI = false;        // AI 生成

// 导出配置供其他地方使用
export const isMockMode = (module?: 'auth' | 'goals' | 'tasks' | 'ai') => {
  if (!module) return MOCK_AUTH && MOCK_GOALS && MOCK_TASKS && MOCK_AI;
  switch (module) {
    case 'auth': return MOCK_AUTH;
    case 'goals': return MOCK_GOALS;
    case 'tasks': return MOCK_TASKS;
    case 'ai': return MOCK_AI;
    default: return false;
  }
};

// 根据配置导出对应 API
export const authApi = MOCK_AUTH ? mockAuth : realAuth;
export const goalsApi = MOCK_GOALS ? mockGoalsApi : realGoals;
export const tasksApi = MOCK_TASKS ? mockTasksApi : realTasks;
export const aiApi = MOCK_AI ? mockAI : realAI;
