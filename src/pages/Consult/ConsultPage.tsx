/* ============================================
   ConsultPage - AI Copilot对话页面
   功能：与AI助手进行技术咨询对话，生成技术路线图
============================================ */

// ---------- React 核心库导入 ----------
import { useState, useEffect, useRef, useCallback, memo } from 'react';
// useState: 管理组件状态
// useEffect: 处理副作用（初始化、加载数据等）
// useRef: 引用DOM元素或保存不触发渲染的值
// useCallback: 缓存函数，避免不必要的重新创建
// memo: 组件记忆化，避免不必要的重渲染

// ---------- 路由库导入 ----------
import { useNavigate } from 'react-router-dom';
// useNavigate: 编程式导航，用于页面跳转

// ---------- 组件导入 ----------
import { Badge, Button, ResourceSidebar, Spin, type ResourceSidebarItem } from '../../components/common';
// Badge: 徽章组件，显示"推荐"标签
// Button: 按钮组件
// ResourceSidebar: 侧边栏组件，显示会话列表
// Spin: 加载动画组件
// ResourceSidebarItem: 侧边栏项的类型定义

// ---------- 布局组件导入 ----------
import { Header } from '../../components/layout/Header';
// Header: 页面顶部导航栏

// ---------- API 函数导入 ----------
import { createChatSession, deleteChatSession, getChatList, consultation, getChatHistory } from '../../api/conversation';
import { setXml } from '../../api/graph';
// createChatSession: 创建新的聊天会话
// deleteChatSession: 删除聊天会话
// getChatList: 获取会话列表
// consultation: 发送消息给AI并获取回复
// getChatHistory: 获取会话的历史消息

// ---------- 类型定义导入 ----------
import type {
  PlanComparisonResponse,  // 方案对比响应数据类型
  PlanOption,              // 单个方案选项类型
  Session,                 // 会话数据类型
  Message,                 // 消息数据类型
  AIReply,                 // AI回复数据类型
  ParsedJSONResponse,     // 解析后的JSON响应类型
  OpenGraphPayload,       // 打开图表时的参数类型
  MessageItemProps,       // 消息组件的props类型
  PlanComparisonMessageProps, // 方案对比消息组件的props类型
  QuickOptionsProps,      // 快捷选项组件的props类型
} from '../../types/copilot';

// ---------- 状态管理导入 ----------
import { useSessionStore } from '../../stores/sessionStore';
// useSessionStore: 全局会话状态管理

// ---------- 常量导入 ----------
import { AGENT_IDS, STORAGE_KEYS } from '../../constants';
// AGENT_IDS: 智能体ID配置
// STORAGE_KEYS: 本地存储的key常量

// ---------- 样式导入 ----------
import './ConsultPage.scss';
// 页面样式文件

// ---------- 常量定义 ----------
const AGENT_ID = AGENT_IDS.COPILOT;        // 当前使用的智能体ID
const TRANSCRIPT_AGENT_ID = AGENT_IDS.COPILOT; // 用于获取历史记录的智能体ID

// ---------- 工具函数 ----------
/**
 * 生成唯一ID
 * @returns 格式为 "时间戳-随机字符串" 的唯一ID
 */
function generateId(): string {
  return Date.now() + '-' + Math.random().toString(36).substr(2, 8);
}

// 初始快捷选项：用户首次进入时显示的快速开始选项
const INITIAL_QUICK_OPTIONS = [
  'AI智能问答应用',
  '企业级Web系统',
  '移动端App',
  '数据分析平台',
];

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
    planDetails: [],                    // 方案详情
    quickOptions: [],                   // 快捷选项列表
  };
}

/**
 * 解析 AI 回复中的思考过程和实际内容
 * AI回复格式: <think>思考内容</think>实际回复内容
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
 * 类型守卫：检查值是否为非数组的对象
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

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

// ---------- 子组件：打字动画 ----------
/**
 * 打字动画组件
 * 显示三个跳动的小圆点，表示AI正在输入
 */
function TypingDots() {
  return (
    <div className="typing-dots">
      <span></span>
      <span></span>
      <span></span>
    </div>
  );
}

// ---------- 子组件：消息渲染 ----------

/**
 * 格式化选项文本（去除 A. B. 等前缀）
 * @param option - 原始选项文本
 * @returns 去除前缀后的纯文本
 */
