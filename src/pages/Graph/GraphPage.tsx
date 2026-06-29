/**
 * 知识图表页面
 * 支持 AI 生成图表
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '../../components/layout';
import { ResourceSidebar, Spin, type ResourceSidebarItem } from '../../components/common';
import { GraphCanvas } from './GraphCanvas';
import { AISidePanel } from './AISidePanel';
import type { GraphNode } from '../../types/graph';
import { charts, updataGroup } from '../../api/graph';
import { createSchedule } from '../../api/tasks';
import { generatePlanByOption, getXmlGroupBySession } from '../../api/conversation';
import { getChatSessions } from '../../api/useApi';
import { useChatStore } from '../../stores/chatStore';
import { useSessionStore } from '../../stores/sessionStore';
import { normalizeDrawioXml } from '../../utils/drawioXml';
import { normalizeCopilotSessionMap, type CopilotSessionResource } from '../../utils';
// import { conversationApi } from '../../api/useApi';
// import { mockGraphXml } from '../../api/mock';
import './GraphPage.scss';

const CONSULT_CHART_STORAGE_KEY = 'pathmind_consult_chart';
const PLAN_DATA_STORAGE_KEY = 'pathmind_plan_data';
const PLAN_TITLE_STORAGE_KEY = 'pathmind_plan_title';
const COPILOT_AGENT_ID = '100003';
const DEFAULT_GRAPH_EMPTY_MESSAGE = '在Copilot页面输入需求，让 AI 为你生成计划图表';
const MISSING_FINAL_GRAPH_MESSAGE = '最终方案图表未生成，请回Copilot页面继续完成对话';

type ChartContent = {
  xml?: unknown;
  data?: unknown;
};

type GeneratedChart = {
  xml: string;
  data?: unknown[];
  repaired: boolean;
};

type SessionChartCache = Record<string, GeneratedChart>;

type FetchGroupChartParams = {
  sessionId: string;
  title: string;
  message?: string;
  agentId?: string;
  loadingText: string;
};

type ChartRequestData =
  | {
      type: 'group';
      message: string;
    }
  | {
      type: 'charts';
      consultationMsg: {
        goal: string;
        base: string;
      };
    };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const stripThinkTags = (value: string) =>
  value.replace(/<think\b[^>]*>[\s\S]*?<\/think>/gi, '').trim();

const extractDrawioXmlText = (value: string) => {
  const mxfileStart = value.indexOf('<mxfile');
  const mxfileEnd = value.lastIndexOf('</mxfile>');

  if (mxfileStart >= 0 && mxfileEnd >= mxfileStart) {
    return value.slice(mxfileStart, mxfileEnd + '</mxfile>'.length);
  }

  const graphStart = value.indexOf('<mxGraphModel');

  if (graphStart < 0) {
    return null;
  }

  const graphEnd = value.lastIndexOf('</mxGraphModel>');

  if (graphEnd >= graphStart) {
    return value.slice(graphStart, graphEnd + '</mxGraphModel>'.length);
  }

  const rootEnd = value.indexOf('</root>', graphStart);

  if (rootEnd >= graphStart) {
    return `${value.slice(graphStart, rootEnd + '</root>'.length)}</mxGraphModel>`;
  }

  return value.slice(graphStart);
};

const extractJsonObjectText = (value: string) => {
  const preferredStart = value.search(/\{\s*"xml"\s*:/);
  const start = preferredStart >= 0 ? preferredStart : value.indexOf('{');
  if (start < 0) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < value.length; i++) {
    const char = value[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
    } else if (char === '{') {
      depth++;
    } else if (char === '}') {
      depth--;
      if (depth === 0) {
        return value.slice(start, i + 1);
      }
    }
  }

  return null;
};

const extractJsonArrayText = (value: string) => {
  const start = value.indexOf('[');
  if (start < 0) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < value.length; i++) {
    const char = value[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
    } else if (char === '[') {
      depth++;
    } else if (char === ']') {
      depth--;
      if (depth === 0) {
        return value.slice(start, i + 1);
      }
    }
  }

  return null;
};

const stripJsonCodeFence = (value: string) =>
  value
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

const parseJsonLikePayload = (value: unknown): unknown => {
  if (typeof value !== 'string') return value;

  const text = stripJsonCodeFence(stripThinkTags(value));
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    const jsonObjectText = extractJsonObjectText(text);
    if (jsonObjectText) {
      try {
        return JSON.parse(jsonObjectText);
      } catch {
        return text;
      }
    }

    const jsonArrayText = extractJsonArrayText(text);
    if (jsonArrayText) {
      try {
        return JSON.parse(jsonArrayText);
      } catch {
        return text;
      }
    }

    return text;
  }
};

const extractScheduleArray = (value: unknown): unknown[] | null => {
  const parsed = parseJsonLikePayload(value);

  if (Array.isArray(parsed)) return parsed;
  if (!isRecord(parsed)) return null;

  const candidateKeys = [
    'schedules',
    'schedule',
    'data',
    'content',
    'message',
    'centent',
    'result',
  ];

  for (const key of candidateKeys) {
    if (!(key in parsed)) continue;

    const candidate = extractScheduleArray(parsed[key]);
    if (candidate) return candidate;
  }

  return null;
};

const parseChartContent = (contentData: unknown): ChartContent | null => {
  if (isRecord(contentData)) {
    if (typeof contentData.xml === 'string') return contentData;

    const nestedContent = typeof contentData.content === 'string'
      ? contentData.content
      : typeof contentData.centent === 'string'
        ? contentData.centent
        : typeof contentData.message === 'string'
          ? contentData.message
          : typeof contentData.data === 'string'
            ? contentData.data
            : null;

    if (nestedContent) {
      const nestedChartContent = parseChartContent(nestedContent);

      if (!nestedChartContent) return null;

      return {
        ...nestedChartContent,
        data: nestedChartContent.data ?? contentData.data,
      };
    }

    return contentData;
  }

  if (typeof contentData !== 'string') return null;

  const contentWithoutThink = stripThinkTags(contentData);
  const xmlText = extractDrawioXmlText(contentWithoutThink);

  if (xmlText) {
    return { xml: xmlText };
  }

  try {
    const parsed = JSON.parse(contentWithoutThink);
    if (typeof parsed === 'string') return parseChartContent(parsed);
    return parseChartContent(parsed);
  } catch {
    const jsonText = extractJsonObjectText(contentWithoutThink);
    if (!jsonText) return null;

    try {
      const parsed = JSON.parse(jsonText);
      if (typeof parsed === 'string') return parseChartContent(parsed);
      return parseChartContent(parsed);
    } catch {
      return null;
    }
  }
};

const getChartContent = (response: unknown) => {
  if (typeof response === 'string') return response;
  if (!isRecord(response)) return undefined;

  if (isRecord(response.data)) {
    if ('content' in response.data) return response.data.content;
    if ('centent' in response.data) return response.data.centent;
    if ('message' in response.data) return response.data.message;
    if ('xml' in response.data) return response.data.xml;
    return response.data;
  }

  if (typeof response.data === 'string') {
    return response.data;
  }

  return response.content;
};

const getFailureMessage = (response: unknown, fallback: string) => {
  if (!isRecord(response)) return fallback;
  if (typeof response.error === 'string' && response.error.trim()) return response.error;
  if (typeof response.message === 'string' && response.message.trim()) return response.message;
  return fallback;
};

const isEmptyChartContent = (contentData: unknown): boolean => {
  if (typeof contentData === 'string') {
    const contentWithoutThink = stripThinkTags(contentData).trim();
    if (!contentWithoutThink) return true;

    try {
      return isEmptyChartContent(JSON.parse(contentWithoutThink));
    } catch {
      return false;
    }
  }

  if (isRecord(contentData)) {
    if ('content' in contentData) return isEmptyChartContent(contentData.content);
    if ('centent' in contentData) return isEmptyChartContent(contentData.centent);
    if ('message' in contentData) return isEmptyChartContent(contentData.message);
    if ('data' in contentData) return isEmptyChartContent(contentData.data);
  }

  return false;
};

const getChartResponseSessionId = (response: unknown) => {
  if (!isRecord(response) || !isRecord(response.data)) return '';
  return typeof response.data.sessionId === 'string' ? response.data.sessionId.trim() : '';
};

const normalizeGeneratedChart = (contentData: unknown): GeneratedChart | null => {
  const contentObj = parseChartContent(contentData);

  if (typeof contentObj?.xml !== 'string') {
    return null;
  }

  const normalizedXml = normalizeDrawioXml(contentObj.xml);

  if (!normalizedXml.ok) {
    console.error('【GraphPage】XML 自动修复失败:', normalizedXml.error, normalizedXml.xmlPreview);
    return null;
  }

  if (normalizedXml.repaired) {
    console.warn('【GraphPage】XML 格式有误，已自动修复后渲染');
  }

  return {
    xml: normalizedXml.xml,
    data: Array.isArray(contentObj.data) ? contentObj.data : undefined,
    repaired: normalizedXml.repaired,
  };
};

const getChartTitle = (chartData: unknown) => {
  if (!isRecord(chartData)) return '';
  const title = isRecord(chartData.consultationMsg)
    ? chartData.consultationMsg.goal
    : chartData.goal;
  if (typeof title === 'string' && title.trim()) return title.trim();
  return typeof chartData.optionId === 'string' ? chartData.optionId.trim() : '';
};

const getChartSessionId = (chartData: unknown) => {
  if (!isRecord(chartData)) return '';
  return typeof chartData.sessionId === 'string' ? chartData.sessionId.trim() : '';
};

const getChartAgentId = (chartData: unknown) => {
  if (!isRecord(chartData)) return '';
  return typeof chartData.agentId === 'string' ? chartData.agentId.trim() : '';
};

const getPlanOptionMessage = (optionId: string) => {
  const message = optionId.trim().replace(/^option_/i, '');
  const numericMessage = Number.parseInt(message, 10);

  if (!Number.isNaN(numericMessage) && numericMessage > 0) {
    return String(numericMessage - 1);
  }

  return message;
};

const getChartRequestData = (chartData: unknown): ChartRequestData | null => {
  if (!isRecord(chartData)) return null;

  if (isRecord(chartData.consultationMsg)) {
    const { goal, base } = chartData.consultationMsg;
    if (typeof goal !== 'string' || typeof base !== 'string') return null;

    return {
      type: 'charts',
      consultationMsg: {
        goal,
        base,
      },
    };
  }

  if (typeof chartData.optionId === 'string' && chartData.optionId.trim()) {
    return {
      type: 'group',
      message: getPlanOptionMessage(chartData.optionId),
    };
  }

  return null;
};

export function GraphPage() {
  const navigate = useNavigate();
  const addMessage = useChatStore((state) => state.addMessage);
  const setSatisfactionState = useChatStore((state) => state.setSatisfactionState);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const hasRequestedChartRef = useRef(false);
  const hasAutoLoadedInitialSessionRef = useRef(false);
  const loadingChartSessionIdsRef = useRef<Set<string>>(new Set());
  const latestChartRequestRef = useRef(0);

  // AI 生成图表 XML 数据
  // const graphXml = mockGraphXml;
  const [graphXml, setGraphXml] = useState<string | null>(null);
  const [graphEmptyMessage, setGraphEmptyMessage] = useState(DEFAULT_GRAPH_EMPTY_MESSAGE);
  const [isChartLoading, setIsChartLoading] = useState(() =>
    Boolean(localStorage.getItem(CONSULT_CHART_STORAGE_KEY))
  );
  const [chartLoadingText, setChartLoadingText] = useState('正在生成计划图表...');
  const [chartLoadError, setChartLoadError] = useState<string | null>(null);
  const [isAiUpdating, setIsAiUpdating] = useState(false);
  const [isScheduleGenerating, setIsScheduleGenerating] = useState(false);
  const [sessions, setSessions] = useState<CopilotSessionResource[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const { currentSessionId: storeSessionId, consultContext: storeContext } = useSessionStore();
  const [sessionCharts, setSessionCharts] = useState<SessionChartCache>({});
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAiPanelCollapsed, setIsAiPanelCollapsed] = useState(false);
  const [isSessionListLoading, setIsSessionListLoading] = useState(false);
  const [sessionListError, setSessionListError] = useState<string | null>(null);

  const syncPlanStorage = useCallback((title: string, chart: GeneratedChart | null) => {
    // 只在 chart 有 data 时更新 localStorage，不删除已有数据
    if (Array.isArray(chart?.data) && chart.data.length > 0) {
      localStorage.setItem(PLAN_DATA_STORAGE_KEY, JSON.stringify(chart.data));
    }

    const normalizedTitle = title.trim();
    if (normalizedTitle) {
      localStorage.setItem(PLAN_TITLE_STORAGE_KEY, normalizedTitle);
    }
  }, []);

  const cacheAndRenderSessionChart = useCallback((
    sessionId: string,
    title: string,
    chart: GeneratedChart,
  ) => {
    setSessionCharts((current) => ({
      ...current,
      [sessionId]: chart,
    }));
    setGraphXml(chart.xml);
    setGraphEmptyMessage(DEFAULT_GRAPH_EMPTY_MESSAGE);
    setChartLoadError(null);
    setSelectedNode(null);
    syncPlanStorage(title, chart);
  }, [syncPlanStorage]);

  const renderCachedSessionChart = useCallback((sessionId: string, title: string) => {
    const cachedChart = sessionCharts[sessionId];
    if (!cachedChart) return false;

    setGraphXml(cachedChart.xml);
    setGraphEmptyMessage(DEFAULT_GRAPH_EMPTY_MESSAGE);
    setSelectedNode(null);
    setChartLoadError(null);
    syncPlanStorage(title, cachedChart);
    return true;
  }, [sessionCharts, syncPlanStorage]);

  const fetchAndRenderGroupChart = useCallback(async ({
    sessionId,
    title,
    message = '',
    agentId = COPILOT_AGENT_ID,
    loadingText,
  }: FetchGroupChartParams) => {
    const normalizedSessionId = sessionId.trim();
    if (!normalizedSessionId) return null;
    if (loadingChartSessionIdsRef.current.has(normalizedSessionId)) return null;

    const requestId = latestChartRequestRef.current + 1;
    latestChartRequestRef.current = requestId;
    loadingChartSessionIdsRef.current.add(normalizedSessionId);

    setIsChartLoading(true);
    setChartLoadingText(loadingText);
    setChartLoadError(null);
    setGraphXml(null);
    setGraphEmptyMessage(DEFAULT_GRAPH_EMPTY_MESSAGE);
    setSelectedNode(null);
    syncPlanStorage('', null);

    try {
      // 优先使用 getXmlGroupBySession 获取图表记录
      // group 接口仅在第一次创建 xml 图表并获取数据时使用
      const shouldLoadExistingChart = agentId === COPILOT_AGENT_ID && !message;
      const response = shouldLoadExistingChart
        ? await getXmlGroupBySession(normalizedSessionId)
        : await generatePlanByOption({
            agentId,
            sessionId: normalizedSessionId,
            message,
          });

      if (requestId !== latestChartRequestRef.current) return null;

      const contentData = getChartContent(response);

      if (shouldLoadExistingChart && isEmptyChartContent(contentData)) {
        setGraphXml(null);
        setSelectedNode(null);
        setChartLoadError(null);
        setGraphEmptyMessage(MISSING_FINAL_GRAPH_MESSAGE);
        return {
          sessionId: normalizedSessionId,
          chart: null,
        };
      }

      const chart = normalizeGeneratedChart(contentData);
      if (!chart) {
        throw new Error('图表数据格式异常');
      }

      const responseSessionId = getChartResponseSessionId(response);
      const resolvedSessionId = responseSessionId || normalizedSessionId;
      const normalizedTitle = title.trim() || resolvedSessionId;

      setSessions((currentSessions) => {
        if (currentSessions.some((session) => session.sessionId === resolvedSessionId)) {
          return currentSessions;
        }

        return [
          {
            id: resolvedSessionId,
            sessionId: resolvedSessionId,
            title: normalizedTitle,
          },
          ...currentSessions,
        ];
      });
      setActiveSessionId(resolvedSessionId);
      cacheAndRenderSessionChart(resolvedSessionId, normalizedTitle, chart);

      return {
        sessionId: resolvedSessionId,
        chart,
      };
    } catch (error) {
      console.error('Group chart load failed:', error);
      if (requestId === latestChartRequestRef.current) {
        setChartLoadError('会话图表加载失败，请稍后重试');
      }
      return null;
    } finally {
      loadingChartSessionIdsRef.current.delete(normalizedSessionId);
      if (requestId === latestChartRequestRef.current) {
        setIsChartLoading(false);
      }
    }
  }, [cacheAndRenderSessionChart, syncPlanStorage]);
  // console.log('【GraphPage】render, graphXml:', graphXml ? graphXml.substring(0, 100) + '...' : null);

  // // 加载状态
  // const [isLoading, setIsLoading] = useState(false);

  // // 发送消息并处理响应
  // const handleSendMessage = useCallback(async (message: string) => {
  //   if (!message.trim() || isLoading) return;

  //   setIsLoading(true);

  //   try {
  //     const res = await conversationApi.chatStream({
  //       agentId: '100001',
  //       sessionId: '',
  //       message: message.trim(),
  //     });

  //     const response = res.data;
  //     if (!response) {
  //       throw new Error('AI 响应数据异常');
  //     }

  //     // 原始消息内容
  //     const rawContent = response.message || '';

  //     // 去掉 think 标签内容，从剩余内容中提取 XML
  //     const contentWithoutThink = rawContent.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  //     console.log('【GraphPage】contentWithoutThink:', contentWithoutThink.substring(0, 200));

  //     // 从剩余内容中提取 mxfile XML
  //     const xmlMatch = contentWithoutThink.match(/<mxfile[\s\S]*?<\/mxfile>/);
  //     const xmlData = xmlMatch ? xmlMatch[0] : '';
  //     console.log('【GraphPage】提取到 xmlData:', xmlData ? '是' : '否', xmlData ? xmlData.substring(0, 100) + '...' : '');

  //     // 如果提取到 XML，更新图表
  //     if (xmlData) {
  //       console.log('【GraphPage】设置 graphXml');
  //       setGraphXml(xmlData);
  //     } else {
  //       console.log('【GraphPage】未提取到 XML 数据');
  //     }
  //   } catch (err) {
  //     console.error('Chat error:', err);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // }, [isLoading]);

  // 确保页面滚动到顶部
  useEffect(() => {
    window.scrollTo(0, 0);
    if (pageRef.current) {
      pageRef.current.scrollTop = 0;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadCopilotSessions = async () => {
      setIsSessionListLoading(true);
      setSessionListError(null);

      try {
        const response = await getChatSessions(COPILOT_AGENT_ID);
        if (response.success === false) {
          throw new Error(response.error || '会话列表加载失败');
        }

        const nextSessions = normalizeCopilotSessionMap(response.data);
        if (!isMounted) return;

        setSessions(nextSessions);
        setActiveSessionId((currentSessionId) => {
          if (
            currentSessionId &&
            nextSessions.some((session) => session.sessionId === currentSessionId)
          ) {
            return currentSessionId;
          }

          return nextSessions[0]?.sessionId ?? null;
        });
      } catch (error) {
        console.error('Load copilot sessions failed:', error);
        if (isMounted) {
          setSessionListError('会话列表加载失败');
        }
      } finally {
        if (isMounted) {
          setIsSessionListLoading(false);
        }
      }
    };

    void loadCopilotSessions();

    return () => {
      isMounted = false;
    };
  }, []);

  // 检查是否有咨询方案数据，如果有则调用 charts API
  useEffect(() => {
    // 优先从 sessionStore 读取
    if (storeContext && !hasRequestedChartRef.current) {
      hasRequestedChartRef.current = true;

      const loadFromStoreContext = async () => {
        setIsChartLoading(true);
        setChartLoadingText('正在生成计划图表...');
        setChartLoadError(null);
        setGraphEmptyMessage(DEFAULT_GRAPH_EMPTY_MESSAGE);

        try {
          const chartRequestData = storeContext.optionId
            ? { type: 'option', optionId: storeContext.optionId }
            : storeContext.goal && storeContext.base
              ? { type: 'consultation', consultationMsg: { goal: storeContext.goal, base: storeContext.base } }
              : null;

          if (!chartRequestData) {
            throw new Error('consultContext 数据格式异常');
          }

          if (storeSessionId) {
            setActiveSessionId(storeSessionId);
          }

          if (chartRequestData.type === 'consultation') {
            const res = await charts({
              consultationMsg: chartRequestData.consultationMsg,
              agentId: '100004',
              sessionId: storeSessionId || undefined,
            });

            const contentData = getChartContent(res);
            const contentObj = parseChartContent(contentData);

            if (typeof contentObj?.xml === 'string') {
              const normalizedXml = normalizeDrawioXml(contentObj.xml);
              if (normalizedXml.ok) {
                setGraphXml(normalizedXml.xml);
                setGraphEmptyMessage(DEFAULT_GRAPH_EMPTY_MESSAGE);
                setIsChartLoading(false);
              } else {
                setChartLoadError('计划图表解析失败，请稍后重试');
                setIsChartLoading(false);
                return;
              }
            } else {
              setChartLoadError('计划图表生成失败，请稍后重试');
              setIsChartLoading(false);
              return;
            }

            if (Array.isArray(contentObj?.data)) {
              localStorage.setItem(PLAN_DATA_STORAGE_KEY, JSON.stringify(contentObj.data));
            }

            // 清理 sessionStore
            useSessionStore.getState().clearCurrentSession();
          } else if (chartRequestData.type === 'option') {
            if (!storeSessionId) {
              setChartLoadError('会话 ID 缺失，无法加载图表');
              setIsChartLoading(false);
              return;
            }
            const result = await fetchAndRenderGroupChart({
              agentId: COPILOT_AGENT_ID,
              sessionId: storeSessionId,
              title: '',
              message: '',
              loadingText: '正在生成计划图表...',
            });

            if (!result) {
              throw new Error('图表生成失败');
            }

            useSessionStore.getState().clearCurrentSession();
          }
        } catch (err) {
          console.error('Charts API error (store):', err);
          const message = storeContext.optionId
            ? '计划图表加载失败，请稍后重试'
            : '计划图表加载失败，请稍后重试';
          setChartLoadError(message);
          setIsChartLoading(false);
        }
      };

      loadFromStoreContext();
      return; // 跳过 localStorage 逻辑
    }

    // 降级：从 localStorage 读取
    const chartDataStr = localStorage.getItem(CONSULT_CHART_STORAGE_KEY);
    if (!chartDataStr || hasRequestedChartRef.current) return;
    hasRequestedChartRef.current = true;

    const loadGeneratedChart = async () => {
      setIsChartLoading(true);
      setChartLoadingText('正在生成计划图表...');
      setChartLoadError(null);
      setGraphEmptyMessage(DEFAULT_GRAPH_EMPTY_MESSAGE);

      try {
        const chartData = JSON.parse(chartDataStr);
        console.log('【GraphPage】chartData:', chartData);
        const chartTitle = getChartTitle(chartData);
        const chartSessionId = getChartSessionId(chartData);
        const chartAgentId = getChartAgentId(chartData);
        const chartRequestData = getChartRequestData(chartData);

        if (!chartRequestData) {
          throw new Error('图表请求数据格式异常');
        }

        if (chartSessionId) {
          setActiveSessionId(chartSessionId);
        }

        if (chartRequestData.type === 'group') {
          const result = await fetchAndRenderGroupChart({
            agentId: chartAgentId || COPILOT_AGENT_ID,
            sessionId: chartSessionId,
            title: chartTitle,
            message: chartRequestData.message,
            loadingText: '正在生成计划图表...',
          });

          if (!result) {
            throw new Error('图表生成失败');
          }

          // group 路径成功后清除 consult chart key，避免刷新时重复触发生成
          localStorage.removeItem(CONSULT_CHART_STORAGE_KEY);
          return;
        }

        if (chartTitle) {
          localStorage.setItem(PLAN_TITLE_STORAGE_KEY, chartTitle);
        }

        localStorage.removeItem(CONSULT_CHART_STORAGE_KEY);

        const res = await charts({
          consultationMsg: chartRequestData.consultationMsg,
          agentId: '100004',
          sessionId: chartSessionId,
        });

        console.log('【GraphPage】Chart generation response:', res);
        const contentData = getChartContent(res);
        console.log('【GraphPage】contentData 类型:', typeof contentData);

        const contentObj = parseChartContent(contentData);
        console.log('【GraphPage】contentObj keys:', contentObj ? Object.keys(contentObj) : 'null');

        let hasGraphXml = false;

        // 提取 XML 数据
        if (typeof contentObj?.xml === 'string') {
          console.log('【GraphPage】成功获取 XML，长度:', contentObj.xml.length);
          const normalizedXml = normalizeDrawioXml(contentObj.xml);

          if (normalizedXml.ok) {
            if (normalizedXml.repaired) {
              console.warn('【GraphPage】XML 格式有误，已自动修复后渲染');
            }
            hasGraphXml = true;
            setGraphXml(normalizedXml.xml);
            setGraphEmptyMessage(DEFAULT_GRAPH_EMPTY_MESSAGE);
            setIsChartLoading(false);
          } else {
            console.error('【GraphPage】XML 自动修复失败:', normalizedXml.error, normalizedXml.xmlPreview);
          }
        } else {
          console.log('【GraphPage】content 中没有 xml 字段');
        }

        // 提取 data 数据，传递给 task 页面
        if (Array.isArray(contentObj?.data)) {
          console.log('【GraphPage】成功获取 data，长度:', contentObj.data.length);
          localStorage.setItem(PLAN_DATA_STORAGE_KEY, JSON.stringify(contentObj.data));
          if (chartTitle) {
            localStorage.setItem(PLAN_TITLE_STORAGE_KEY, chartTitle);
          }
        }

        if (!hasGraphXml) {
          setChartLoadError('计划图表生成失败，请稍后重试');
          setIsChartLoading(false);
        }
      } catch (err) {
        console.error('Charts API error:', err);
        setChartLoadError('计划图表加载失败，请稍后重试');
        setIsChartLoading(false);
      }
    };

    loadGeneratedChart();
  }, [fetchAndRenderGroupChart, storeSessionId, storeContext]);

  const activeSessionTitle =
    sessions.find((session) => session.sessionId === activeSessionId)?.title ?? '';

  const handleAiModifyGraph = useCallback(async (message: string) => {
    const normalizedMessage = message.trim();
    const normalizedSessionId = activeSessionId?.trim() ?? '';

    if (!normalizedMessage || isAiUpdating || isScheduleGenerating) return;

    if (!normalizedSessionId) {
      addMessage({
        role: 'assistant',
        content: '请先选择一个会话图表后再发送修改意见。',
      });
      return;
    }

    setIsAiUpdating(true);
    setChartLoadError(null);

    try {
      const response = await updataGroup({
        sessionId: normalizedSessionId,
        message: normalizedMessage,
      });

      if (isRecord(response) && response.success === false) {
        throw new Error(getFailureMessage(response, '图表修改失败，请稍后重试'));
      }

      const chart = normalizeGeneratedChart(getChartContent(response));

      if (!chart) {
        throw new Error('图表数据格式异常');
      }

      cacheAndRenderSessionChart(
        normalizedSessionId,
        activeSessionTitle || normalizedSessionId,
        chart,
      );
      setActiveSessionId(normalizedSessionId);
      setSatisfactionState('waiting');
      addMessage({
        role: 'assistant',
        content: '已按照您的需求修改，请查看，如果不满意请继续提出修改意见。',
        hasGraph: true,
      });
    } catch (error) {
      console.error('Update graph failed:', error);
      const messageText = error instanceof Error && error.message
        ? error.message
        : '图表修改失败，请稍后重试';

      setChartLoadError(messageText);
      addMessage({
        role: 'assistant',
        content: messageText,
      });
    } finally {
      setIsAiUpdating(false);
    }
  }, [
    activeSessionId,
    activeSessionTitle,
    addMessage,
    cacheAndRenderSessionChart,
    isAiUpdating,
    isScheduleGenerating,
    setSatisfactionState,
  ]);

  const handleGenerateSchedule = useCallback(async () => {
    const normalizedSessionId = activeSessionId?.trim() ?? '';

    if (isScheduleGenerating) return;

    if (!normalizedSessionId) {
      addMessage({
        role: 'assistant',
        content: '当前还没有可用于生成日程表的图表，请先生成或选择一个图表。',
      });
      return;
    }

    setIsScheduleGenerating(true);
    setChartLoadError(null);

    try {
      // 检查 localStorage 中是否已有日程数据（图表生成时已保存）
      const existingData = localStorage.getItem(PLAN_DATA_STORAGE_KEY);
      if (existingData) {
        console.log('【GraphPage】使用已保存的日程数据');
        setSatisfactionState('satisfied');
        localStorage.removeItem(CONSULT_CHART_STORAGE_KEY);
        navigate('/tasks');
        return;
      }

      // 如果没有已保存的数据，调用后端 createSchedule 接口
      const response = await createSchedule(normalizedSessionId);

      if (response.success === false) {
        throw new Error(response.error || '日程表生成失败，请稍后重试');
      }

      setSatisfactionState('satisfied');
      localStorage.removeItem(CONSULT_CHART_STORAGE_KEY);
      navigate('/tasks');
    } catch (error) {
      console.error('Generate schedule failed:', error);
      const messageText = error instanceof Error && error.message
        ? error.message
        : '日程表生成失败，请稍后重试';

      setSatisfactionState('waiting');
      addMessage({
        role: 'assistant',
        content: messageText,
      });
    } finally {
      setIsScheduleGenerating(false);
    }
  }, [
    activeSessionId,
    addMessage,
    isScheduleGenerating,
    navigate,
    setSatisfactionState,
  ]);

  const sessionSidebarItems: ResourceSidebarItem[] = sessions.map((session) => ({
    id: session.sessionId,
    title: session.title,
    iconClass: 'fas fa-project-diagram',
    // description: session.sessionId === activeSessionId ? '当前图表' : '待接入图表接口',
  }));
  const sessionSidebarEmptyText = isSessionListLoading
    ? '会话加载中...'
    : sessionListError || '暂无历史会话';

  const handleSelectGraphSession = useCallback((sessionId: string) => {
    const title = sessions.find((session) => session.sessionId === sessionId)?.title ?? sessionId;
    setActiveSessionId(sessionId);
    if (renderCachedSessionChart(sessionId, title)) return;

    void fetchAndRenderGroupChart({
      sessionId,
      title,
      loadingText: '正在加载会话图表...',
    });
  }, [fetchAndRenderGroupChart, renderCachedSessionChart, sessions]);

  useEffect(() => {
    if (hasAutoLoadedInitialSessionRef.current) return;
    if (!activeSessionId || graphXml || isChartLoading) return;
    if (localStorage.getItem(CONSULT_CHART_STORAGE_KEY)) return;

    hasAutoLoadedInitialSessionRef.current = true;
    handleSelectGraphSession(activeSessionId);
  }, [activeSessionId, graphXml, handleSelectGraphSession, isChartLoading]);

  return (
    <div className="graph-page" ref={pageRef}>
      <Header />

      {(isChartLoading || isScheduleGenerating) && (
        <div className="graph-loading-overlay" role="status" aria-live="polite">
          <Spin size="large" tip={isScheduleGenerating ? '日程表生成中...' : chartLoadingText} />
        </div>
      )}

      <div className="graph-main">
        {/* Page Header */}
        {/* <div className="graph-header">
          <h1 className="graph-title">
            <i className="fas fa-project-diagram"></i>
            {graphXml ? 'AI 生成图谱' : '知识图表'}
          </h1>
          <p className="graph-desc">
            {goalParam || '探索技术知识之间的关联'}
          </p>
        </div> */}

        {/* Main Container */}
        <div className="graph-main-container">
          <ResourceSidebar
            header={{
              title: '知识图表',
              iconClass: 'fas fa-project-diagram',
              subtitle: activeSessionTitle || 'Copilot 会话图表',
            }}
            sectionTitle="历史会话"
            items={sessionSidebarItems}
            activeItemId={activeSessionId ?? ''}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed((current) => !current)}
            onSelectItem={handleSelectGraphSession}
            emptyText={sessionSidebarEmptyText}
            collapseTitle="收起侧栏"
            expandTitle="展开侧栏"
            className="graph-resource-sidebar"
          />
          {/* Graph Container */}
          <div className="graph-wrapper with-ai-panel">
            {/* AI 图谱标题 */}
            {/* {graphXml && (
              <div className="ai-graph-title">
                <i className="fas fa-chart-pie"></i> 前端开发学习路线图
              </div>
            )} */}

            {/* 返回知识图表按钮 */}
            {/* {graphXml && (
              <button
                className="back-to-knowledge-btn"
                onClick={() => setGraphXml(null)}
                title="返回知识图表"
              >
                <i className="fas fa-arrow-left"></i> 返回知识图表
              </button>
            )} */}

            {/* 图表渲染 — 仅在 sessionId 变化时重挂载，避免 graphRenderKey 频繁触发 iframe 重建导致首次渲染失败 */}
            <GraphCanvas
              key={activeSessionId ?? 'graph-canvas'}
              xml={graphXml}
              emptyMessage={graphEmptyMessage}
            />

            {chartLoadError && !isChartLoading && (
              <div className="graph-load-error">
                <i className="fas fa-circle-exclamation"></i>
                {chartLoadError}
              </div>
            )}

            {/* Node Detail Panel */}
            {selectedNode && (
              <div className="node-detail-panel show">
                <button className="btn-close" onClick={() => setSelectedNode(null)}>
                  ×
                </button>
                <div className="node-detail-header">
                  <div className="node-detail-icon">
                    <i className={selectedNode.icon || 'fas fa-circle'}></i>
                  </div>
                  <div className="node-detail-title">{selectedNode.label}</div>
                  {selectedNode.category && (
                    <div className="node-detail-category">{selectedNode.category}</div>
                  )}
                </div>
                <div className="node-detail-body">
                  {selectedNode.description && (
                    <p className="node-detail-desc">{selectedNode.description}</p>
                  )}
                  {selectedNode.tags && selectedNode.tags.length > 0 && (
                    <div className="node-tags">
                      {selectedNode.tags.map((tag: string) => (
                        <span key={tag} className="node-tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="node-actions">
                    <Link to="/copilot" className="btn btn-primary">
                      开始学习
                    </Link>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* AI 对话面板 - 默认展开 */}
          <AISidePanel
            hasInitialGraph={Boolean(graphXml)}
            isLoading={isAiUpdating}
            isScheduleGenerating={isScheduleGenerating}
            isCollapsed={isAiPanelCollapsed}
            onSendMessage={handleAiModifyGraph}
            onSatisfied={handleGenerateSchedule}
            onToggleCollapse={() => setIsAiPanelCollapsed((current) => !current)}
          />
        </div>
      </div>
    </div>
  );
}
