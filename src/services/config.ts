// API 配置

// 从环境变量获取 API 基础路径
export const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
export const TIMEOUT = 10000;

// API 配置对象
export const apiConfig = {
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
};

// 存储相关的 key
export const STORAGE_KEYS = {
  USER: 'code_user',
  TOKEN: 'token',
} as const;
