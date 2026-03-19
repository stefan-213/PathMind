/**
 * 技术节点 API 服务
 */
import { get, post, put, del } from './axios';
import type { Technology, TechnologyRelation, ApiResponse, PaginatedResponse } from '../types/api';

/**
 * 获取所有技术节点
 */
export const getTechnologies = (params?: { category?: string; page?: number; pageSize?: number }) => {
  return get<PaginatedResponse<Technology>>('/technologies', params);
};

/**
 * 获取技术节点详情
 */
export const getTechnologyById = (id: string) => {
  return get<Technology>(`/technologies/${id}`);
};

/**
 * 搜索技术节点
 */
export const searchTechnologies = (keyword: string) => {
  return get<Technology[]>('/technologies/search', { keyword });
};

/**
 * 获取所有技术关系
 */
export const getTechnologyRelations = () => {
  return get<TechnologyRelation[]>('/technologies/relations');
};

/**
 * 获取两个技术之间的路径
 */
export const getPathBetween = (from: string, to: string) => {
  return get<string[]>(`/technologies/path/${from}/${to}`);
};

/**
 * 获取推荐的学习路径
 */
export const getRecommendedPath = (goal: string) => {
  return get<string[]>('/ai/recommend-path', { goal });
};

// ==================== 管理员接口 ====================

/**
 * 创建技术节点（管理员）
 */
export const createTechnology = (data: Omit<Technology, 'id'>) => {
  return post<Technology>('/technologies', data);
};

/**
 * 更新技术节点（管理员）
 */
export const updateTechnology = (id: string, data: Partial<Technology>) => {
  return put<Technology>(`/technologies/${id}`, data);
};

/**
 * 删除技术节点（管理员）
 */
export const deleteTechnology = (id: string) => {
  return del<void>(`/technologies/${id}`);
};

/**
 * 创建技术关系（管理员）
 */
export const createTechnologyRelation = (data: Omit<TechnologyRelation, 'id'>) => {
  return post<TechnologyRelation>('/technologies/relations', data);
};

/**
 * 删除技术关系（管理员）
 */
export const deleteTechnologyRelation = (id: string) => {
  return del<void>(`/technologies/relations/${id}`);
};
