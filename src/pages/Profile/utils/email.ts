/**
 * 邮箱格式校验工具
 */

/** 邮箱格式校验 */
export const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);