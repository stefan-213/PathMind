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
  | { type: 'store-context'; optionId?: string; goal?: string; base?: string; sessionId?: string }
  | { type: 'localStorage'; goal?: string; base?: string; sessionId?: string; agentId?: string };

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
        onSuccess: (xml) => {
          onSuccess?.(xml);
          recordSource?.(xml, source);
        },
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
        onSuccess: (xml) => {
          onSuccess?.(xml);
          recordSource?.(xml, source);
        },
      });
      setActiveSessionId(sessionId);
    }
  } catch (err) {
    console.error('Charts API error:', err);
    setChartLoadError('计划图表加载失败，请稍后重试');
    setIsChartLoading(false);
  }
};

export { loadChart, type ChartLoadSource };