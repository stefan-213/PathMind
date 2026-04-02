/**
 * AI API 服务
 */
import { get, post } from './axios';
import type {
  GenerateProposalRequest,
  GeneratedProposal,
  AIChatMessage,
  AIChatRequest
} from '../types/api';
import type { GraphData } from '../types/graph';

/**
 * 生成技术方案
 */
export const generateProposal = (data: GenerateProposalRequest) => {
  return post<GeneratedProposal>('/api/ai/generate-proposal', data);
};

/**
 * 重新生成方案
 */
export const regenerateProposal = (goalId: string) => {
  return post<GeneratedProposal>(`/api/ai/regenerate/${goalId}`);
};

/**
 * 生成学习任务
 */
export const generateTasks = (goalId: string, schedule: { week: string; items: string[] }[]) => {
  return post<{ tasks: any[] }>('/api/ai/generate-tasks', { goalId, schedule });
};

/**
 * 创建会话
 */
export const createSession = (agentId: string) => {
  return post<{ sessionId: string }>('/api/agent/createSession', { agentId });
};

/**
 * AI 问答聊天
 * 返回对话消息和可选的图表数据
 */
export const chatWithAI = (data: AIChatRequest) => {
  return post<{ message: string; graphData?: GraphData }>('/api/agent/chatStream', data);
};

/**
 * 获取对话历史
 */
export const getChatHistory = (goalId: string) => {
  return get<AIChatMessage[]>('/api/ai/chat/history', { goalId });
};

/**
 * 清除对话历史
 */
export const clearChatHistory = (goalId: string) => {
  return post<void>('/api/ai/chat/clear', { goalId });
};

/**
 * 推荐学习路径
 */
export const recommendPath = (goal: string) => {
  return get<string[]>('/api/ai/recommend-path', { goal });
};