function formatOptionText(option: string): string {
  const match = option.match(/^[A-F][.、]\s*(.+)$/);
  return match ? match[1] : option;
}

/**
 * 方案对比列表组件
 * 渲染方案的优势/劣势等列表数据
 */
function PlanComparisonList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <span className="plan-comparison-empty">-</span>;
  }

  return (
    <ul className="plan-comparison-list">
      {items.map((item, index) => (
        <li key={`${item}-${index}`}>{item}</li>
      ))}
    </ul>
  );
}

/**
 * 方案对比消息组件
 * 展示多个方案的对比表格，包含推荐方案和决策提示
 */
const PlanComparisonMessage = memo(function PlanComparisonMessage({ 
  data,        // 方案对比数据
  disabled,    // 是否禁用按钮
  onSelectOption // 选择方案的回调函数
}: PlanComparisonMessageProps) {
  // 找到推荐方案
  const recommendedOption = data.options.find(
    (option) => option.id === data.recommended.option_id
  );
  
  // 定义对比表格的行配置
  const comparisonRows = [
    { label: '核心思路', render: (option: PlanOption) => option.core_idea },
    { label: '适合人群', render: (option: PlanOption) => option.suitable_for },
    { label: '优点', render: (option: PlanOption) => <PlanComparisonList items={option.pros} /> },
    { label: '风险/不足', render: (option: PlanOption) => <PlanComparisonList items={option.cons} /> },
    { label: '成本', render: (option: PlanOption) => option.cost },
    { label: '难度', render: (option: PlanOption) => option.difficulty },
  ];

  return (
    <div className="plan-comparison">
      {/* 方案对比表格 */}
      <div className="plan-comparison-table-wrap">
        <table className="plan-comparison-table">
          <thead>
            <tr>
              <th className="plan-comparison-table__metric">对比项</th>
              {data.options.map((option) => {
                const isRecommended = option.id === data.recommended.option_id;
                return (
                  <th
                    key={option.id}
                    className={isRecommended ? 'plan-comparison-table__column--recommended' : ''}
                  >
                    <div className="plan-option-name">
                      <span>{option.name}</span>
                      {isRecommended && <Badge variant="accent" size="sm">推荐</Badge>}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {comparisonRows.map((row) => (
              <tr key={row.label}>
                <th scope="row" className="plan-comparison-table__metric">
                  {row.label}
                </th>
                {data.options.map((option) => {
                  const isRecommended = option.id === data.recommended.option_id;
                  return (
                    <td
                      key={`${row.label}-${option.id}`}
                      className={isRecommended ? 'plan-comparison-table__column--recommended' : ''}
                    >
                      {row.render(option)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 推荐方案区域 */}
      <section className="plan-recommendation">
        <div className="plan-recommendation__title">
          <i className="fas fa-star"></i>
          <span>推荐方案</span>
        </div>
        <div className="plan-recommendation__name">
          {recommendedOption?.name || data.recommended.option_id}
        </div>
        <p className="plan-recommendation__reason">{data.recommended.reason}</p>
      </section>

      {/* 决策提示 */}
      {data.decision_points.length > 0 && (
        <section className="plan-decision-points">
          <div className="plan-decision-points__title">决策提示</div>
          <ul>
            {data.decision_points.map((point, index) => (
              <li key={`${point}-${index}`}>{point}</li>
            ))}
          </ul>
        </section>
      )}

      {/* 操作按钮：每个方案对应一个生成按钮 */}
      <div className="plan-option-actions">
        {data.options.map((option) => {
          const isRecommended = option.id === data.recommended.option_id;
          return (
            <Button
              key={option.id}
              variant={isRecommended ? 'primary' : 'secondary'}
              disabled={disabled || !onSelectOption}
              onClick={() => {
                // 找到用户点击的方案的索引
                const clickedIndex = data.options.findIndex(
                  (o) => o.id === option.id
                );
                onSelectOption?.(option.id, clickedIndex);
              }}
            >
              生成：{option.name}
            </Button>
          );
        })}
      </div>
    </div>
  );
});

/**
 * 单条消息组件
 * 渲染用户消息或AI消息，支持多种内容格式
 */
const MessageItem = memo(function MessageItem({
  message,              // 消息数据
  onOptionSelect,       // 选项选择回调
  onPlanOptionSelect,   // 方案选择回调
  optionsDisabled = false, // 选项是否禁用
}: MessageItemProps) {
  const [showThinking, setShowThinking] = useState(false); // 是否显示思考过程
  const isAssistant = message.role === 'assistant';
  const { thinking, response } = parseAIContent(message.content);

  // 解析JSON响应，判断内容类型
  const jsonParsed = parseJSONResponse(response);

  // preview/diagnosis 格式不渲染
  if (!jsonParsed) return null;

  const isPlanOptionsFormat = jsonParsed.type === 'plan-options'; // 方案对比
  const isQuestionFormat = jsonParsed.type === 'question';        // 问答

  return (
    <div className={`message-item ${isAssistant ? '' : 'message-item--user'}${isPlanOptionsFormat ? ' message-item--plan-options' : ''}`}>
      {/* AI消息头部 */}
      {isAssistant && (
        <div className="message-header">
          <span className="message-label">PathMind AI</span>
          <span className="message-time">刚刚</span>
        </div>
      )}
      <div className={`message-bubble ${isAssistant ? 'message-bubble--assistant' : 'message-bubble--user'}`}>
        {/* 思考过程 - 可折叠展开 */}
        {thinking && (
          <div className="thinking-section">
            <button
              className="thinking-toggle"
              onClick={() => setShowThinking(!showThinking)}
            >
              {showThinking ? '▼' : '▶'} 思考过程
            </button>
            {showThinking && (
              <div className="thinking-content">
                {thinking.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 消息内容渲染 */}
        <div className="message-content">
          {isPlanOptionsFormat ? (
            // 方案对比格式
            <PlanComparisonMessage
              data={jsonParsed.planComparison}
              disabled={optionsDisabled}
              onSelectOption={onPlanOptionSelect}
            />
          ) : message.isHtml ? (
            // HTML格式内容（使用dangerouslySetInnerHTML渲染）
            <div dangerouslySetInnerHTML={{ __html: message.content }} />
          ) : isQuestionFormat ? (
            // 问答格式：显示问题和选项按钮
            <div className="question-container">
              <p className="question-text">{jsonParsed.question}</p>
              {jsonParsed.options && jsonParsed.options.length > 0 && (
                <div className="question-options-list">
                  {jsonParsed.options.map((opt, idx) => {
                    const prefix = String.fromCharCode(65 + idx); // A, B, C, ...
                    const optionText = formatOptionText(opt);
                    return (
                      <button
                        key={idx}
                        type="button"
                        className="question-option-item"
                        disabled={optionsDisabled}
                        onClick={() => {
                          if (optionsDisabled) return;
                          onOptionSelect?.(opt);
                        }}
                      >
                        <span className="option-prefix">{prefix}.</span>
                        <span className="option-text">{optionText}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            // 普通文本格式：按行渲染，识别选项行
            response.split('\n').map((line, i) => {
              const trimmedLine = line.trim();
              if (/^[A-D][.、]\s/.test(trimmedLine)) {
                return <div key={i} className="option-line">{line}</div>;
              }
              return line ? <p key={i}>{line}</p> : <br key={i} />;
            })
          )}
        </div>
      </div>
    </div>
  );
});

// ---------- 子组件：快捷选项 ----------

/**
 * 快捷选项组件
 * 显示一系列可点击的快捷按钮
 */
const QuickOptions = memo(function QuickOptions({ 
  options,   // 选项列表
  onSelect,  // 点击回调
  disabled   // 是否禁用
}: QuickOptionsProps) {
  if (options.length === 0) return null;
  return (
    <div className="quick-options">
      {options.map((opt, i) => (
        <button
          key={i}
          type="button"
          className="quick-option-btn"
          disabled={disabled}
          onClick={() => {
            if (!disabled) onSelect(opt);
          }}
        >
          {opt}
        </button>
      ))}
    </div>
  );
});

// ---------- 主页面组件 ----------
/**
 * ConsultPage - 咨询对话页面主组件
 * 管理会话列表、消息收发、状态更新等核心功能
 */
export function ConsultPage() {
  // ---------- 状态定义 ----------
  const [sessions, setSessions] = useState<Session[]>([]);        // 所有会话列表
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null); // 当前会话ID
  const [isCollapsed, setIsCollapsed] = useState(false);          // 侧边栏是否折叠
  const [isWaitingForAI, setIsWaitingForAI] = useState(false);    // 是否等待AI响应
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false); // 是否正在生成图表
  const [inputText, setInputText] = useState('');                 // 输入框文本

  // ---------- Refs ----------
  const chatScrollRef = useRef<HTMLDivElement>(null);             // 聊天区域滚动容器
  const inputRef = useRef<HTMLTextAreaElement>(null);             // 输入框引用
  const loadedHistorySessionIdsRef = useRef<Set<string>>(new Set()); // 已加载历史的会话ID集合
  const loadingHistorySessionIdsRef = useRef<Set<string>>(new Set()); // 正在加载历史的会话ID集合
  const quickSelectLockRef = useRef(false);                       // 快捷选择锁，防止重复点击

  // ---------- Hooks ----------
  const navigate = useNavigate(); // 路由导航

  // ---------- 计算属性 ----------
  const currentSession = sessions.find((s) => s.id === currentSessionId) || sessions[0]; // 当前会话对象
  const stepOptions = currentSession?.quickOptions.length          // 当前步骤的快捷选项
    ? currentSession.quickOptions 
    : [];

  // ---------- 工具函数 ----------
  /**
   * 滚动聊天区域到底部
   */
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
      }
    }, 50);
  }, []);

  /**
   * 更新当前会话
   * @param updates - 要更新的字段
   */
  const updateCurrentSession = useCallback((updates: Partial<Session>) => {
    if (!currentSessionId) return;
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === currentSessionId) {
          const updated = { ...s, ...updates };
          // 自动更新标题：如果标题是"默认对话"且有用户消息，取前28字符作为标题
          if (updates.messages && s.title === '默认对话') {
            const firstUserMsg = updates.messages.find((m: Message) => m.role === 'user');
            if (firstUserMsg) {
              updated.title = firstUserMsg.content.substring(0, 28) || '技术咨询';
            }
          }
          return updated;
        }
        return s;
      })
    );
  }, [currentSessionId]);

  /**
   * 添加消息到当前会话
   * @param role - 消息角色（user/assistant）
   * @param content - 消息内容
   * @param isHtml - 是否为HTML格式
   */
  const addMessage = useCallback((role: 'user' | 'assistant', content: string, isHtml = false) => {
    if (!currentSessionId) return;
    const newMessage: Message = { role, content, isHtml, timestamp: Date.now() };
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === currentSessionId) {
          return { ...s, messages: [...s.messages, newMessage] };
        }
        return s;
      })
    );
    scrollToBottom();
  }, [currentSessionId, scrollToBottom]);

  /**
   * 添加 AI 响应消息
   * 根据回复类型决定如何渲染消息
   */
  const addAIReply = useCallback((reply: Awaited<ReturnType<typeof fetchAIReply>>) => {
    // 方案对比格式
    if (reply.planComparison) {
      addMessage('assistant', reply.rawContent);
      updateCurrentSession({ quickOptions: [] });
      return;
    }

    // 问答格式（question + options）
    if (reply.question) {
      const aiContent = `<p>${reply.question}</p>`;
      addMessage('assistant', aiContent, true);
      updateCurrentSession({ quickOptions: reply.options });
      return;
    }

    // 未知格式：显示备用文本
    if (reply.extraText) {
      addMessage('assistant', `<p>${reply.extraText}</p>`, true);
    }
  }, [addMessage, updateCurrentSession]);

  /**
   * 核心：发送消息并处理 AI 响应
   */
  const sendAndProcess = useCallback(async (userInput: string) => {
    if (!currentSession?.agentId || !currentSession?.sessionId) {
      addMessage('assistant', '<p>连接失败，请重试</p>', true);
      return { success: false };
    }

    const reply = await fetchAIReply(userInput, currentSession.agentId, currentSession.sessionId);
    addAIReply(reply);
    
    return { success: true, reply };
  }, [currentSession, addMessage, addAIReply]);

  /**
   * 发送消息主逻辑
   * 处理用户输入并触发AI响应
   */
  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isWaitingForAI || !currentSession) return;

    setIsWaitingForAI(true);
    addMessage('user', text);
    updateCurrentSession({ quickOptions: [] });

    await sendAndProcess(text);

    setIsWaitingForAI(false);
    inputRef.current?.focus();
  }, [currentSession, isWaitingForAI, addMessage, updateCurrentSession, sendAndProcess]);

  /**
   * 打开知识图谱
   * 根据会话数据跳转到图表页面
   */
  const openGraphFromConsultData = useCallback((payload: OpenGraphPayload) => {
    if (!currentSession?.agentId || !currentSession?.sessionId) return;

    // 将当前会话信息存入全局store
    useSessionStore.getState().setCurrentSession(
      currentSession.sessionId,
      currentSession.agentId,
      payload.optionId
        ? { optionId: payload.optionId }
        : undefined
    );

    // 保存图表所需数据到localStorage
    const sessionData = {
      agentId: currentSession.agentId,
      sessionId: currentSession.sessionId,
      optionId: payload.optionId,
    };

    localStorage.setItem(STORAGE_KEYS.CONSULT_CHART, JSON.stringify(sessionData));
    sessionStorage.setItem(STORAGE_KEYS.GENERATING_PLAN, 'true');
    navigate('/graph');
  }, [currentSession, navigate]);

  /**
   * 选择方案选项
   * 用户从方案对比中选择一个方案，生成对应的图表
   */
  const handlePlanOptionSelect = useCallback((optionId: string, optionIndex: number) => {
    if (isWaitingForAI || !currentSession?.agentId || !currentSession?.sessionId) return;

    setIsGeneratingPlan(true);
    setXml({
      agentId: '100003',
      sessionId: currentSession.sessionId,
      message: String(optionIndex),
    }).then(() => {
      openGraphFromConsultData({ optionId });
    }).catch(() => {
      setIsGeneratingPlan(false);
    });
  }, [
    currentSession,
    isWaitingForAI,
    openGraphFromConsultData,
  ]);

  /**
   * 快捷选项处理
   * 处理所有快捷按钮的点击事件
   */
  const handleQuickSelect = useCallback(async (option: string) => {
    if (isWaitingForAI || !currentSession || quickSelectLockRef.current) return;

    // 初始快捷选项需要拼接"我想学"前缀，AI返回的选项不拼接
    const isInitialOption = INITIAL_QUICK_OPTIONS.includes(option);
    const messageToSend = isInitialOption ? `我想学${option}` : option;
    quickSelectLockRef.current = true;
    try {
      await handleSendMessage(messageToSend);
    } finally {
      quickSelectLockRef.current = false;
    }
  }, [isWaitingForAI, currentSession, handleSendMessage]);

  /**
   * 判断消息是否已被用户回答
   * 用于禁用已回答的交互式消息的选项
   */
  const isAnsweredInteractiveMessage = useCallback((messageIndex: number) => {
    if (!currentSession) return false;

    const message = currentSession.messages[messageIndex];
    if (!message || message.role !== 'assistant') return false;

    const { response } = parseAIContent(message.content);
    const parsed = parseJSONResponse(response);

    // 只有问答格式才需要判断
    if (!parsed || parsed.type !== 'question' || !parsed.options?.length) return false;

    // 检查该消息之后是否有用户消息
    return currentSession.messages
      .slice(messageIndex + 1)
      .some((nextMessage) => nextMessage.role === 'user');
  }, [currentSession]);

  /**
   * 发送输入框中的消息
   */
  const handleSend = useCallback(async () => {
    await handleSendMessage(inputText);
    setInputText('');
  }, [inputText, handleSendMessage]);

  /**
   * 加载会话历史记录
   * 从服务器获取指定会话的历史消息
   */
  const loadSessionHistory = useCallback(async (sessionId: string) => {
    if (!sessionId) return;
    if (loadedHistorySessionIdsRef.current.has(sessionId)) return;  // 已加载
    if (loadingHistorySessionIdsRef.current.has(sessionId)) return; // 加载中

    loadingHistorySessionIdsRef.current.add(sessionId);
    try {
      const res = await getChatHistory({ sessionId, agentId: TRANSCRIPT_AGENT_ID });
      
      if (Array.isArray(res.data) && res.data.length > 0) {
        // 有历史消息：转换为Message格式
        const historyMessages: Message[] = res.data.map((item) => ({
          role: item.role === 'user' ? 'user' : 'assistant',
          content: item.content,
          isHtml: false,
          timestamp: Date.now(),
        }));
        setSessions((prev) =>
          prev.map((s) => s.sessionId === sessionId ? {
            ...s,
            messages: historyMessages,
          } : s)
        );
      } else {
        // 没有历史消息：添加欢迎消息和初始快捷选项
        setSessions((prev) =>
          prev.map((s) => s.sessionId === sessionId && s.messages.length === 0 ? {
            ...s,
            messages: [{
              role: 'assistant' as const,
              content: getWelcomeMessageHtml(),
              isHtml: true,
              timestamp: Date.now(),
            }],
            quickOptions: INITIAL_QUICK_OPTIONS,
          } : s)
        );
      }
      loadedHistorySessionIdsRef.current.add(sessionId);
    } catch (err) {
      console.error('加载历史记录失败:', err);
    } finally {
      loadingHistorySessionIdsRef.current.delete(sessionId);
    }
  }, []);

  /**
   * 切换会话
   */
  const handleSwitchSession = useCallback((id: string) => {
    if (isWaitingForAI) return;
    if (id === currentSessionId) return;
    setCurrentSessionId(id);
    scrollToBottom();
  }, [currentSessionId, isWaitingForAI, scrollToBottom]);

  /**
   * 删除会话
   */
  const handleDeleteSession = useCallback(async (id: string) => {
    if (sessions.length <= 1) return; // 至少保留一个会话
    const sessionToDelete = sessions.find((s) => s.id === id);
    if (sessionToDelete?.agentId && sessionToDelete?.sessionId) {
      try {
        await deleteChatSession(sessionToDelete.sessionId, sessionToDelete.agentId);
      } catch (err) {
        console.error('Delete session failed:', err);
      }
    }
    const remaining = sessions.filter((s) => s.id !== id);
    setSessions(remaining);
    if (currentSessionId === id) {
      setCurrentSessionId(remaining[0]?.id || null);
    }
  }, [sessions, currentSessionId]);

  /**
   * 新建会话
   * 在服务器创建新会话并更新本地状态
   */
  const handleNewSession = useCallback(async () => {
    if (isWaitingForAI) return;

    try {
      const sessionRes = await createChatSession(AGENT_ID);
      const newSessionId = (sessionRes.data as unknown as { sessionId: string })?.sessionId;
      if (!newSessionId) return;

      // 重新获取会话列表确保同步
      const res = await getChatList(AGENT_ID);
      const sessionMap = res.data as unknown as Record<string, string> | undefined;

      if (sessionMap && Object.keys(sessionMap).length > 0) {
        const serverSessions = Object.keys(sessionMap).map((sid) => ({
          ...getDefaultSession(),
          id: sid,
          title: sessionMap[sid] || '默认对话',
          agentId: AGENT_ID,
          sessionId: sid,
        }));
        setSessions(serverSessions);
        // 找到刚创建的会话并设为当前
        const newSession = serverSessions.find(s => s.sessionId === newSessionId);
        if (newSession) {
          setCurrentSessionId(newSession.id);
        } else {
          setCurrentSessionId(serverSessions[serverSessions.length - 1]?.id || null);
        }
      }
    } catch (error) {
      console.error('Create session error:', error);
    }
  }, [isWaitingForAI]);

  // ---------- 副作用 ----------
  /**
   * 初始化：加载会话列表（仅执行一次）
   */
  const hasInitRef = useRef(false);
  useEffect(() => {
    if (hasInitRef.current) return;
    hasInitRef.current = true;

    const loadServerSessions = async () => {
      try {
        const res = await getChatList(AGENT_ID);
        const sessionMap = res.data as unknown as Record<string, string> | undefined;
        
        if (!sessionMap || Object.keys(sessionMap).length === 0) {
          // 没有会话：创建默认会话
          const newSess = [getDefaultSession()];
          setSessions(newSess);
          setCurrentSessionId(newSess[0].id);
          // 在服务端创建真实会话
          try {
            const sessionRes = await createChatSession(AGENT_ID);
            const newSessionId = (sessionRes.data as unknown as { sessionId: string })?.sessionId;
            if (newSessionId) {
              setSessions(prev =>
                prev.map(s => s.id === newSess[0].id ? { ...s, agentId: AGENT_ID, sessionId: newSessionId } : s)
              );
            }
          } catch (err) {
            console.error('Create session failed:', err);
          }
          return;
        }
        
        // 有会话：转换为本地会话对象
        const serverSessions = Object.keys(sessionMap).map((sid) => ({
          ...getDefaultSession(),
          id: sid,
          title: sessionMap[sid] || '默认对话',
          agentId: AGENT_ID,
          sessionId: sid,
        }));
        setSessions(serverSessions);
        const latestSession = serverSessions[serverSessions.length - 1];
        setCurrentSessionId(latestSession.id);
      } catch (err) {
        console.error('Load server sessions failed:', err);
        // 降级：创建本地默认会话
        const newSess = [getDefaultSession()];
        setSessions(newSess);
        setCurrentSessionId(newSess[0].id);
      }
    };
    loadServerSessions();
  }, []);

  /**
   * 加载会话历史（仅当有 sessionId 且无消息时执行）
   */
  useEffect(() => {
    const sessionId = currentSession?.sessionId;
    if (!sessionId) return;
    if (currentSession.messages.length > 0) return;

    loadSessionHistory(sessionId);
  }, [currentSession?.sessionId, currentSession?.messages.length, loadSessionHistory]);

  /**
   * 输入框高度自适应
   * 根据内容自动调整高度
   */
  const handleInputHeight = () => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  /**
   * 构建侧边栏项列表
   */
  const sidebarItems: ResourceSidebarItem[] = sessions.map((session) => ({
    id: session.id,
    title: session.title,
    iconClass: 'fas fa-comments',
  }));

  // ---------- 渲染 ----------
  return (
    <div className="consult-page">
      {/* 页面头部导航 */}
      <Header />
      
      {/* 图表生成中的加载遮罩 */}
      {isGeneratingPlan && (
        <div className="consult-loading-overlay">
          <Spin size="large" tip="图表生成中..." />
        </div>
      )}
      
      <div className="consult-container">
        {/* 侧边栏：显示会话列表 */}
        <ResourceSidebar
          header={{
            title: 'PathMind',
            iconClass: 'fas fa-code-branch',
            href: '/',
          }}
          primaryAction={{
            label: '新建会话',
            iconClass: 'fas fa-plus',
            title: '新建会话',
            disabled: isWaitingForAI,
            onClick: handleNewSession,
          }}
          sectionTitle="历史会话"
          items={sidebarItems}
          activeItemId={currentSessionId || ''}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed((collapsed) => !collapsed)}
          onSelectItem={handleSwitchSession}
          onDeleteItem={handleDeleteSession}
          emptyText="暂无历史会话"
          deleteTitle="删除会话"
        />
        
        {/* 主聊天区域 */}
        <main className="consult-main">
          {/* 消息显示区域 */}
          <section className="chat-area" ref={chatScrollRef}>
            <div className="chat-messages">
              {/* 渲染所有消息 */}
              {currentSession?.messages.map((msg, i) => (
                <MessageItem
                  key={i}
                  message={msg}
                  onOptionSelect={handleQuickSelect}
                  onPlanOptionSelect={handlePlanOptionSelect}
                  optionsDisabled={isWaitingForAI || isAnsweredInteractiveMessage(i)}
                />
              ))}
              {/* AI正在输入时的加载动画 */}
              {isWaitingForAI && (
                <div className="message-item">
                  <div className="message-header">
                    <span className="message-label">PathMind AI</span>
                  </div>
                  <div className="message-bubble message-bubble--assistant">
                    <TypingDots />
                  </div>
                </div>
              )}
            </div>
          </section>
          
          {/* 输入区域 */}
          <div className="consult-input-area">
            <div className="consult-input-container">
              {/* 快捷选项 */}
              <QuickOptions
                options={stepOptions}
                onSelect={handleQuickSelect}
                disabled={isWaitingForAI}
              />
              
              {/* 输入框和发送按钮 */}
              <div className="consult-input-wrapper">
                <button className="consult-attach-btn" title="添加附件">
                  <i className="fas fa-paperclip"></i>
                </button>
                <textarea
                  ref={inputRef}
                  className="consult-chat-input"
                  placeholder="输入你的目标或问题..."
                  value={inputText}
                  onChange={(e) => {
                    setInputText(e.target.value);
                    handleInputHeight();
                  }}
                  onKeyDown={(e) => {
                    // Enter发送，Shift+Enter换行
                    if (e.key === 'Enter' && !e.shiftKey && !isWaitingForAI) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  rows={1}
                  disabled={isWaitingForAI}
                />
                <button
                  className={`consult-send-btn ${!inputText.trim() ? 'consult-send-btn--disabled' : ''}`}
                  onClick={handleSend}
                  disabled={isWaitingForAI || !inputText.trim()}
                  title="发送消息"
                >
                  <i className="fas fa-paper-plane"></i>
                </button>
              </div>
              
              {/* 键盘快捷键提示 */}
              <div className="consult-input-hint">
                <kbd>Enter</kbd> 发送 · <kbd>Shift + Enter</kbd> 换行
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}