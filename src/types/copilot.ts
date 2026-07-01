// ============================================================
// Copilot / 会话类型
// ============================================================
// 注意：PathNode、ComparisonItem 与 api.ts 重复，已迁移至 api.ts，本文件 re-export 保持向后兼容

// STATUS: UNUSED — 未找到任何调用点
export interface QuestionOption {
  text: string;
  icon: string;
}

// STATUS: UNUSED — 未找到任何调用点
export interface Question {
  question: string;
  options: QuestionOption[];
}

// 注意：ResultData 已移除（未发现任何使用点，为死代码）
// 如需使用，请从 api.ts 引入 PathNode + ComparisonItem 后自行组合

export interface UserProfile {
  goal: string;
  recommendTitle: string;
  answers: number[];
  createdAt: string;
}

// 注意：此 Task 类型与 api.ts 的 UserTask 不同（用途/结构均不同）
// api.ts.UserTask 用于后端任务系统，此处 Task 用于本地任务状态管理
export interface Task {
  id: string;
  week: string;
  day: string;
  title: string;
  status: 'pending' | 'completed';
  createdAt: string;
  completedAt?: string;
}

// 注意：此 LocalUserProgress 与 api.ts.UserProgress 不同（api.ts 版本有 id/userId/goalId/streak 等字段）
// 此处为简化版，仅用于本地进度统计
export interface LocalUserProgress {
  completedTasks: number;
  totalTasks: number;
  percentage: number;
}

// ============================================================
// 向后兼容 re-export（避免直接 import from ./api 破坏现有代码）
// ============================================================
export type { PathNode, ComparisonItem } from './api';

