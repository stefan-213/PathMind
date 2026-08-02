/**
 * AI 回复解析工具
 * 解析 Copilot 会话中 AI 返回的思考过程、JSON 响应和方案对比内容
 */

import type { ParsedJSONResponse, PlanComparisonResponse } from '../../../types/copilot';
import type { PlanOption } from '../../../types/api';
import { isRecord } from '../../../utils/typeGuards';

/**
 * 安全获取字符串值
 */
function getString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

/**
 * 安全获取字符串数组
 */
function getStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

/**
 * 规范化方案选项对象
 * 将API返回的原始数据转换为标准的PlanOption类型
 */
function normalizePlanOption(value: unknown): PlanOption | null {
  if (!isRecord(value)) return null;

  const id = getString(value.id);
  const name = getString(value.name);

  if (!id || !name) return null;

  return {
    id,
    name,
    core_idea: getString(value.core_idea, '-'),
    suitable_for: getString(value.suitable_for, '-'),
    path: getStringArray(value.path),
    pros: getStringArray(value.pros),
    cons: getStringArray(value.cons),
    cost: getString(value.cost, '-'),
    difficulty: getString(value.difficulty, '-'),
  };
}

/**
 * 规范化方案对比响应
 * 将API返回的原始数据转换为标准的PlanComparisonResponse类型
 */
function normalizePlanComparison(value: unknown): PlanComparisonResponse | null {
  if (!isRecord(value)) return null;
  if (!Array.isArray(value.options)) return null;

  // 映射并过滤掉无效的方案选项
  const options = value.options
    .map(normalizePlanOption)
    .filter((option): option is PlanOption => option !== null);

  if (options.length === 0 || !isRecord(value.recommended)) return null;

  const message = getString(value.recommended.option_id);
  const reason = getString(value.recommended.reason);

  if (!message || !reason) return null;

  return {
    options,
    recommended: {
      option_id: message,
      reason,
    },
    decision_points: getStringArray(value.decision_points),
  };
}

/**
 * 从内容中提取JSON文本
 * 支持去除markdown代码块标记
 */
function extractJsonText(content: string): string | null {
  // 移除可能的markdown代码块标记
  const jsonStr = content.trim().replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  // 匹配JSON对象
  const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
  return jsonMatch ? jsonMatch[0] : null;
}

/**
 * 解析 AI 回复中的思考过程和实际内容
 * @param content - AI的原始回复内容
 * @returns 包含思考内容和实际回复的对象
 */
function parseAIContent(content: string): { thinking: string; response: string } {
  // 使用正则匹配 <think> 标签内的内容
  const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>/);
  const thinking = thinkMatch ? thinkMatch[1].trim() : '';
  // 移除 <think> 标签及其内容，得到实际回复
  const response = content
    .replace(/<think>[\s\S]*?<\/think>/, '')
    .replace(/\\n/g, '\n')  // 将转义的换行符转换为实际换行
    .trim();
  return { thinking, response };
}

/**
 * 解析 JSON 格式的 AI 回复
 * 支持两种格式：方案对比(plan-options)、问答(question)、普通JSON、方案总结(preview-diagnosis)->NULL
 */
function parseJSONResponse(content: string): ParsedJSONResponse {
  const jsonText = extractJsonText(content);
  if (!jsonText) return { type: 'unknown' };

  try {
    const parsed: unknown = JSON.parse(jsonText);

    // 尝试解析为方案对比格式
    const planComparison = normalizePlanComparison(parsed);
    if (planComparison) {
      return { type: 'plan-options', planComparison };
    }

    if (!isRecord(parsed)) return {
      type: 'unknown'
    };

    if (parsed.preview !== undefined || parsed.diagnosis !== undefined) {
      return null;
    }

    // 问答格式（question + options）
    if (parsed.question !== undefined) {
      return {
        type: 'question',
        question: getString(parsed.question),
        options: getStringArray(parsed.options),
      };
    }

    return { type: 'unknown' };
  } catch {
    return { type: 'unknown' };
  }
}

/**
 * 从JSON中提取备用的纯文本内容
 * 当无法识别特定格式时，尝试提取 message/text/content 字段
 */
function extractFallbackTextFromJson(content: string): string {
  const jsonText = extractJsonText(content);
  if (!jsonText) return '';

  try {
    const parsed: unknown = JSON.parse(jsonText);
    if (!isRecord(parsed)) return '';

    return (
      getString(parsed.message) ||
      getString(parsed.text) ||
      getString(parsed.content) ||
      JSON.stringify(parsed)
    );
  } catch {
    return '';
  }
}

/**
 * 生成欢迎消息HTML
 * 首次进入对话时显示
 */
function getWelcomeMessageHtml(): string {
  return `<p>👋 <strong>我是 PathMind AI 技术顾问</strong></p>
<p>请描述你的开发或学习目标，我会为你生成专属技术路线图与详细计划。</p>
<p>例如：「AI智能问答应用」、「企业级数据分析平台」、「移动端App」</p>
<div class="quick-start-hint">
  <i class="fas fa-bolt"></i> 你也可以直接点击下方的快捷选项开始
</div>`;
}

// 初始快捷选项：用户首次进入时显示的快速开始选项
const INITIAL_QUICK_OPTIONS = [
  '人工智能与大模型应用',
  '全栈软件开发',
  '云计算与DevOps',
  '网络与信息安全',
];

export {
  parseAIContent,
  getString,
  getStringArray,
  normalizePlanOption,
  normalizePlanComparison,
  extractJsonText,
  parseJSONResponse,
  extractFallbackTextFromJson,
  getWelcomeMessageHtml,
  INITIAL_QUICK_OPTIONS,
};