// ============================================================
// Copilot / 会话类型
// ============================================================
import type { PlanComparisonResponse } from './api';

// ============================================================
// 会话数据模型
// ============================================================

/** 会话消息 */
export interface Message {
  role: 'user' | 'assistant';
  content: string;
  isHtml?: boolean;
  timestamp: number;
}

/** Copilot 会话 */
export interface Session {
  id: string;
  title: string;
  createdAt: string;
  finalXml: string;
  planDetails: { week: string; items: string[] }[];
  agentId?: string;
  sessionId?: string;
  quickOptions: string[];
}

/** 打开图表的载荷 */
export interface OpenGraphPayload {
  optionId?: string;
}

/** AI 回复结构 */
export interface AIReply {
  thinking: string;
  question: string;
  options: string[];
  rawContent: string;
  planComparison?: PlanComparisonResponse;
  extraText?: string;
}

/** JSON 解析后的 AI 回复类型（用于判断渲染格式） */
export type ParsedJSONResponse =
  | { type: 'plan-options'; planComparison: PlanComparisonResponse }
  | { type: 'question'; question: string; options: string[] }
  | { type: 'unknown' }
  | null;

// ============================================================
// 组件 Props 类型
// ============================================================

/** 消息项 Props */
export interface MessageItemProps {
  message: Message;
  onOptionSelect?: (option: string) => void;
  onPlanOptionSelect?: (optionId: string, optionIndex: number) => void;
  optionsDisabled?: boolean;
}

/** 方案对比消息 Props */
export interface PlanComparisonMessageProps {
  data: PlanComparisonResponse;
  disabled: boolean;
  onSelectOption?: (optionId: string, optionIndex: number) => void;
}

/** 快捷选项 Props */
export interface QuickOptionsProps {
  options: string[];
  onSelect: (option: string) => void;
  disabled: boolean;
}

// ============================================================
// 旧版类型（兼容用）
// ============================================================
export interface QuestionOption {
  text: string;
  icon: string;
}

export interface Question {
  question: string;
  options: QuestionOption[];
}

export interface UserProfile {
  goal: string;
  recommendTitle: string;
  answers: number[];
  createdAt: string;
}

export interface Task {
  id: string;
  week: string;
  day: string;
  title: string;
  status: 'pending' | 'completed';
  createdAt: string;
  completedAt?: string;
}

export interface LocalUserProgress {
  completedTasks: number;
  totalTasks: number;
  percentage: number;
}


export type { PathNode, ComparisonItem, PlanComparisonResponse, PlanOption } from './api';