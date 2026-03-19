/**
 * Axios 实例配置
 */
import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse } from '../types/api';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const axiosInstance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
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

// 请求拦截器
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    startRequest();

    // 从 localStorage 获取 token
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    endRequest();
    return Promise.reject(error);
  }
);

// 响应拦截器
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    endRequest();
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
export const get = <T = any>(
  url: string,
  params?: Record<string, any>,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  return axiosInstance.get<ApiResponse<T>>(url, { ...config, params }).then(res => res.data);
};

/**
 * 封装 POST 请求
 */
export const post = <T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  return axiosInstance.post<ApiResponse<T>>(url, data, config).then(res => res.data);
};

/**
 * 封装 PUT 请求
 */
export const put = <T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  return axiosInstance.put<ApiResponse<T>>(url, data, config).then(res => res.data);
};

/**
 * 封装 DELETE 请求
 */
export const del = <T = any>(
  url: string,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  return axiosInstance.delete<ApiResponse<T>>(url, config).then(res => res.data);
};

export default axiosInstance;
