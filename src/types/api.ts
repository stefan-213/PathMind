/**
 * PathMind API 类型定义
 */

// ==================== Auth ====================

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

// ==================== Tasks / Schedule ====================

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

/** 后端返回的日程子任务 DTO */
export interface SubScheduleDTO {
  id?: string;
  scheduleId?: string;
  step?: string;
  task?: string;
  focus?: string;
  estimatedTime?: string;
  status?: string;
  createTime?: string;
}

/** 后端返回的日程表 DTO */
export interface ScheduleDTO {
  id?: string;
  scheduleName?: string;
  userId?: string;
  sessionId?: string;
  title?: string;
  time?: string;
  content?: string;
  status?: string;
  createTime?: string;
  subSchedules?: SubScheduleDTO[];
}

/** 日程子任务 */
export interface SubSchedule {
  id?: string | number;
  parentId?: string | number;
  day: string;
  task: string;
  taskGoal: string;
  description?: string | null;
  status: number;  // 0: pending, 1: completed
  completedAt?: string | null;
}

/** 日程表（完整结构） */
export interface Schedule {
  id?: string;
  scheduleId: string;
  userId: string;
  scheduleName?: string;
  title: string;
  time: string;
  content: string;
  status: number;
  subScheduleList: SubSchedule[];
}

// ==================== AI / Graph ====================

export interface GenerateProposalRequest {
  goal: string;
  answers: QuestionAnswer[];
}

export interface QuestionAnswer {
  questionId: string;
  question: string;
  selectedOption: string;
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

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface PlanOption {
  id: string;
  name: string;
  core_idea: string;
  suitable_for: string;
  path: string[];
  pros: string[];
  cons: string[];
  cost: string;
  difficulty: string;
}

export interface RecommendedPlanOption {
  option_id: string;
  reason: string;
}

export interface PlanComparisonResponse {
  options: PlanOption[];
  recommended: RecommendedPlanOption;
  decision_points: string[];
}

export interface GeneratePlanByOptionRequest {
  agentId: string;
  sessionId: string;
  message: string;
}

export interface GeneratePlanByOptionResponse {
  sessionId?: string;
  messageId?: string | null;
  role?: string;
  content?: string;
  message?: string;
  goal?: string;
  base?: string;
}

// ==================== Knowledge Base ====================

/** 知识库文件（对应后端 KnowledgeDocumentResponseDTO） */
export interface KnowledgeBaseFile {
  id: string;
  name: string;
  size?: number;
  type?: string;
  createdAt?: string;
}

/** 知识库 */
export interface KnowledgeBase {
  id: string;
  name: string;
  files: KnowledgeBaseFile[];
  createdAt?: string;
  updatedAt?: string;
}

/** 新增知识库请求 */
export interface CreateKnowledgeBaseRequest {
  name: string;
  description?: string;
}

/** 修改知识库请求 */
export interface UpdateKnowledgeBaseRequest {
  id: string;
  name: string;
  description?: string;
}

// ==================== Profile ====================

/** 成就徽章 */
export interface Achievement {
  id: number;
  name: string;
  icon: string;
  unlocked: boolean;
  description?: string;      // 成就解锁条件描述
  unlockedAt?: string;       // 解锁时间
}

/** 计划周次 */
export interface PlanWeek {
  weekNum: number;
  date: string;
  title: string;
  completed: number;
  total: number;
  active?: boolean;
}

/** 用户学习计划（前端展示层） */
export interface UserPlan {
  id: number;
  name: string;
  period: string;
  status: 'active' | 'completed';
  date: string;
  desc: string;
  completedTasks: number;
  totalTasks: number;
  weeks: PlanWeek[];
}

/** 学习统计 */
export interface StudyStats {
  completedTasks: number;
  studyDays: number;
  unlockedAchievements: number;
  totalGoals: number;
}

// ==================== Common ====================

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

// ==================== Agent ====================

/** 智能体 */
export interface Agent {
  agentId: string;
  agentName: string;
  agentDesc: string;
}
