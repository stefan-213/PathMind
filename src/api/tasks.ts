/**
 * 学习任务 API 服务
 * 对接后端 /api/agent/* 接口
 */
import { post } from './axios';
import type { Schedule, ScheduleDTO } from '../types/api';

/**
 * 删除日程表
 * 对应后端: POST /api/agent/delSchedule
 */
export const deleteSchedule = (sessionId: string) => {
  return post<string>('/api/agent/delSchedule', { sessionId });
};

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
 * 更新子日程状态
 * 对应后端: POST /api/agent/updateSubScheduleStatus
 */
export const updateSubScheduleStatus = (subScheduleId: string, status: 'pending' | 'completed', scheduleId?: string) => {
  return post('/api/agent/updateSubScheduleStatus', {
    scheduleId,
    subScheduleId,
    status,
  });
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
    id: dto.id,
    scheduleId: String(dto.id || ''),
    userId: dto.userId || '',
    scheduleName: dto.scheduleName || '',
    title: dto.title || dto.scheduleName || '',
    time: dto.time || '',
    content: dto.content || '',
    status: dto.status === 'completed' || dto.status === '1' ? 1 : 0,
    subScheduleList: (dto.subSchedules || []).map((sub, index) => ({
      id: sub.id ?? String(index),
      parentId: sub.scheduleId ?? String(dto.id ?? 0),
      day: sub.step || `第${index + 1}天`,
      task: sub.task || '',
      taskGoal: sub.focus || '',
      description: null,
      status: sub.status === 'completed' || sub.status === '1' ? 1 : 0,
      completedAt: null,
    })),
  };
};

// // 兼容旧接口导出
// // STATUS: UNUSED — createSchedule 的别名，请确认后删除
// export const createTask = createSchedule;
// // STATUS: UNUSED — getScheduleList 的别名，请确认后删除
// export const getScheduleContent = getScheduleList;
