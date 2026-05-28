export interface CopilotSessionResource {
  id: string;
  sessionId: string;
  title: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

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
