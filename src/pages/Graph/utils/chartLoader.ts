/**
 * 图表加载工具
 */
import { setXml, getXml } from '../../../api/graph';
import { AGENT_IDS } from '../../../constants';
import { renderChartResponse, DEFAULT_GRAPH_EMPTY_MESSAGE } from './chartParser';
import type { RenderChartOptions } from './chartParser';

// ============================================================
// 类型
// ============================================================
type ChartLoadSource =
  | { type: 'store-context'; optionId?: string; sessionId?: string }
  | { type: 'localStorage'; sessionId?: string };

// ============================================================
// 图表加载
// ============================================================
const loadChart = async (
  source: ChartLoadSource,
  {
    setGraphXml,
    setGraphEmptyMessage,
    setChartLoadError,
    setIsChartLoading,
    setActiveSessionId,
    onSuccess,
    recordSource,
  }: RenderChartOptions & { setActiveSessionId: (id: string | null) => void },
) => {
  setIsChartLoading(true);
  setChartLoadError(null);
  setGraphEmptyMessage(DEFAULT_GRAPH_EMPTY_MESSAGE);
  setGraphXml(null);

  try {
    const sessionId = source.sessionId;

    if (!sessionId) {
      setChartLoadError('会话 ID 缺失，无法加载图表');
      setIsChartLoading(false);
      return;
    }

    // 有 optionId 则生成新图表，否则加载已有图表
    const optionId = source.type === 'store-context' ? source.optionId : undefined;

    if (optionId !== undefined) {
      const res = await setXml({
        agentId: AGENT_IDS.GRAPH_GENERATOR,
        sessionId,
        message: String(optionId),
      });
      renderChartResponse(res, '', sessionId, {
        setGraphXml, setGraphEmptyMessage, setChartLoadError, setIsChartLoading,
        onSuccess: (xml) => {
          onSuccess?.(xml);
          recordSource?.(xml, source);
        },
      });
    } else {
      const res = await getXml(sessionId);
      renderChartResponse(res, '', sessionId, {
        setGraphXml, setGraphEmptyMessage, setChartLoadError, setIsChartLoading,
        onSuccess: (xml) => {
          onSuccess?.(xml);
          recordSource?.(xml, source);
        },
      });
    }
    setActiveSessionId(sessionId);
  } catch (err) {
    console.error('Charts API error:', err);
    setChartLoadError('计划图表加载失败，请稍后重试');
    setIsChartLoading(false);
  }
};

export { loadChart, type ChartLoadSource };