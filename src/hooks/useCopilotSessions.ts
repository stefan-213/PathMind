/**
 * useCopilotSessions - Copilot 会话列表 Hook
 *
 * 【功能】加载和管理 Copilot 智能体的会话列表，支持与 sessionStore 同步
 *
 * 【使用方式】
 *
 * 1. 基础用法（不同步 store）
 * const { sessions, activeSessionId, setActiveSessionId, isLoading, error, reload } = useCopilotSessions();
 *
 * 2. 同步 sessionStore（推荐）
 * const { sessions, activeSessionId, setActiveSessionId, isLoading, error, reload } = useCopilotSessions({
 *   syncWithStore: true  // 自动同步 sessionStore
 * });
 *
 * 【sessionStore 同步行为】
 * - 组件挂载时：从 sessionStore 读取 currentSessionId 作为初始值
 * - 设置会话时：同时更新 sessionStore.currentSessionId
 * - 外部更新：sessionStore 变化时自动同步到 activeSessionId
 *
 * 【API】
 * - sessions: CopilotSession[] - 会话列表
 * - activeSessionId: string | null - 当前会话 ID
 * - setActiveSessionId: (id: string | null) => void - 设置当前会话（同步时更新 store）
 * - isLoading: boolean - 是否加载中
 * - error: string | null - 错误信息
 * - reload: () => void - 重新加载
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getChatList } from '../api/conversation';
import { AGENT_IDS } from '../constants';
import { normalizeCopilotSessionMap, type CopilotSessionResource } from '../utils';
import { useSessionStore } from '../stores/sessionStore';

/** Hook 配置 */
export interface UseCopilotSessionsOptions {
  /** 是否与 sessionStore 同步 */
  syncWithStore?: boolean;
}

/** Hook 返回值 */
export interface UseCopilotSessionsReturn {
  /** 会话列表 */
  sessions: CopilotSessionResource[];
  /** 当前会话 ID */
  activeSessionId: string | null;
  /** 设置当前会话 ID */
  setActiveSessionId: (id: string | null) => void;
  /** 是否加载中 */
  isLoading: boolean;
  /** 错误信息 */
  error: string | null;
  /** 重新加载 */
  reload: () => void;
}

/**
 * Copilot 会话列表 Hook
 */
export function useCopilotSessions(
  options: UseCopilotSessionsOptions = {}
): UseCopilotSessionsReturn {
  const { syncWithStore = false } = options;

  const [sessions, setSessions] = useState<CopilotSessionResource[]>([]);
  const [activeSessionId, setActiveSessionIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // sessionStore
  const storeSessionId = useSessionStore((s) => s.currentSessionId);
  const setStoreSession = useSessionStore((s) => s.setCurrentSession);

  // 用 ref 保存 storeSessionId，避免 loadSessions 依赖变化时重新加载
  const storeSessionIdRef = useRef(storeSessionId);
  useEffect(() => {
    storeSessionIdRef.current = storeSessionId;
  }, [storeSessionId]);

  /**
   * 加载会话列表
   */
  const loadSessions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getChatList(AGENT_IDS.COPILOT);

      if (response.success === false) {
        throw new Error(response.error || '会话列表加载失败');
      }

      const nextSessions = normalizeCopilotSessionMap(response.data);

      setSessions(nextSessions);

      // 确定初始选中的会话
      let initialSessionId: string | null = null;

      if (syncWithStore && storeSessionIdRef.current) {
        // 同步模式：优先使用 store 中的会话 ID
        initialSessionId = nextSessions.some((s) => s.sessionId === storeSessionIdRef.current)
          ? storeSessionIdRef.current
          : nextSessions[0]?.sessionId ?? null;
      } else if (!syncWithStore) {
        // 非同步模式：保持当前选中或选择第一个
        initialSessionId = nextSessions[0]?.sessionId ?? null;
      }

      setActiveSessionIdState(initialSessionId);
    } catch (err) {
      console.error('Load copilot sessions failed:', err);
      setError(err instanceof Error ? err.message : '会话列表加载失败');
    } finally {
      setIsLoading(false);
    }
  }, [syncWithStore]);

  /**
   * 设置当前会话 ID
   */
  const setActiveSessionId = useCallback(
    (id: string | null) => {
      setActiveSessionIdState(id);

      // 同步到 sessionStore
      if (syncWithStore && id) {
        setStoreSession(id);
      }
    },
    [syncWithStore, setStoreSession]
  );

  // 组件挂载时加载
  useEffect(() => {
    let isMounted = true;

    if (isMounted) {
      void loadSessions();
    }

    return () => {
      isMounted = false;
    };
  }, [loadSessions]);

  // 监听 sessionStore 变化（外部更新时同步）
  useEffect(() => {
    if (syncWithStore && storeSessionId && storeSessionId !== activeSessionId) {
      // 检查会话是否仍在列表中
      const sessionExists = sessions.some((s) => s.sessionId === storeSessionId);
      if (sessionExists) {
        setActiveSessionIdState(storeSessionId);
      }
    }
  }, [syncWithStore, storeSessionId, sessions, activeSessionId]);

  return {
    sessions,
    activeSessionId,
    setActiveSessionId,
    isLoading,
    error,
    reload: loadSessions,
  };
}
