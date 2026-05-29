/**
 * 图表 API 服务
 * 用于知识图表页面的图表操作
 */
import { post } from './axios';

/** 生成xml图表 */
export const generatePlanByOption = (data: {
  agentId: string;
  sessionId: string;
  message: string;
}) => {
  return post<{
  sessionId?: string;
  messageId?: string | null;
  role?: string;
  content?: string;
  message?: string;
  goal?: string;
  base?: string;
}>('/api/agent/group', data);
};

/** 修改 XML图表 */
export const updataGroup = (data: {
  sessionId: string;
  message: string;
}) => {
  return post<{
  content?: string;
  centent?: string;
  message?: string;
  xml?: string;
  data?: unknown;
  sessionId?: string;
}>('/api/agent/updataGroup', data);
};

/** 获取图表记录 */
export const getXmlGroupBySession = (sessionId: string) => {
  return post<{
  sessionId?: string;
  messageId?: string | null;
  role?: string;
  content?: string;
  message?: string;
  goal?: string;
  base?: string;
}>('/api/agent/getXml', { sessionId });
};