/**
 * 跨页面会话状态管理
 * 用于 ConsultPage 向 Graph/Tasks 传递当前会话上下文
 */
import { create } from 'zustand';

export interface ConsultContext {
  optionId?: string;
  goal?: string;
  base?: string;
}

interface SessionState {
  /** 当前会话 ID */
  currentSessionId: string | null;
  /** 当前 Agent ID */
  currentAgentId: string;
  /** 从 Consult 跳转时携带的上下文 */
  consultContext: ConsultContext | null;

  setCurrentSession: (
    sessionId: string,
    agentId?: string,
    context?: ConsultContext
  ) => void;
  clearCurrentSession: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  currentSessionId: null,
  currentAgentId: '100003',
  consultContext: null,

  setCurrentSession: (sessionId, agentId = '100003', context = undefined) =>
    set({
      currentSessionId: sessionId,
      currentAgentId: agentId,
      consultContext: context ?? null,
    }),

  clearCurrentSession: () =>
    set({
      currentSessionId: null,
      currentAgentId: '100003', // reset to default
      consultContext: null,
    }),
}));