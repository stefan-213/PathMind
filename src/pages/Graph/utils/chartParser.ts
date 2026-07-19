/**
 * 图表内容解析工具
 */
import { normalizeDrawioXml } from '../../../utils/drawioXml';
import { isRecord } from '../../../utils/typeGuards';
import { pathmindStorage } from '../../../utils/storage';
import type { Schedule } from '../../../types/api';

// ============================================================
// 常量
// ============================================================
const DEFAULT_GRAPH_EMPTY_MESSAGE = '在Copilot页面输入需求，让 AI 为你生成计划图表';

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
  /** 成功后回调（仅传 xml） */
  onSuccess?: (xml: string) => void;
  /** 成功后记录重试来源（传 xml 和 source） */
  recordSource?: (xml: string, source: unknown) => void;
};

const renderChartResponse = (
  res: unknown,
  title: string,
  sessionId: string | undefined,
  { setGraphXml, setGraphEmptyMessage, setChartLoadError, setIsChartLoading, onSuccess, recordSource }: RenderChartOptions,
) => {
  const contentData = getChartContent(res);

  // 优先检查 API 是否明确返回失败
  const failureMsg = getFailureMessage(res, '');
  if (failureMsg) {
    setChartLoadError(failureMsg);
    setIsChartLoading(false);
    return;
  }

  const chart = normalizeGeneratedChart(contentData);

  if (!chart) {
    // API 成功但无图表数据 → 从未生成过图表，显示空状态
    setGraphEmptyMessage(DEFAULT_GRAPH_EMPTY_MESSAGE);
    setIsChartLoading(false);
    return;
  }

  setGraphXml(chart.xml);
  setGraphEmptyMessage(DEFAULT_GRAPH_EMPTY_MESSAGE);
  setChartLoadError(null);
  setIsChartLoading(false);
  onSuccess?.(chart.xml);
  recordSource?.(chart.xml, null);

  if (Array.isArray(chart.data) && chart.data.length > 0) {
    pathmindStorage.plan.save(chart.data as Schedule[], sessionId);
  }
  if (title.trim()) {
    pathmindStorage.plan.saveTitle(title, sessionId);
  }
};

export {
  DEFAULT_GRAPH_EMPTY_MESSAGE,
  stripThinkTags,
  extractDrawioXmlText,
  extractJsonObjectText,
  parseChartContent,
  getChartContent,
  getFailureMessage,
  normalizeGeneratedChart,
  renderChartResponse,
  type ChartContent,
  type GeneratedChart,
  type RenderChartOptions,
};