/**
 * useCopilotSessions - Copilot 会话列表 Hook
 *
 * 【功能】加载和管理 Copilot 智能体的会话列表
 *
 * 【使用方式】
 *
 * 1. 初始化
 * const {
 *   sessions,           // 会话列表
 *   activeSessionId,    // 当前选中会话 ID
 *   setActiveSessionId, // 设置选中会话
 *   isLoading,          // 是否加载中
 *   error,              // 错误信息
 *   reload,             // 重新加载
 * } = useCopilotSessions();
 *
 * 2. 自动加载
 * - 组件挂载时自动加载会话列表
 * - 组件卸载时自动清理
 *
 * 3. 手动刷新
 * reload(); // 重新加载会话列表
 *
 * 【API】
 * - sessions: CopilotSession[] - 会话列表
 * - activeSessionId: string | null - 当前会话 ID
 * - setActiveSessionId: (id: string | null) => void - 设置当前会话
 * - isLoading: boolean - 是否加载中
 * - error: string | null - 错误信息
 * - reload: () => void - 重新加载
 */

import { useState, useEffect, useCallback } from 'react';
import { getChatList } from '../api/conversation';
import { AGENT_IDS } from '../constants';
import { normalizeCopilotSessionMap, type CopilotSessionResource } from '../utils';

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
export function useCopilotSessions(): UseCopilotSessionsReturn {
  const [sessions, setSessions] = useState<CopilotSessionResource[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      setActiveSessionId((current) => {
        // 如果当前选中的会话还在列表中，保持选中
        if (current && nextSessions.some((s) => s.sessionId === current)) {
          return current;
        }
        // 否则选中第一个会话
        return nextSessions[0]?.sessionId ?? null;
      });
    } catch (err) {
      console.error('Load copilot sessions failed:', err);
      setError(err instanceof Error ? err.message : '会话列表加载失败');
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  return {
    sessions,
    activeSessionId,
    setActiveSessionId,
    isLoading,
    error,
    reload: loadSessions,
  };
}
