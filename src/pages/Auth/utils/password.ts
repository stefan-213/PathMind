export const getPasswordStrength = (pwd: string): { level: number; text: string } => {
  if (!pwd) return { level: 0, text: '' };
  if (pwd.length < 6) return { level: 1, text: '太短' };
  if (pwd.length < 8) return { level: 2, text: '一般' };
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) {
    return { level: 4, text: '强' };
  }
  if (pwd.length >= 8 && (/[a-zA-Z]/.test(pwd) || /[0-9]/.test(pwd))) {
    return { level: 3, text: '中等' };
  }
  return { level: 2, text: '一般' };
};