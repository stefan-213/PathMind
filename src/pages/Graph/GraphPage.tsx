/**
 * 知识图表页面
 * 支持 AI 生成图表
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '../../components/layout';
import { ResourceSidebar, type ResourceSidebarItem } from '../../components/common';
import { GraphCanvas } from './GraphCanvas';
import { AISidePanel } from './AISidePanel';
import type { GraphNode } from '../../types/graph';
import type { Schedule } from '../../types/api';
import { updataXml, getXml } from '../../api/graph';
import { createSchedule } from '../../api/tasks';
import { useChatStore } from '../../stores/chatStore';
import { useSessionStore } from '../../stores/sessionStore';
import { useCopilotSessions } from '../../hooks';
import { STORAGE_KEYS } from '../../constants';
import { pathmindStorage } from '../../utils/storage';
import { isRecord } from '../../utils/typeGuards';
import { normalizeGeneratedChart, getChartContent, getFailureMessage, type GeneratedChart, DEFAULT_GRAPH_EMPTY_MESSAGE } from './utils/chartParser';
import { loadChart } from './utils/chartLoader';
import './GraphPage.scss';

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

  // Copilot 会话列表
  const {
    sessions,
    activeSessionId,
    setActiveSessionId,
    isLoading: isSessionListLoading,
    error: sessionListError,
  } = useCopilotSessions({ syncWithStore: true });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAiPanelCollapsed, setIsAiPanelCollapsed] = useState(false);

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