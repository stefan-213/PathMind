import type { Session, AIReply } from '../../../types/copilot';
import { AGENT_IDS } from '../../../constants';
import { consultation } from '../../../api/conversation';
import { parseAIContent, parseJSONResponse, extractFallbackTextFromJson } from './parse';

const AGENT_ID = AGENT_IDS.COPILOT;
const TRANSCRIPT_AGENT_ID = AGENT_IDS.COPILOT;

export { AGENT_ID, TRANSCRIPT_AGENT_ID };

/**
 * 生成唯一ID
 * @returns 格式为 "时间戳-随机字符串" 的唯一ID
 */
function generateId(): string {
  return Date.now() + '-' + Math.random().toString(36).substr(2, 8);
}

/**
 * 获取默认会话对象
 * @returns 包含默认值的Session对象
 */
function getDefaultSession(): Session {
  return {
    id: generateId(),                    // 本地唯一ID
    title: '默认对话',                   // 会话标题
    createdAt: new Date().toISOString(), // 创建时间
    messages: [],                        // 消息列表
    finalXml: '',                       // 最终生成的XML
    quickOptions: [],                   // 快捷选项
    agentId: AGENT_ID,                  // 智能体ID
    sessionId: '',                       // 服务端会话ID（后续更新）
  };
}

/**
 * 发送消息到 consultation API 并解析响应
 * @param message - 用户消息内容
 * @param agentId - 智能体ID
 * @param sessionId - 会话ID
 * @returns 解析后的AI回复对象
 */
async function fetchAIReply(message: string, agentId: string, sessionId: string): Promise<AIReply> {
  try {
    // 调用API发送消息
    const res = await consultation({ agentId, sessionId, message });
    const content = res.data?.content ?? res.data?.message ?? '';

    if (!content) {
      return { thinking: '', question: '', options: [], rawContent: content };
    }

    // 解析思考过程和实际内容
    const { thinking, response } = parseAIContent(content);
    const parsed = parseJSONResponse(response);

    // 根据解析结果返回不同的回复类型
    if (parsed?.type === 'plan-options') {
      return {
        thinking,
        question: '',
        options: [],
        planComparison: parsed.planComparison,
        rawContent: content,
      };
    }

    if (parsed?.type === 'question') {
      return {
        thinking,
        question: parsed.question,
        options: parsed.options,
        rawContent: content,
      };
    }

    // 未知格式：尝试提取文本内容
    const extraText = extractFallbackTextFromJson(response) || response.trim() || content.trim();
    return { thinking, question: '', options: [], extraText, rawContent: content };
  } catch (error) {
    console.error('Consultation API error:', error);
    return { thinking: '', question: '', options: [], extraText: '', rawContent: '' };
  }
}

export { generateId, getDefaultSession, fetchAIReply };