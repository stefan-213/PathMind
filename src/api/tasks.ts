/**
 * 学习任务 API 服务
 */
import { get, post } from './axios';
import type {
  Schedule,
  CreateScheduleRequest,
  UpdateScheduleRequest,
  UpdateSubTaskRequest,
} from '../types/api';

/**
 * 创建日程表
 */
export const createTask = (data: CreateScheduleRequest) => {
  return post<void>('/api/schedule/createBatch', data);
};

/**
 * 获取日程表列表
 */
export const getScheduleList = () => {
  return get<Schedule[]>('/api/schedule/list');
};

/**
 * 获取日程表内容
 */
export const getScheduleContent = (scheduleId: string) => {
  return post<Schedule[]>('/api/schedule/get', { scheduleId });
};

/**
 * 更新日程表
 */
export const updateSchedule = (data: UpdateScheduleRequest) => {
  return post<void>('/api/schedule/update', data);
};

/**
 * 更新子任务
 */
export const updateSubTask = (data: UpdateSubTaskRequest) => {
  return post<void>('/api/schedule/updateSub', data);
};

/**
 * 删除日程表
 */
export const deleteSchedule = (scheduleId: string) => {
  return post<void>('/api/schedule/delete', { scheduleId });
};
