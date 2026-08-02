/**
 * 图表 API 服务
 * 用于知识图表页面的图表操作
 */
import type { ApiResponse } from '../types/api';
import { post } from './axios';
import { postSse } from './sse';
import type { ChartStreamProgressEvent, ChartStreamStage } from './chartStreamProgress';

type XmlContentResponse = {
  content?: string;
  centent?: string;
  message?: string;
  xml?: string;
  data?: unknown;
  sessionId?: string;
};

type SetXmlRequest = {
  agentId?: string;
  sessionId?: string;
  message?: string;
  consultationMsg?: unknown;
};

export type ChartStreamEventType = 'start' | 'message' | 'done' | 'error' | 'ping';

export type ChartStreamEvent = ChartStreamProgressEvent & {
  type?: ChartStreamEventType;
  sessionId?: string;
  role?: 'model' | string;
  content?: string;
  message?: string;
  replace?: boolean;
  stage?: ChartStreamStage | string;
  progress?: number;
};

type SetXmlStreamOptions = {
  signal?: AbortSignal;
  onEvent?: (event: ChartStreamEvent) => void;
  onMessage?: (content: string, event: ChartStreamEvent) => void;
  onProgress?: (event: ChartStreamEvent) => void;
};

/**
 * 图表助手（生成 XML）
 * 使用 POST SSE 调用 /api/agent/chartsStream。
 *
 * 注意：message 事件只表示生成阶段/进度，不是最终 JSON；只有 done.content 才能用于最终解析和渲染。
 */
export const setXml = async (
  data: SetXmlRequest,
  options: SetXmlStreamOptions = {},
): Promise<ApiResponse<{ content: string }>> => {
  let finalContent = '';
  let hasDoneContent = false;

  await postSse<ChartStreamEvent>('/api/agent/chartsStream', data, {
    signal: options.signal,
    onEvent: (event, eventName) => {
      const type = event.type ?? (eventName as ChartStreamEventType);
      const normalizedEvent: ChartStreamEvent = { ...event, type };

      options.onEvent?.(normalizedEvent);

      if (type === 'message') {
        options.onProgress?.(normalizedEvent);
        if (typeof normalizedEvent.content === 'string') {
          options.onMessage?.(normalizedEvent.content, normalizedEvent);
        }
        return;
      }

      if (type === 'done') {
        hasDoneContent = typeof normalizedEvent.content === 'string';
        finalContent = typeof normalizedEvent.content === 'string' ? normalizedEvent.content : '';
        return;
      }

      if (type === 'error') {
        throw new Error(normalizedEvent.message || '图表生成失败，请稍后重试');
      }
    },
  });

  if (!hasDoneContent) {
    throw new Error('图表生成未返回最终内容，请稍后重试');
  }

  return {
    success: true,
    data: {
      content: finalContent,
    },
  };
};

/*
 * Legacy sync chart API disabled. Kept for reference; do not call.
 *
 * export const setXml = (data: {
 *   agentId?: string;
 *   sessionId?: string;
 *   message?: string;
 * }) => {
 *   return post<{
 *     content: string;
 *   }>('/api/agent/charts', data);
 * };
 */

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
 * STATUS: UNUSED - 未找到任何调用点，请确认后删除
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