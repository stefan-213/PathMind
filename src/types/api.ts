/**
 * PathMind API 类型定义
 */

// ==================== 通用类型 ====================

export interface User {
  id: string;
  email: string;
  username: string;
  phone?: string;
  avatar?: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
  phone?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// ==================== 学习目标相关 ====================

export interface QuestionAnswer {
  questionId: string;
  question: string;
  selectedOption: string;
}

export interface UserGoal {
  id: string;
  userId: string;
  goal: string;
  recommendTitle: string;
  answers: QuestionAnswer[];
  status: 'active' | 'completed' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface CreateGoalRequest {
  goal: string;
}

// ==================== 学习任务相关 ====================

export interface UserTask {
  id: string;
  userId: string;
  goalId: string;
  week: string;
  day: string;
  title: string;
  description?: string;
  status: 'pending' | 'completed';
  order: number;
  createdAt: string;
  completedAt?: string;
}

export interface UserProgress {
  id: string;
  userId: string;
  goalId: string;
  completedTasks: number;
  totalTasks: number;
  percentage: number;
  lastActiveDate: string;
  streak: number;
}

export interface CreateTasksRequest {
  goalId: string;
  schedule: {
    week: string;
    items: string[];
  }[];
}

// ==================== 技术节点相关 ====================

export interface Technology {
  id: string;
  name: string;
  label: string;
  englishName: string;
  category: 'frontend' | 'backend' | 'ai' | 'devops' | 'basic';
  icon: string;
  difficulty: '简单' | '中等' | '高';
  heat: string;
  scene: string;
  description: string;
  tags: string[];
  level: 0 | 1 | 2;
}

export interface TechnologyRelation {
  id: string;
  sourceId: string;
  targetId: string;
  relationType: '依赖' | '进阶' | '替代' | '组合' | '工具';
}

// ==================== AI 生成相关 ====================

export interface GenerateProposalRequest {
  goal: string;
  answers: QuestionAnswer[];
}

export interface PathNode {
  text: string;
  recommended: boolean;
}

export interface ComparisonItem {
  dim: string;
  a: string;
  b: string;
}

export interface ScheduleItem {
  week: string;
  items: string[];
}

export interface GeneratedProposal {
  title: string;
  description: string;
  mainPath: string[];
  branches: PathNode[];
  comparison: ComparisonItem[];
  schedule: ScheduleItem[];
}

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface AIChatRequest {
  agentId: string;
  sessionId: string;
  message: string;
}

// ==================== 收藏与历史 ====================

export interface Favorite {
  id: string;
  userId: string;
  type: 'technology' | 'proposal';
  targetId: string;
  createdAt: string;
}

export interface BrowseHistory {
  id: string;
  userId: string;
  type: 'technology' | 'proposal' | 'goal';
  targetId: string;
  createdAt: string;
}

// ==================== 通用类型 ====================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string>;
}
