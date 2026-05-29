/**
 * 图表 API 服务
 * 用于知识图表页面的图表操作
 */
import { post } from './axios';

type XmlContentResponse = {
  content?: string;
  centent?: string;
  message?: string;
  xml?: string;
  data?: unknown;
  sessionId?: string;
};

type GenerateScheduleResponse = {
  content?: unknown;
  centent?: unknown;
  data?: unknown;
  schedule?: unknown;
  schedules?: unknown;
  result?: unknown;
  message?: string;
};

/**
 * 图表助手（生成 XML）
 * 根据用户咨询信息生成 draw.io 图表
 */
export const charts = (data: {
  agentId?: string;
  sessionId?: string;
  message?: string;
  consultationMsg?: {
    goal: string;
    base: string;
  };
}) => {
  return post<{
    content: string;
  }>('/api/agent/charts', data);
};
/**
 * （保存 XML）
 */
export const saveXmlFile = (data:{
  id:string;
  title:string;
  xml:string
}) => {
  return post<{
    centent:string;
  }>('/api/agent/saveXmlFile', data);
};
/**
 * （修改 XML）
 */
export const updataGroup = (data:{
  sessionId:string;
  message:string;
  // xml:string
}) => {
  return post<XmlContentResponse>('/api/agent/updataGroup', data);
};

/**
 * （根据 XML 生成日程表）
 */
export const generateSchedule = (data: {
  sessionId: string;
  xml: string;
}) => {
  return post<GenerateScheduleResponse>('/api/agent/generateSchedule', data);
};
