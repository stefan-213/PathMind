/**
 * API 开关配置
 * 开发环境使用 Mock API，生产环境使用真实 API
 */
import { mockAuth, mockGoalsApi, mockTasksApi, mockAI } from './mock';
import * as realAuth from './auth';
import * as realGoals from './goals';
import * as realTasks from './tasks';
import * as realAI from './ai';

// 设置为 true 使用 Mock API，false 使用真实 API
const USE_MOCK_API = true;

// 导出配置供其他地方使用
export const isMockMode = () => USE_MOCK_API;

// 根据环境导出对应 API
export const authApi = USE_MOCK_API ? mockAuth : realAuth;
export const goalsApi = USE_MOCK_API ? mockGoalsApi : realGoals;
export const tasksApi = USE_MOCK_API ? mockTasksApi : realTasks;
export const aiApi = USE_MOCK_API ? mockAI : realAI;
