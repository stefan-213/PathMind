/**
 * 知识图表页面
 * 支持 AI 生成图表
 */
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../../components/layout';
import { ResourceSidebar, Spin, type ResourceSidebarItem } from '../../components/common';
import { GraphCanvas } from './GraphCanvas';
import { AISidePanel } from './AISidePanel';
import type { GraphNode } from '../../types/graph';
import { charts } from '../../api/graph';
import { getChatSessions } from '../../api/useApi';
import { normalizeDrawioXml } from '../../utils/drawioXml';
import { normalizeCopilotSessionMap, type CopilotSessionResource } from '../../utils';
// import { conversationApi } from '../../api/useApi';
// import { mockGraphXml } from '../../api/mock';
import './GraphPage.scss';

const CONSULT_CHART_STORAGE_KEY = 'pathmind_consult_chart';
const PLAN_DATA_STORAGE_KEY = 'pathmind_plan_data';
const PLAN_TITLE_STORAGE_KEY = 'pathmind_plan_title';
const COPILOT_AGENT_ID = '100003';

type ChartContent = {
  xml?: unknown;
  data?: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const stripThinkTags = (value: string) =>
  value.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

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

const parseChartContent = (contentData: unknown): ChartContent | null => {
  if (isRecord(contentData)) return contentData;
  if (typeof contentData !== 'string') return null;

  const contentWithoutThink = stripThinkTags(contentData);

  try {
    const parsed = JSON.parse(contentWithoutThink);
    return isRecord(parsed) ? parsed : null;
  } catch {
    const jsonText = extractJsonObjectText(contentWithoutThink);
    if (!jsonText) return null;

    try {
      const parsed = JSON.parse(jsonText);
      return isRecord(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
};

const getChartContent = (response: unknown) => {
  if (!isRecord(response)) return undefined;

  if (isRecord(response.data)) {
    return response.data.content;
  }

  if (typeof response.data === 'string') {
    return response.data;
  }

  return response.content;
};

const getChartTitle = (chartData: unknown) => {
  if (!isRecord(chartData)) return '';
  const title = isRecord(chartData.consultationMsg)
    ? chartData.consultationMsg.goal
    : chartData.goal;
  return typeof title === 'string' ? title.trim() : '';
};

const getChartSessionId = (chartData: unknown) => {
  if (!isRecord(chartData)) return '';
  return typeof chartData.sessionId === 'string' ? chartData.sessionId.trim() : '';
};

const getChartRequestData = (chartData: unknown) => {
  if (!isRecord(chartData) || !isRecord(chartData.consultationMsg)) return null;

  const { goal, base } = chartData.consultationMsg;
  if (typeof goal !== 'string' || typeof base !== 'string') return null;

  return {
    consultationMsg: {
      goal,
      base,
    },
  };
};

export function GraphPage() {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const hasRequestedChartRef = useRef(false);

  // AI 生成图表 XML 数据
  // const graphXml = mockGraphXml;
  const [graphXml, setGraphXml] = useState<string | null>(null);
  const [isChartLoading, setIsChartLoading] = useState(() =>
    Boolean(localStorage.getItem(CONSULT_CHART_STORAGE_KEY))
  );
  const [chartLoadingText, setChartLoadingText] = useState('正在生成计划图表...');
  const [chartLoadError, setChartLoadError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<CopilotSessionResource[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAiPanelCollapsed, setIsAiPanelCollapsed] = useState(false);
  const [isSessionListLoading, setIsSessionListLoading] = useState(false);
  const [sessionListError, setSessionListError] = useState<string | null>(null);
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
    const chartDataStr = localStorage.getItem(CONSULT_CHART_STORAGE_KEY);
    console.log('【GraphPage】charts useEffect, chartDataStr:', chartDataStr ? '有数据' : '无数据');
    if (!chartDataStr || hasRequestedChartRef.current) return;
    hasRequestedChartRef.current = true;

    const loadGeneratedChart = async () => {
      setIsChartLoading(true);
      setChartLoadingText('正在生成计划图表...');
      setChartLoadError(null);

      try {
        const chartData = JSON.parse(chartDataStr);
        console.log('【GraphPage】chartData:', chartData);
        const chartTitle = getChartTitle(chartData);
        const chartSessionId = getChartSessionId(chartData);
        const chartRequestData = getChartRequestData(chartData);

        if (!chartRequestData) {
          throw new Error('图表请求数据格式异常');
        }

        if (chartSessionId) {
          setActiveSessionId(chartSessionId);
        }

        if (chartTitle) {
          localStorage.setItem(PLAN_TITLE_STORAGE_KEY, chartTitle);
        }

        localStorage.removeItem(CONSULT_CHART_STORAGE_KEY);

        // 使用固定 agentId 100004 调用 charts API
        const res = await charts({ ...chartRequestData, agentId: '100004', sessionId: '' });

        console.log('【GraphPage】Charts API response:', res);
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
      } finally {
        localStorage.removeItem(CONSULT_CHART_STORAGE_KEY);
      }
    };

    loadGeneratedChart();
  }, []);

  const activeSessionTitle =
    sessions.find((session) => session.sessionId === activeSessionId)?.title ?? '';
  const sessionSidebarItems: ResourceSidebarItem[] = sessions.map((session) => ({
    id: session.sessionId,
    title: session.title,
    iconClass: 'fas fa-project-diagram',
    // description: session.sessionId === activeSessionId ? '当前图表' : '待接入图表接口',
  }));
  const sessionSidebarEmptyText = isSessionListLoading
    ? '会话加载中...'
    : sessionListError || '暂无历史会话';

  const handleSelectGraphSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
  };

  return (
    <div className="graph-page" ref={pageRef}>
      <Header />

      {isChartLoading && (
        <div className="graph-loading-overlay" role="status" aria-live="polite">
          <Spin size="large" tip={chartLoadingText} />
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

            {/* 图表渲染 */}
            <GraphCanvas
              xml={graphXml}
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
            isCollapsed={isAiPanelCollapsed}
            onToggleCollapse={() => setIsAiPanelCollapsed((current) => !current)}
          />
        </div>
      </div>
    </div>
  );
}
