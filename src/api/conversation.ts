/**
 * 会话对话 API 服务
 * 统一管理会话和对话
 */
import { get, post } from './axios';
import type { Agent } from '../types/api';

// ==================== 智能体相关 ====================

/**
 * 获取智能体列表
 */
export const getAgents = () => {
  return get<{
    code: string;
    info: string;
    data: Agent[];
  }>('/api/agent/list');
};



/**
 * 创建 AI 对话会话
 */
export const createChatSession = (agentId: string) => {
  return post<{
    code: string;
    info: string;
    data: {
      sessionId: string;
    };
  }>('/api/agent/createSession', { agentId });
};
/**
 * 删除 AI 对话会话
 */
export const deleteChatSession = (sessionId: string, agentId: string) => {
  return post<{
    code: string;
    info: string;
  }>('/api/agent/deleteSession', { sessionId, agentId });
};

/**
 * 获取会话列表
 */
export const getChatSessions = (agentId: string) => {
  return post<{
    code: string;
    info: string;
    data: Record<string, string>; // { sessionId: title }
  }>('/api/agent/getSessionList', { agentId });
};
/**
 * 流式对话（AI 助手）
 */
// export const chatStream = (data: {
//   agentId: string;
//   sessionId: string;
//   message: string;
// }) => {
//   return post<{ message: string; graphData?: unknown }>('/api/agent/chatStream', data);
// };

/**
 * 用户咨询助手（获取用户信息）
 */
export const consultation = (data: {
  agentId: string;
  sessionId: string;
  message: string;
}) => {
  return post<{
    message: string;
  }>('/api/agent/consultation', data);
};

/**
 * 获取会话记录
 */
export const getChatHistory = (data: {
  sessionId: string;
}) => {
  return post<{
    code: string;
    info: string;
    data: {
      sessionId: string;
      role: 'user' | 'model';
      content: string;
    }[];
  }>('/api/agent/transcript', data);
};