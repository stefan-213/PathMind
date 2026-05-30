/**
 * Axios 实例配置
 */
import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse } from '../types/api';

const normalizeBaseUrl = (baseUrl?: string) => {
  const trimmedBaseUrl = baseUrl?.trim() ?? '';

  if (!trimmedBaseUrl) {
    return '';
  }

  if (trimmedBaseUrl.startsWith('/') || /^https?:\/\//i.test(trimmedBaseUrl)) {
    return trimmedBaseUrl;
  }

  return `http://${trimmedBaseUrl}`;
};

const BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL);

// 无需认证的接口白名单
const NO_AUTH_WHITELIST = [
  '/api/auth/register',
  '/api/auth/login',
  '/api/user/quitLogin',
];

export const axiosInstance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 3000000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求队列（用于显示全局 loading）
let requestCount = 0;

const startRequest = () => {
  requestCount++;
  document.body.style.cursor = 'wait';
};

const endRequest = () => {
  requestCount--;
  if (requestCount <= 0) {
    requestCount = 0;
    document.body.style.cursor = 'default';
  }
};
const normalizeErrorMessage = (
  value: unknown,
  fallback = '请求失败，请稍后重试',
) => {
  if (typeof value !== 'string') {
    return fallback;
  }

  const optionalMatch = value.match(/^Optional\[(.*)\]$/);

  if (optionalMatch?.[1]) {
    return optionalMatch[1];
  }

  return value || fallback;
};
// 请求拦截器
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    startRequest();

    // 检查是否在白名单中
    const isWhitelisted = NO_AUTH_WHITELIST.some(path => config.url?.includes(path));

    // 从 localStorage 获取 token（非白名单接口才添加）
    if (!isWhitelisted) {
      const token = localStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => {
    endRequest();
    return Promise.reject(error);
  }
);

// 响应拦截器 - 转换后端响应格式
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    endRequest();

    // 转换后端响应格式 { code, info, data } -> { success, data, error }
    const backendResponse = response.data;
    if (backendResponse && typeof backendResponse === 'object' && 'code' in backendResponse) {
      const isSuccess = backendResponse.code === '200' || backendResponse.code === 200;
      response.data = {
        success: isSuccess,
        data: backendResponse.data,
        error: isSuccess
        ? undefined
        : normalizeErrorMessage(backendResponse.info),
      };
    }

    return response;
  },
  (error) => {
    endRequest();

    const { response } = error;

    if (response) {
      // 处理 HTTP 错误码
      switch (response.status) {
        case 401:
          // 未授权，清除 token 并跳转到登录页
          localStorage.removeItem('token');
          window.location.href = '/login';
          break;
        case 403:
          console.error('没有权限访问');
          break;
        case 404:
          console.error('请求的资源不存在');
          break;
        case 500:
          console.error('服务器内部错误');
          break;
        default:
          console.error(response.data?.message || '请求失败');
      }
    } else {
      // 网络错误
      console.error('网络连接失败，请检查网络');
    }

    return Promise.reject(error);
  }
);

/**
 * 封装 GET 请求
 */
export const get = <T = unknown>(
  url: string,
  params?: AxiosRequestConfig['params'],
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  return axiosInstance.get<ApiResponse<T>>(url, { ...config, params }).then(res => res.data);
};

/**
 * 封装 POST 请求
 */
export const post = <T = unknown>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  return axiosInstance.post<ApiResponse<T>>(url, data, config).then(res => res.data);
};

/**
 * 封装 PUT 请求
 */
export const put = <T = unknown>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  return axiosInstance.put<ApiResponse<T>>(url, data, config).then(res => res.data);
};

/**
 * 封装 DELETE 请求
 */
export const del = <T = unknown>(
  url: string,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  return axiosInstance.delete<ApiResponse<T>>(url, config).then(res => res.data);
};

export default axiosInstance;
