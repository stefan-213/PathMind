import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { apiConfig } from './config';

// 类型定义
export interface ResponseData<T = any> {
  code: string | number;
  data: T;
  message?: string;
  [key: string]: any;
}

export interface RequestConfig extends AxiosRequestConfig {
  skipAuth?: boolean;
  skipErrorHandler?: boolean;
}

export interface MyError {
  response?: {
    status: number;
    data?: any;
  };
  message?: string;
  config?: RequestConfig;
}

// 封装请求方法
class HYRequest {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: apiConfig.baseURL,
      timeout: apiConfig.timeout,
    });

    // 请求拦截器
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const requestConfig = config as InternalAxiosRequestConfig & RequestConfig;

        // 处理 Content-Type
        if (!(requestConfig.data instanceof FormData)) {
          requestConfig.headers!.set('Content-Type', 'application/json');
        }

        // 添加 Token
        if (!requestConfig.skipAuth) {
          const user = JSON.parse(localStorage.getItem('code_user') || '{}');
          if (user.token) {
            requestConfig.headers!.set('token', user.token);
          }
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: MyError) => {
        const config = error.config as RequestConfig;

        if (config?.skipErrorHandler) {
          return Promise.reject(error);
        }

        if (error.response) {
          switch (error.response.status) {
            case 400: error.message = '请求参数错误'; break;
            case 401: error.message = '您无权限，请重新登录'; break;
            case 403: error.message = '拒绝访问'; break;
            case 404: error.message = '未找到请求接口'; break;
            case 415: error.message = '不支持的媒体类型，请检查文件格式'; break;
            case 500: error.message = '系统异常，请查看后端控制台报错'; break;
            case 502: error.message = '网关错误'; break;
            case 503: error.message = '服务不可用'; break;
            default: error.message = error.response.data?.message || '未知错误';
          }
        } else {
          error.message = '网络错误，请检查网络连接';
        }

        return Promise.reject(error);
      }
    );
  }

  // 通用请求方法
  async request<T = any>(config: RequestConfig): Promise<ResponseData<T>> {
    const res = await this.instance.request<ResponseData<T>>(config);
    return res.data;
  }

  // GET 请求
  get<T = any>(config: RequestConfig) {
    return this.request<T>({ ...config, method: 'GET' });
  }

  // POST 请求
  post<T = any>(config: RequestConfig) {
    return this.request<T>({ ...config, method: 'POST' });
  }

  // PUT 请求
  put<T = any>(config: RequestConfig) {
    return this.request<T>({ ...config, method: 'PUT' });
  }

  // PATCH 请求
  patch<T = any>(config: RequestConfig) {
    return this.request<T>({ ...config, method: 'PATCH' });
  }

  // DELETE 请求
  delete<T = any>(config: RequestConfig) {
    return this.request<T>({ ...config, method: 'DELETE' });
  }
}

// 导出单例
const hyRequest = new HYRequest();
export default hyRequest;
