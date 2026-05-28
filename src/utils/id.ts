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
