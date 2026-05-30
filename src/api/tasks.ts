/**
 * 学习任务 API 服务
 * 对接后端 /api/agent/* 接口
 */
import { get, post } from './axios';
import type { Schedule, ScheduleDTO } from '../types/api';

/**
 * 创建日程表
 * 对应后端: POST /api/agent/createSchedule
 */
export const createSchedule = (sessionId: string) => {
  return post<string>('/api/agent/createSchedule', { sessionId });
};

/**
 * 获取日程表列表
 * 对应后端: POST /api/agent/getSchedule
 */
export const getScheduleList = (sessionId: string) => {
  return post<ScheduleDTO[]>('/api/agent/getSchedule', { sessionId });
};

/**
 * 日程任务对话 (学习助手)
 * 对应后端: POST /api/agent/scheduleChat
 */
export const scheduleChat = (sessionId: string, message: string, scheduleId: string) => {
  return post<{ content: string }>('/api/agent/scheduleChat', {
    sessionId,
    message,
    agentId: scheduleId, // 后端用 agentId 字段传递 scheduleId
  });
};

/**
 * 将后端 ScheduleDTO 转换为前端 Schedule 格式
 */
export const convertDTOToSchedule = (dto: ScheduleDTO): Schedule => {
  return {
    id: dto.id || 0,
    scheduleId: String(dto.id || ''),
    userId: dto.userId || '',
    title: dto.title || dto.scheduleName || '',
    time: dto.time || '',
    content: dto.content || '',
    status: dto.status === 'completed' || dto.status === '1' ? 1 : 0,
    subScheduleList: (dto.subSchedules || []).map((sub, index) => ({
      id: sub.id || index,
      parentId: dto.id || 0,
      day: sub.step || `第${index + 1}天`,
      task: sub.task || '',
      taskGoal: sub.focus || '',
      description: null,
      status: sub.status === 'completed' || sub.status === '1' ? 1 : 0,
      completedAt: null,
    })),
  };
};

// 兼容旧接口导出
export const createTask = createSchedule;
export const getScheduleContent = getScheduleList;
