/**
 * ID 生成工具
 */

/**
 * 创建唯一 ID
 * @param prefix - ID 前缀，默认为 'id'
 * @returns 唯一标识符字符串
 */
export const createId = (prefix = 'id') => {
  const randomUUID = globalThis.crypto?.randomUUID?.bind(globalThis.crypto);

  if (randomUUID) {
    try {
      return randomUUID();
    } catch {
      // Fall through for non-secure HTTP contexts where randomUUID may be blocked.
    }
  }

  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};
