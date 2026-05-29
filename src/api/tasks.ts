/**
 * 学习任务 API 服务
 */
import { post } from './axios';

/**
 * 生成日程表 - creatSchedule接口只返回 code:200, data:"success"
 */
export const generateSchedule = (data: {
  sessionId: string;
}) => {
  return post<unknown>('/api/agent/createSchedule', data);
};

// import { get, post } from './axios';
// import type {
//   Schedule,
//   CreateScheduleRequest,
//   UpdateScheduleRequest,
//   UpdateSubTaskRequest,
//   UserProgress,
//   UserTask,
// } from '../types/api';

// /**
//  * 创建日程表
//  */
// export const createTask = (data: CreateScheduleRequest) => {
//   return post<void>('/api/schedule/createBatch', data);
// };

// /**
//  * 获取日程表列表
//  */
// export const getScheduleList = () => {
//   return get<Schedule[]>('/api/schedule/list');
// };

// /**
//  * 获取日程表内容
//  */
// export const getScheduleContent = (scheduleId: string) => {
//   return post<Schedule[]>('/api/schedule/get', { scheduleId });
// };

// /**
//  * 更新日程表
//  */
// export const updateSchedule = (data: UpdateScheduleRequest) => {
//   return post<void>('/api/schedule/update', data);
// };

// /**
//  * 更新子任务
//  */
// export const updateSubTask = (data: UpdateSubTaskRequest) => {
//   return post<void>('/api/schedule/updateSub', data);
// };

// /**
//  * 删除日程表
//  */
// export const deleteSchedule = (scheduleId: string) => {
//   return post<void>('/api/schedule/delete', { scheduleId });
// };

// export const getSchedule = (params?: { goalId?: string; status?: string }) => {
//   return get<UserTask[]>('/api/tasks', params);
// };

// export const getProgress = (params?: { goalId?: string }) => {
//   return get<UserProgress>('/api/tasks/progress', params);
// };

// export const updateTask = (id: string, data: Partial<UserTask>) => {
//   return post<UserTask>('/api/tasks/update', { id, ...data });
// };

/** 获取任务记录 */
export const getSchedule = (sessionId: string) => {
  return post<{
    sessionId?: string;
    schedule?: unknown;
    data?: unknown;
    content?: unknown;
  }>('/api/agent/getSchedule', { sessionId });
};
