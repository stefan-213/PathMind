/**
 * AI API 服务
 */
import { get, post } from './axios';
import type {
  GenerateProposalRequest,
  GeneratedProposal,
  AIChatMessage,
  AIChatRequest,
  ApiResponse
} from '../types/api';

/**
 * 生成技术方案
 */
export const generateProposal = (data: GenerateProposalRequest) => {
  return post<GeneratedProposal>('/ai/generate-proposal', data);
};

/**
 * 重新生成方案
 */
export const regenerateProposal = (goalId: string) => {
  return post<GeneratedProposal>(`/ai/regenerate/${goalId}`);
};

/**
 * 生成学习任务
 */
export const generateTasks = (goalId: string, schedule: { week: string; items: string[] }[]) => {
  return post<{ tasks: any[] }>('/ai/generate-tasks', { goalId, schedule });
};

/**
 * AI 问答聊天
 */
export const chatWithAI = (data: AIChatRequest) => {
  return post<{ message: AIChatMessage }>('/ai/chat', data);
};

/**
 * 获取对话历史
 */
export const getChatHistory = (goalId: string) => {
  return get<AIChatMessage[]>('/ai/chat/history', { goalId });
};

/**
 * 清除对话历史
 */
export const clearChatHistory = (goalId: string) => {
  return post<void>('/ai/chat/clear', { goalId });
};

/**
 * 推荐学习路径
 */
export const recommendPath = (goal: string) => {
  return get<string[]>('/ai/recommend-path', { goal });
};
