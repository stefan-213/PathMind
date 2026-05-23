/**
 * 知识图表页面
 * 支持 AI 生成图表
 */
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../../components/layout';
import { Spin } from '../../components/common';
import { GraphCanvas } from './GraphCanvas';
import { AISidePanel } from './AISidePanel';
import type { GraphNode } from '../../types/graph';
import { charts } from '../../api/graph';
// import { conversationApi } from '../../api/useApi';
// import { mockGraphXml } from '../../api/mock';
import './GraphPage.scss';

const CONSULT_CHART_STORAGE_KEY = 'pathmind_consult_chart';
const PLAN_DATA_STORAGE_KEY = 'pathmind_plan_data';

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

        localStorage.removeItem(CONSULT_CHART_STORAGE_KEY);

        // 使用固定 agentId 100004 调用 charts API
        const res = await charts({ ...chartData, agentId: '100004', sessionId: '' });

        console.log('【GraphPage】Charts API response:', res);
        const contentData = getChartContent(res);
        console.log('【GraphPage】contentData 类型:', typeof contentData);

        const contentObj = parseChartContent(contentData);
        console.log('【GraphPage】contentObj keys:', contentObj ? Object.keys(contentObj) : 'null');

        let hasGraphXml = false;

        // 提取 XML 数据
        if (typeof contentObj?.xml === 'string') {
          console.log('【GraphPage】成功获取 XML，长度:', contentObj.xml.length);
          if (contentObj.xml.includes('<mxGraphModel')) {
            hasGraphXml = true;
            setGraphXml(contentObj.xml);
            setIsChartLoading(false);
          }
        } else {
          console.log('【GraphPage】content 中没有 xml 字段');
        }

        // 提取 data 数据，传递给 task 页面
        if (Array.isArray(contentObj?.data)) {
          console.log('【GraphPage】成功获取 data，长度:', contentObj.data.length);
          localStorage.setItem(PLAN_DATA_STORAGE_KEY, JSON.stringify(contentObj.data));
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
            />
        </div>
      </div>
    </div>
  );
}
