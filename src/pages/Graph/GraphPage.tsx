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
import type { Schedule } from '../../types/api';
import { setXml, updataXml, getXml } from '../../api/graph';
import { createSchedule } from '../../api/tasks';
import { getChatList } from '../../api/conversation';
import { useChatStore } from '../../stores/chatStore';
import { useSessionStore } from '../../stores/sessionStore';
import { normalizeDrawioXml } from '../../utils/drawioXml';
import { normalizeCopilotSessionMap, type CopilotSessionResource } from '../../utils';
import { AGENT_IDS, STORAGE_KEYS } from '../../constants';
import { pathmindStorage } from '../../utils/storage';
import './GraphPage.scss';

// ============================================================
// 常量
// ============================================================
const DEFAULT_GRAPH_EMPTY_MESSAGE = '在Copilot页面输入需求，让 AI 为你生成计划图表';

// ============================================================
// 工具函数：类型守卫
// ============================================================
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

// ============================================================
// 工具函数：文本解析
// ============================================================
const stripThinkTags = (value: string) =>
  value.replace(/<think\b[^>]*>[\s\S]*?<\/think>/gi, '').trim();

const extractDrawioXmlText = (value: string): string | null => {
  const mxfileStart = value.indexOf('<mxfile');
  const mxfileEnd = value.lastIndexOf('</mxfile>');

  if (mxfileStart >= 0 && mxfileEnd >= mxfileStart) {
    return value.slice(mxfileStart, mxfileEnd + '</mxfile>'.length);
  }

  const graphStart = value.indexOf('<mxGraphModel');
  if (graphStart < 0) return null;

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

const extractJsonObjectText = (value: string): string | null => {
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

// ============================================================
// 工具函数：响应解析
// ============================================================
type ChartContent = {
  xml?: unknown;
  data?: unknown;
};

const parseChartContent = (contentData: unknown): ChartContent | null => {
  if (isRecord(contentData)) {
    if (typeof contentData.xml === 'string') return contentData;

    const nestedContent =
      typeof contentData.content === 'string'
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
  if (xmlText) return { xml: xmlText };

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

const getChartContent = (response: unknown): unknown => {
  if (typeof response === 'string') return response;
  if (!isRecord(response)) return undefined;

  if (isRecord(response.data)) {
    if ('content' in response.data) return response.data.content;
    if ('centent' in response.data) return response.data.centent;
    if ('message' in response.data) return response.data.message;
    if ('xml' in response.data) return response.data.xml;
    return response.data;
  }
  if (typeof response.data === 'string') return response.data;
  return response.content;
};

const getFailureMessage = (response: unknown, fallback: string): string => {
  if (!isRecord(response)) return fallback;
  if (typeof response.error === 'string' && response.error.trim()) return response.error;
  if (typeof response.message === 'string' && response.message.trim()) return response.message;
  return fallback;
};

type GeneratedChart = {
  xml: string;
  data?: unknown[];
  repaired: boolean;
};

const normalizeGeneratedChart = (contentData: unknown): GeneratedChart | null => {
  const contentObj = parseChartContent(contentData);
  if (typeof contentObj?.xml !== 'string') return null;

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

// ============================================================
// 图表渲染
// ============================================================
type RenderChartOptions = {
  setGraphXml: (xml: string | null) => void;
  setGraphEmptyMessage: (msg: string) => void;
  setChartLoadError: (err: string | null) => void;
  setIsChartLoading: (loading: boolean) => void;
};

const renderChartResponse = (
  res: unknown,
  title: string,
  sessionId: string | undefined,
  { setGraphXml, setGraphEmptyMessage, setChartLoadError, setIsChartLoading }: RenderChartOptions,
) => {
  const contentData = getChartContent(res);
  const chart = normalizeGeneratedChart(contentData);

  if (!chart) {
    // setChartLoadError('计划图表生成失败，请稍后重试');
    setIsChartLoading(false);
    return;
  }

  setGraphXml(chart.xml);
  setGraphEmptyMessage(DEFAULT_GRAPH_EMPTY_MESSAGE);
  setChartLoadError(null);
  setIsChartLoading(false);

  if (Array.isArray(chart.data) && chart.data.length > 0) {
    pathmindStorage.plan.save(chart.data as Schedule[], sessionId);
  }
  if (title.trim()) {
    pathmindStorage.plan.saveTitle(title, sessionId);
  }
};

// ============================================================
// 图表加载
// ============================================================
type ChartLoadSource =
  | { type: 'store-context'; optionId?: string; goal?: string; base?: string; sessionId?: string }
  | { type: 'localStorage'; goal?: string; base?: string; sessionId?: string; agentId?: string };

const loadChart = async (
  source: ChartLoadSource,
  {
    setGraphXml,
    setGraphEmptyMessage,
    setChartLoadError,
    setIsChartLoading,
    setActiveSessionId,
  }: RenderChartOptions & { setActiveSessionId: (id: string | null) => void },
) => {
  setIsChartLoading(true);
  setChartLoadError(null);
  setGraphEmptyMessage(DEFAULT_GRAPH_EMPTY_MESSAGE);
  setGraphXml(null);

  try {
    // 确定是生成新图表还是加载已有图表
    const isConsultation = source.type === 'store-context'
      ? Boolean(source.goal && source.base)
      : Boolean(source.goal && source.base);

    if (isConsultation) {
      //  consultationMsg 路径：生成新图表
      const consultationMsg = source.type === 'store-context'
        ? { goal: source.goal!, base: source.base! }
        : { goal: source.goal!, base: source.base! };

      const sessionId = source.type === 'store-context' ? source.sessionId : source.sessionId;

      const res = await setXml({
        consultationMsg,
        agentId: AGENT_IDS.GRAPH_GENERATOR,
        sessionId: sessionId || undefined,
      });

      const title = source.type === 'store-context' ? (source.goal ?? '') : (source.goal ?? '');
      renderChartResponse(res, title, sessionId || undefined, {
        setGraphXml, setGraphEmptyMessage, setChartLoadError, setIsChartLoading,
      });

      if (sessionId) {
        setActiveSessionId(sessionId);
      }
    } else {
      // optionId / group 路径：加载已有图表
      const sessionId = source.type === 'store-context' ? source.sessionId : source.sessionId;
      if (!sessionId) {
        setChartLoadError('会话 ID 缺失，无法加载图表');
        setIsChartLoading(false);
        return;
      }

      const res = await getXml(sessionId);
      renderChartResponse(res, '', sessionId, {
        setGraphXml, setGraphEmptyMessage, setChartLoadError, setIsChartLoading,
      });
      setActiveSessionId(sessionId);
    }
  } catch (err) {
    console.error('Charts API error:', err);
    setChartLoadError('计划图表加载失败，请稍后重试');
    setIsChartLoading(false);
  }
};

// ============================================================
// 组件
// ============================================================
export function GraphPage() {
  const navigate = useNavigate();
  const addMessage = useChatStore((state) => state.addMessage);
  // 选中节点（节点详情面板）
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  // 图表状态
  const [graphXml, setGraphXml] = useState<string | null>(null);
  const [graphEmptyMessage, setGraphEmptyMessage] = useState(DEFAULT_GRAPH_EMPTY_MESSAGE);
  const [isChartLoading, setIsChartLoading] = useState(() =>
    Boolean(pathmindStorage.consult.load()) ||
    sessionStorage.getItem(STORAGE_KEYS.GENERATING_PLAN) === 'true',
  );
  const [chartLoadError, setChartLoadError] = useState<string | null>(null);

  // AI 修改状态
  const [isAiUpdating, setIsAiUpdating] = useState(false);

  // 日程表生成状态
  const [isScheduleGenerating, setIsScheduleGenerating] = useState(false);

  // 会话列表
  const [sessions, setSessions] = useState<CopilotSessionResource[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAiPanelCollapsed, setIsAiPanelCollapsed] = useState(false);
  const [isSessionListLoading, setIsSessionListLoading] = useState(false);
  const [sessionListError, setSessionListError] = useState<string | null>(null);

  // sessionStore 数据
  const { currentSessionId: storeSessionId, consultContext: storeContext } = useSessionStore();

  // 会话图表缓存
  const [sessionCharts, setSessionCharts] = useState<Record<string, GeneratedChart>>({});

  // 防止重复加载已有图表
  const hasAutoLoadedInitialSessionRef = useRef(false);

  // ---------------------------------------------
  // 辅助：缓存并渲染会话图表
  // ---------------------------------------------
  const cacheAndRenderSessionChart = useCallback(
    (sessionId: string, title: string, chart: GeneratedChart) => {
      setSessionCharts((current) => ({ ...current, [sessionId]: chart }));
      setGraphXml(chart.xml);
      setGraphEmptyMessage(DEFAULT_GRAPH_EMPTY_MESSAGE);
      setChartLoadError(null);
      setSelectedNode(null);

      if (Array.isArray(chart.data) && chart.data.length > 0) {
        pathmindStorage.plan.save(chart.data as Schedule[], sessionId);
      }
      if (title.trim()) {
        pathmindStorage.plan.saveTitle(title, sessionId);
      }
    },
    [],
  );

  const renderCachedSessionChart = useCallback(
    (sessionId: string, title: string): boolean => {
      const cachedChart = sessionCharts[sessionId];
      if (!cachedChart) return false;

      setGraphXml(cachedChart.xml);
      setGraphEmptyMessage(DEFAULT_GRAPH_EMPTY_MESSAGE);
      setSelectedNode(null);
      setChartLoadError(null);

      if (Array.isArray(cachedChart.data) && cachedChart.data.length > 0) {
        pathmindStorage.plan.save(cachedChart.data as Schedule[], sessionId);
      }
      if (title.trim()) {
        pathmindStorage.plan.saveTitle(title, sessionId);
      }
      return true;
    },
    [sessionCharts],
  );

  // ---------------------------------------------
  // 副作用：滚动到顶部
  // ---------------------------------------------
  useEffect(() => {
    window.scrollTo(0, 0);
    if (pageRef.current) {
      pageRef.current.scrollTop = 0;
    }
  }, []);

  // ---------------------------------------------
  // 副作用：图表加载完成后清除跨页面传递的 GENERATING_PLAN 标记
  // ---------------------------------------------
  useEffect(() => {
    if (!isChartLoading) {
      sessionStorage.removeItem(STORAGE_KEYS.GENERATING_PLAN);
    }
  }, [isChartLoading]);

  // ---------------------------------------------
  // 副作用：加载 Copilot 会话列表
  // ---------------------------------------------
  useEffect(() => {
    let isMounted = true;

    const loadCopilotSessions = async () => {
      setIsSessionListLoading(true);
      setSessionListError(null);

      try {
        const response = await getChatList(AGENT_IDS.COPILOT);
        if (response.success === false) {
          throw new Error(response.error || '会话列表加载失败');
        }

        const nextSessions = normalizeCopilotSessionMap(response.data);
        if (!isMounted) return;

        setSessions(nextSessions);
        setActiveSessionId((current) => {
          if (current && nextSessions.some((s) => s.sessionId === current)) return current;
          return nextSessions[0]?.sessionId ?? null;
        });
      } catch (error) {
        console.error('Load copilot sessions failed:', error);
        if (isMounted) setSessionListError('会话列表加载失败');
      } finally {
        if (isMounted) setIsSessionListLoading(false);
      }
    };

    void loadCopilotSessions();
    return () => { isMounted = false; };
  }, []);

  // ---------------------------------------------
  // 副作用：加载图表（优先从 sessionStore，降级从 localStorage）
  // ---------------------------------------------
  useEffect(() => {
    if (storeContext) {
      // 优先从 sessionStore 读取（Copilot 跳转过来时）
      const { optionId, goal, base } = storeContext;
      void loadChart(
        { type: 'store-context', optionId, goal, base, sessionId: storeSessionId ?? undefined },
        { setGraphXml, setGraphEmptyMessage, setChartLoadError, setIsChartLoading, setActiveSessionId },
      );
      useSessionStore.getState().clearCurrentSession();
      return;
    }

    // 降级：从 localStorage 读取（刷新页面时）
    const chartData = pathmindStorage.consult.load();
    if (!chartData) return;

    const { consultationMsg, sessionId } = chartData;
    if (consultationMsg?.goal && consultationMsg?.base) {
      void loadChart(
        { type: 'localStorage', goal: consultationMsg.goal, base: consultationMsg.base, sessionId },
        { setGraphXml, setGraphEmptyMessage, setChartLoadError, setIsChartLoading, setActiveSessionId },
      );
    }
    pathmindStorage.consult.clear();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------
  // 副作用：自动加载当前会话图表
  // ---------------------------------------------
  useEffect(() => {
    if (hasAutoLoadedInitialSessionRef.current) return;
    if (!activeSessionId || graphXml || isChartLoading) return;
    if (storeContext) return; // 已有 storeContext，跳过自动加载

    hasAutoLoadedInitialSessionRef.current = true;
    handleSelectGraphSession(activeSessionId);
  }, [activeSessionId, graphXml, isChartLoading, storeContext]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------
  // 事件处理：AI 修改图表
  // ---------------------------------------------
  const handleAiModifyGraph = useCallback(
    async (message: string) => {
      const normalizedMessage = message.trim();
      const normalizedSessionId = activeSessionId?.trim() ?? '';

      if (!normalizedMessage || isAiUpdating || isScheduleGenerating) return;
      if (!normalizedSessionId) {
        addMessage({ role: 'assistant', content: '请先选择一个会话图表后再发送修改意见。' });
        return;
      }

      setIsAiUpdating(true);
      setChartLoadError(null);

      try {
        const response = await updataXml({ sessionId: normalizedSessionId, message: normalizedMessage });

        if (isRecord(response) && response.success === false) {
          throw new Error(getFailureMessage(response, '图表修改失败，请稍后重试'));
        }

        // 调用 getXml 获取服务端最新图表数据
        const xmlResponse = await getXml(normalizedSessionId);
        const chart = normalizeGeneratedChart(getChartContent(xmlResponse));
        if (!chart) throw new Error('图表数据格式异常');

        const title = sessions.find((s) => s.sessionId === normalizedSessionId)?.title ?? normalizedSessionId;
        cacheAndRenderSessionChart(normalizedSessionId, title, chart);
        addMessage({
          role: 'assistant',
          content: '已按照您的需求修改，请查看，如果不满意请继续提出修改意见。',
          hasGraph: true,
        });
      } catch (error) {
        console.error('Update graph failed:', error);
        const messageText = error instanceof Error && error.message ? error.message : '图表修改失败，请稍后重试';
        setChartLoadError(messageText);
        addMessage({ role: 'assistant', content: messageText });
      } finally {
        setIsAiUpdating(false);
      }
    },
    [activeSessionId, addMessage, cacheAndRenderSessionChart, isAiUpdating, isScheduleGenerating, sessions],
  );

  // ---------------------------------------------
  // 事件处理：生成日程表
  // ---------------------------------------------
  const handleGenerateSchedule = useCallback(
    async () => {
      const normalizedSessionId = activeSessionId?.trim() ?? '';
      if (isScheduleGenerating) return;
      if (!normalizedSessionId) {
        addMessage({ role: 'assistant', content: '当前还没有可用于生成日程表的图表，请先生成或选择一个图表。' });
        return;
      }

      setIsScheduleGenerating(true);
      setChartLoadError(null);

      try {
        // 优先使用图表生成时已保存的日程数据
        // const existingData = pathmindStorage.plan.load();
        // if (existingData.length > 0) {
        //   setSatisfactionState('satisfied');
        //   pathmindStorage.consult.clear();
        //   navigate('/tasks');
        //   return;
        // }

        // 没有缓存数据，调用后端 createSchedule 接口
        const response = await createSchedule(normalizedSessionId);
        if (response.success === false) {
          throw new Error(response.error || '日程表生成失败，请稍后重试');
        }

        pathmindStorage.consult.clear();
        navigate('/tasks');
      } catch (error) {
        console.error('Generate schedule failed:', error);
        const messageText = error instanceof Error && error.message ? error.message : '日程表生成失败，请稍后重试';
        addMessage({ role: 'assistant', content: messageText });
      } finally {
        setIsScheduleGenerating(false);
      }
    },
    [activeSessionId, addMessage, isScheduleGenerating, navigate],
  );

  // ---------------------------------------------
  // 事件处理：选择会话图表
  // ---------------------------------------------
  const handleSelectGraphSession = useCallback(
    (sessionId: string) => {
      const title = sessions.find((s) => s.sessionId === sessionId)?.title ?? sessionId;
      setActiveSessionId(sessionId);
      if (renderCachedSessionChart(sessionId, title)) return;

      // 加载该会话的已有图表
      void loadChart(
        { type: 'localStorage', sessionId },
        { setGraphXml, setGraphEmptyMessage, setChartLoadError, setIsChartLoading, setActiveSessionId },
      );
    },
    [sessions, renderCachedSessionChart, setGraphXml, setGraphEmptyMessage, setChartLoadError, setIsChartLoading, setActiveSessionId],
  );

  // ---------------------------------------------
  // 渲染
  // ---------------------------------------------
  const activeSessionTitle = sessions.find((s) => s.sessionId === activeSessionId)?.title ?? '';

  const sessionSidebarItems: ResourceSidebarItem[] = sessions.map((session) => ({
    id: session.sessionId,
    title: session.title,
    iconClass: 'fas fa-project-diagram',
  }));

  const sessionSidebarEmptyText = isSessionListLoading
    ? '会话加载中...'
    : sessionListError || '暂无历史会话';

  return (
    <div className="graph-page" ref={pageRef}>
      <Header />

      

      <div className="graph-main">
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
            onToggleCollapse={() => setIsSidebarCollapsed((c) => !c)}
            onSelectItem={handleSelectGraphSession}
            emptyText={sessionSidebarEmptyText}
            collapseTitle="收起侧栏"
            expandTitle="展开侧栏"
            className="graph-resource-sidebar"
          />

          <div className="graph-wrapper with-ai-panel">
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
                <button className="btn-close" onClick={() => setSelectedNode(null)}>×</button>
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
                        <span key={tag} className="node-tag">{tag}</span>
                      ))}
                    </div>
                  )}
                  <div className="node-actions">
                    <Link to="/copilot" className="btn btn-primary">开始学习</Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          <AISidePanel
            hasInitialGraph={Boolean(graphXml)}
            sessionId={activeSessionId}
            isLoading={isAiUpdating}
            isScheduleGenerating={isScheduleGenerating}
            isCollapsed={isAiPanelCollapsed}
            onSendMessage={handleAiModifyGraph}
            onSatisfied={handleGenerateSchedule}
            onToggleCollapse={() => setIsAiPanelCollapsed((c) => !c)}
          />
        </div>
      </div>
    </div>
  );
}