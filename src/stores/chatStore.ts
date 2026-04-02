/**
 * AI 对话状态管理
 */
import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  /** 标记此消息是否包含图表数据 */
  hasGraph?: boolean;
  timestamp: number;
}

interface ChatState {
  /** 对话消息列表 */
  messages: ChatMessage[];
  /** 当前会话 ID */
  sessionId: string | null;
  /** 加载状态 */
  isLoading: boolean;

  /** 添加消息 */
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  /** 设置消息列表 */
  setMessages: (messages: ChatMessage[]) => void;
  /** 设置会话 ID */
  setSessionId: (sessionId: string) => void;
  /** 设置加载状态 */
  setLoading: (loading: boolean) => void;
  /** 清空所有消息 */
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  sessionId: null,
  isLoading: false,

  addMessage: (message) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          ...message,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
        },
      ],
    })),

  setMessages: (messages) => set({ messages }),

  setSessionId: (sessionId) => set({ sessionId }),

  setLoading: (isLoading) => set({ isLoading }),

  clearMessages: () => set({ messages: [] }),
}));
