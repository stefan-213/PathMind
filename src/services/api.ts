import hyRequest from './request';
import type { RequestConfig } from './request';

// 获取列表
export function getList<T = any>(params?: any, config?: RequestConfig) {
  return hyRequest.get<T>({
    url: '/api/list',
    params,
    ...config,
  });
}

// 获取详情
export function getDetail<T = any>(id: string | number, config?: RequestConfig) {
  return hyRequest.get<T>({
    url: `/api/detail/${id}`,
    ...config,
  });
}

// 创建数据
export function postList<T = any>(data: any, config?: RequestConfig) {
  return hyRequest.post<T>({
    url: '/api/create',
    data,
    ...config,
  });
}

// 更新数据
export function updateData<T = any>(id: string | number, data: any, config?: RequestConfig) {
  return hyRequest.put<T>({
    url: `/api/update/${id}`,
    data,
    ...config,
  });
}

// 删除数据
export function deleteData<T = any>(id: string | number, config?: RequestConfig) {
  return hyRequest.delete<T>({
    url: `/api/delete/${id}`,
    ...config,
  });
}

// 上传文件
export function uploadFile<T = any>(formData: FormData, config?: RequestConfig) {
  return hyRequest.post<T>({
    url: '/api/upload',
    data: formData,
    // 上传文件时跳过 Content-Type 设置
    ...config,
  });
}

// 登录
export function login<T = any>(data: { username: string; password: string }, config?: RequestConfig) {
  return hyRequest.post<T>({
    url: '/api/login',
    data,
    skipAuth: true, // 登录接口不需要 token
    ...config,
  });
}

// 获取用户信息
export function getUserInfo<T = any>(config?: RequestConfig) {
  return hyRequest.get<T>({
    url: '/api/user/info',
    ...config,
  });
}
