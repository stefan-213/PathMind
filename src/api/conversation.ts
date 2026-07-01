/**
 * 会话对话 API 服务
 * 统一管理会话和对话
 */
import { get, post } from './axios';
import type { Agent } from '../types/api';
import { AGENT_IDS } from '../constants';

const DEFAULT_TRANSCRIPT_AGENT_ID = AGENT_IDS.COPILOT;

// ==================== 智能体相关 ====================

// STATUS: UNUSED — 未找到任何调用点，请确认后删除
/** 获取智能体列表 */
export const getAgents = () => {
  return get<{
    code: string;
    info: string;
    data: Agent[];
  }>('/api/agent/list');
};

/** 创建 AI 对话会话 */
export const createChatSession = (agentId: string) => {
  return post<{
    code: string;
    info: string;
    data: {
      sessionId: string;
    };
  }>('/api/agent/createSession', { agentId });
};

/** 删除 AI 对话会话 */
export const deleteChatSession = (sessionId: string, agentId: string) => {
  return post<{
    code: string;
    info: string;
  }>('/api/agent/deleteSession', { sessionId, agentId });
};

/** 获取会话列表 */
export const getChatSessions = (agentId: string) => {
  return post<{
    code: string;
    info: string;
    data: Record<string, string>;
  }>('/api/agent/getSessionList', { agentId });
};

/** 用户咨询助手（获取用户信息） */
export const consultation = (data: {
  agentId: string;
  sessionId: string;
  message: string;
}) => {
  return post<{
    content?: string;
    message?: string;
  }>('/api/agent/goal', data);
};





/** 获取会话记录 */
export const getChatHistory = (data: {
  sessionId: string;
  agentId?: string;
}) => {
  const requestData = {
    sessionId: data.sessionId,
    agentId: data.agentId ?? DEFAULT_TRANSCRIPT_AGENT_ID,
  };

  return post<{
    code: string;
    info: string;
    data: {
      sessionId: string;
      role: 'user' | 'model';
      content: string;
    }[];
  }>('/api/agent/transcript', requestData);
};

/** 生成图表计划 */
export const generatePlanByOption = (data: {
  agentId: string;
  sessionId: string;
  message?: string;
}) => {
  return post<{
    content: string;
    sessionId?: string;
  }>('/api/agent/charts', data);
};

/** 获取会话的图表 XML */
export const getXmlGroupBySession = (sessionId: string) => {
  return post<{
    content?: string;
    centent?: string;
    xml?: string;
    sessionId?: string;
  }>('/api/agent/getXml', { sessionId });
};
