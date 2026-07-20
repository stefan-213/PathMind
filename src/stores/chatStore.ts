/**
 * AI 对话状态管理
 */
import { create } from 'zustand';
import { createId } from '../utils/id';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  /** 标记此消息是否包含图表数据 */
  hasGraph?: boolean;
  /** 标记此消息是否包含 HTML 内容 */
  isHtml?: boolean;
  timestamp: number;
}

/** 满意度状态 */
export type SatisfactionState = 'idle' | 'waiting' | 'satisfied' | 'dissatisfied';

interface ChatState {
  /** 按 sessionId 隔离的消息列表 */
  messagesBySession: Record<string, ChatMessage[]>;
  /** 当前活跃会话 ID */
  activeSessionId: string | null;
  /** 加载状态 */
  isLoading: boolean;
  /** 满意度状态 */
  satisfactionState: SatisfactionState;
  /** 按会话隔离的快捷选项 */
  quickOptionsBySession: Record<string, string[]>;

  /** 添加消息（仅添加到当前 activeSessionId 对应的消息数组） */
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  /** 获取当前会话的消息列表 */
  getCurrentMessages: () => ChatMessage[];
  /** 设置活跃会话 ID（自动为新 sessionId 创建空槽位） */
  setActiveSessionId: (sessionId: string) => void;
  /** 为指定会话设置消息列表（用于加载历史消息） */
  setMessagesForSession: (sessionId: string, messages: ChatMessage[]) => void;
  /** 设置加载状态 */
  setLoading: (loading: boolean) => void;
  /** 清空当前会话的消息 */
  clearCurrentMessages: () => void;
  /** 清空所有会话消息 */
  clearAllMessages: () => void;
  /** 设置当前会话的快捷选项 */
  setQuickOptions: (options: string[]) => void;
  /** 获取当前会话的快捷选项 */
  getCurrentQuickOptions: () => string[];
  /** 设置满意度状态 */
  setSatisfactionState: (state: SatisfactionState) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messagesBySession: {},
  activeSessionId: null,
  isLoading: false,
  satisfactionState: 'idle',
  quickOptionsBySession: {},

  addMessage: (message) =>
    set((state) => {
      const sessionId = state.activeSessionId;
      if (!sessionId) return state;

      const sessionMessages = state.messagesBySession[sessionId] ?? [];
      return {
        messagesBySession: {
          ...state.messagesBySession,
          [sessionId]: [
            ...sessionMessages,
            {
              ...message,
              id: createId('message'),
              timestamp: Date.now(),
            },
          ],
        },
      };
    }),

  getCurrentMessages: () => {
    const state = get();
    if (!state.activeSessionId) return [];
    return state.messagesBySession[state.activeSessionId] ?? [];
  },

  setActiveSessionId: (sessionId) =>
    set((state) => {
      const newMessagesBySession = { ...state.messagesBySession };
      const newQuickOptionsBySession = { ...state.quickOptionsBySession };

      // Auto-create empty slots for new sessionId if not exist
      if (!newMessagesBySession[sessionId]) {
        newMessagesBySession[sessionId] = [];
      }
      if (!newQuickOptionsBySession[sessionId]) {
        newQuickOptionsBySession[sessionId] = [];
      }

      return {
        activeSessionId: sessionId,
        messagesBySession: newMessagesBySession,
        quickOptionsBySession: newQuickOptionsBySession,
      };
    }),

  setMessagesForSession: (sessionId, messages) =>
    set((state) => ({
      messagesBySession: {
        ...state.messagesBySession,
        [sessionId]: messages,
      },
    })),

  setLoading: (isLoading) => set({ isLoading }),

  clearCurrentMessages: () =>
    set((state) => {
      if (!state.activeSessionId) return state;
      const { [state.activeSessionId]: _, ...restMessages } = state.messagesBySession;
      return {
        messagesBySession: restMessages,
        satisfactionState: 'idle',
      };
    }),

  clearAllMessages: () =>
    set({
      messagesBySession: {},
      quickOptionsBySession: {},
      satisfactionState: 'idle',
    }),

  setQuickOptions: (options) =>
    set((state) => {
      if (!state.activeSessionId) return state;
      return {
        quickOptionsBySession: {
          ...state.quickOptionsBySession,
          [state.activeSessionId]: options,
        },
      };
    }),

  getCurrentQuickOptions: () => {
    const state = get();
    if (!state.activeSessionId) return [];
    return state.quickOptionsBySession[state.activeSessionId] ?? [];
  },

  setSatisfactionState: (satisfactionState) => set({ satisfactionState }),
}));