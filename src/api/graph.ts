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

/**
 * 图表助手（生成 XML）
 * 根据用户咨询信息生成 draw.io 图表
 */
export const setXml = (data: {
  agentId?: string;
  sessionId?: string;
  message?: string;
}) => {
  return post<{
    content: string;
  }>('/api/agent/charts', data);
};
/**
 * 获取图表内容
 */
export const getXml = (sessionId: string) => {
  return post<{
    content?: string;
    centent?: string;
    xml?: string;
    sessionId?: string;
  }>('/api/agent/getXml', { sessionId });
};
/**
 * 保存 XML
 * STATUS: UNUSED — 未找到任何调用点，请确认后删除
 */
export const saveXml = (data:{
  id:string;
  title:string;
  xml:string
}) => {
  return post<{
    centent:string;
  }>('/api/agent/saveXmlFile', data);
};

/**
 * 修改 XML（AI 助手修改图表）
 */
export const updataXml = (data:{
  sessionId:string;
  message:string;
}) => {
  return post<XmlContentResponse>('/api/agent/updataGroup', data);
};
