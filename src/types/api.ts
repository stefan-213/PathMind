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

// ==================== 日程表相关（后端 DTO）====================

/** 后端返回的日程子任务 DTO */
export interface SubScheduleDTO {
  id?: number;
  scheduleId?: number;
  step?: string;
  task?: string;
  focus?: string;
  estimatedTime?: string;
  status?: string;
  createTime?: string;
}

/** 后端返回的日程表 DTO */
export interface ScheduleDTO {
  id?: number;
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

// ==================== 日程表相关（前端模型）====================

/** 日程子任务 */
export interface SubSchedule {
  id?: number;
  parentId?: number;
  day: string;
  task: string;
  taskGoal: string;
  description?: string | null;
  status: number;  // 0: pending, 1: completed
  completedAt?: string | null;
}

/** 日程表项（创建时用） */
export interface ScheduleItem {
  title: string;
  time: string;
  content: string;
  scheduleId?: string;
  tasks: Omit<SubSchedule, 'id' | 'parentId'>[];
}

/** 日程表（完整结构） */
export interface Schedule {
  id: number;
  scheduleId: string;
  userId: string;
  title: string;
  time: string;
  content: string;
  status: number;
  subScheduleList: SubSchedule[];
}

/** 创建日程表请求 */
export interface CreateScheduleRequest {
  data: ScheduleItem[];
}

/** 更新日程表请求 */
export interface UpdateScheduleRequest {
  id: number;
  scheduleId: string;
  userId: string;
  title: string;
  time: string;
  content: string;
  status: number;
  subScheduleList: SubSchedule[];
}

/** 更新子任务请求 */
export interface UpdateSubTaskRequest {
  id: number;
  parentId: number;
  day: string;
  task: string;
  taskGoal: string;
  description?: string | number | null;
  status: number;
  completedAt?: string | null;
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

export interface ProposalScheduleItem {
  week: string;
  items: string[];
}

export interface GeneratedProposal {
  title: string;
  description: string;
  mainPath: string[];
  branches: PathNode[];
  comparison: ComparisonItem[];
  schedule: ProposalScheduleItem[];
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

// ==================== 智能体相关 ====================

/** 智能体 */
export interface Agent {
  agentId: string;
  agentName: string;
  agentDesc: string;
}

// ==================== 知识库相关 ====================

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

// ==================== Copilot相关 ====================

/** 咨询会话用户画像 */
export interface ConsultUserProfile {
  goal: string;
  experience: string;
  timeframe: string;
  scale: string;
}

/** 咨询消息 */
export interface ConsultMessage {
  role: 'user' | 'assistant';
  content: string;
  isHtml?: boolean;
  timestamp: number;
}

/** 计划详情 */
export interface PlanDetail {
  week: string;       // 例如："第1周"、"第2周"
  items: string[];    // 例如：["Day1-2: Python基础", "Day3-4: LangChain入门"]
}

/** 咨询会话 */
export interface ConsultSession {
  id: string;
  title: string;
  createdAt: string;
  messages: ConsultMessage[];
  userProfile: ConsultUserProfile;
  currentStep: 'ASK_GOAL' | 'ASK_EXPERIENCE' | 'ASK_TIMEFRAME' | 'ASK_SCALE' | 'RESULT';
  finalXml: string;        // draw.io XML 格式图表
  planDetails: PlanDetail[]; // 计划表详情
}

/** 咨询请求 */
export interface ConsultRequest {
  sessionId: string;
  message: string;
  step: string;
  profile: ConsultUserProfile;
}

/** 咨询响应 */
export interface ConsultResponse {
  message: string;
  isHtml: boolean;
  nextStep: string;
  updatedProfile: ConsultUserProfile;
  finalXml?: string;        // draw.io XML 格式图表（RESULT 步骤时返回）
  planDetails?: PlanDetail[]; // 计划表详情（RESULT 步骤时返回）
}

// ==================== 个人中心相关 ====================

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
