/**
 * Copilot 会话数据处理工具
 */

import { isRecord } from './typeGuards';

export interface CopilotSessionResource {
  id: string;
  sessionId: string;
  title: string;
}

export const normalizeCopilotSessionMap = (
  value: unknown,
): CopilotSessionResource[] => {
  if (!isRecord(value)) return [];

  return Object.entries(value)
    .filter(([sessionId]) => sessionId.trim().length > 0)
    .map(([sessionId, title]) => {
      const normalizedTitle =
        typeof title === 'string' && title.trim() ? title.trim() : '未命名会话';

      return {
        id: sessionId,
        sessionId,
        title: normalizedTitle,
      };
    });
};
