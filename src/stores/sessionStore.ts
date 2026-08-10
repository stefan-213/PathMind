/**
 * 跨页面会话状态管理
 * 用于 ConsultPage 向 Graph/Tasks 传递当前会话上下文
 */
import { create } from 'zustand';

export interface ConsultContext {
  optionId?: string;
}

interface SessionState {
  /** 当前会话 ID */
  currentSessionId: string | null;
  /** 从 Consult 跳转时携带的上下文 */
  consultContext: ConsultContext | null;

  setCurrentSession: (
    sessionId: string,
    context?: ConsultContext
  ) => void;
  clearCurrentSession: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  currentSessionId: null,
  consultContext: null,

  setCurrentSession: (sessionId, context = undefined) =>
    set({
      currentSessionId: sessionId,
      consultContext: context ?? null,
    }),

  clearCurrentSession: () =>
    set({
      currentSessionId: null,
      consultContext: null,
    }),
}));