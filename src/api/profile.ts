/**
 * 个人中心相关 API
 * 当前返回 mock 数据，后端接口提供后替换为真实 HTTP 调用
 */
import type { ApiResponse, Achievement, StudyStats, UserPlan } from '../types/api';

// ==================== Mock 数据 ====================
const mockAchievements: Achievement[] = [
  { id: 1, name: '初学者', icon: 'fa-seedling', unlocked: true },
  { id: 2, name: '坚持不懈', icon: 'fa-fire', unlocked: true },
  { id: 3, name: '半程达人', icon: 'fa-running', unlocked: true },
  { id: 4, name: '学无止境', icon: 'fa-star', unlocked: true },
  { id: 5, name: '全栈探索者', icon: 'fa-laptop-code', unlocked: false },
  { id: 6, name: '技术先锋', icon: 'fa-rocket', unlocked: false },
];

const mockPlans: UserPlan[] = [
  {
    id: 1,
    name: 'Python 基础入门',
    period: '2024.02 - 2024.03',
    status: 'completed',
    date: '2024.03.10',
    desc: '学习Python基础语法、环境搭建、Git版本控制，完成8个任务并获得证书',
    completedTasks: 8,
    totalTasks: 8,
    weeks: [
      { weekNum: 1, date: '2024.02.15', title: '环境搭建与基础语法', completed: 3, total: 3 },
      { weekNum: 2, date: '2024.02.22', title: '数据结构与函数', completed: 3, total: 3 },
      { weekNum: 3, date: '2024.03.01', title: '面向对象与文件操作', completed: 2, total: 2 },
    ],
  },
  {
    id: 2,
    name: 'AI 应用开发 · RAG 方案',
    period: '2024.03 - 2024.04',
    status: 'completed',
    date: '2024.04.14',
    desc: '学习LangChain、向量数据库、RAG技术，完成24个任务，获得成就「学无止境」',
    completedTasks: 24,
    totalTasks: 24,
    weeks: [
      { weekNum: 1, date: '2024.03.10', title: 'LangChain 基础', completed: 6, total: 6 },
      { weekNum: 2, date: '2024.03.17', title: '向量数据库与嵌入', completed: 6, total: 6 },
      { weekNum: 3, date: '2024.03.24', title: 'RAG 检索与优化', completed: 6, total: 6 },
      { weekNum: 4, date: '2024.04.01', title: '项目实战与部署', completed: 6, total: 6 },
    ],
  },
  {
    id: 3,
    name: '全栈进阶 · Next.js + FastAPI',
    period: '2024.04 - 进行中',
    status: 'active',
    date: '进行中',
    desc: '学习Next.js 14、FastAPI后端开发，当前进度60%，预计5周完成',
    completedTasks: 12,
    totalTasks: 20,
    weeks: [
      { weekNum: 1, date: '2024.04.10', title: 'Python 环境搭建 + 基础语法', completed: 5, total: 5 },
      { weekNum: 2, date: '2024.04.17', title: 'LangChain 入门 + 提示词工程', completed: 4, total: 4 },
      { weekNum: 3, date: '2024.04.24', title: 'FastAPI 部署 + 前端集成', completed: 3, total: 6, active: true },
    ],
  },
  {
    id: 4,
    name: 'React 进阶 · Hooks + Redux',
    period: '2024.05 - 进行中',
    status: 'active',
    date: '进行中',
    desc: '深入学习React Hooks、状态管理Redux、性能优化等高级主题',
    completedTasks: 4,
    totalTasks: 15,
    weeks: [
      { weekNum: 1, date: '2024.05.06', title: 'Hooks 深入与自定义Hooks', completed: 4, total: 4 },
      { weekNum: 2, date: '2024.05.13', title: 'Redux 状态管理', completed: 0, total: 5, active: true },
      { weekNum: 3, date: '2024.05.20', title: '性能优化与测试', completed: 0, total: 6 },
    ],
  },
];

const mockStats: StudyStats = {
  completedTasks: mockPlans.reduce((sum, p) => sum + p.completedTasks, 0),
  studyDays: 79,
  unlockedAchievements: mockAchievements.filter((a) => a.unlocked).length,
  totalGoals: mockPlans.filter((p) => p.status === 'completed').length,
};

// ==================== API 函数 ====================

/** 获取用户学习计划列表 */
export const getPlans = (): Promise<ApiResponse<UserPlan[]>> => {
  // TODO: 替换为真实接口
  // return get<UserPlan[]>('/api/profile/plans');
  return Promise.resolve({ success: true, data: mockPlans });
};

/** 获取用户成就列表 */
export const getAchievements = (): Promise<ApiResponse<Achievement[]>> => {
  // TODO: 替换为真实接口
  // return get<Achievement[]>('/api/profile/achievements');
  return Promise.resolve({ success: true, data: mockAchievements });
};

/** 获取学习统计 */
export const getStudyStats = (): Promise<ApiResponse<StudyStats>> => {
  // TODO: 替换为真实接口
  // return get<StudyStats>('/api/profile/stats');
  return Promise.resolve({ success: true, data: mockStats });
};

/** 删除学习目标 */
export const deleteGoal = (_goalId: number): Promise<ApiResponse<void>> => {
  // TODO: 替换为真实接口
  // return del<void>(`/api/profile/goals/${goalId}`);
  return Promise.resolve({ success: true });
};
