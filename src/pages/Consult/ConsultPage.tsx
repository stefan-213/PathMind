/* ============================================
   ConsultPage - AI Copilot对话页面
   使用真实 API 接口
   流程: /api/agent/list -> /api/agent/createSession -> /api/agent/consultation
============================================ */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, ResourceSidebar, type ResourceSidebarItem } from '../../components/common';
import { Header } from '../../components/layout/Header';
import { conversationApi, deleteChatSession, getChatSessions } from '../../api/useApi';
import { getChatHistory } from '../../api/conversation';
import type { PlanComparisonResponse, PlanOption } from '../../types/api';
import { useSessionStore } from '../../stores/sessionStore';
import './ConsultPage.scss';

// ---------- 类型定义 ----------
interface Message {
  role: 'user' | 'assistant';
  content: string;
  isHtml?: boolean;
  timestamp: number;
}

interface Session {
  id: string;
  title: string;
  createdAt: string;
  messages: Message[];
  userProfile: {
    goal: string;
    experience: string;
    timeframe: string;
    scale: string;
  };
  currentStep: string;
  finalXml: string;
  planDetails: { week: string; items: string[] }[];
  agentId?: string;
  sessionId?: string;
  quickOptions: string[];
  consultationGoal?: string;
  consultationBase?: string;
}

// ---------- 常量 ----------
const AGENT_ID = '100003';
const TRANSCRIPT_AGENT_ID = '100003';

// ---------- 工具函数 ----------
function generateId(): string {
  return Date.now() + '-' + Math.random().toString(36).substr(2, 8);
}

// 初始快捷选项
const INITIAL_QUICK_OPTIONS = [
  'AI智能问答应用',
  '企业级Web系统',
  '移动端App',
  '数据分析平台',
];

interface OpenGraphPayload {
  optionId?: string;
  goal?: string;
  base?: string;
}

function getDefaultSession(): Session {
  return {
    id: generateId(),
    title: '默认对话',
    createdAt: new Date().toISOString(),
    messages: [],
    userProfile: { goal: '', experience: '', timeframe: '', scale: '' },
    currentStep: 'ASK_GOAL',
    finalXml: '',
    planDetails: [],
    quickOptions: [],
  };
}

// 解析 AI 回复中的思考过程和实际内容
function parseAIContent(content: string): { thinking: string; response: string } {
  const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>/);
  const thinking = thinkMatch ? thinkMatch[1].trim() : '';
  const response = content
    .replace(/<think>[\s\S]*?<\/think>/, '')
    .replace(/\\n/g, '\n')
    .trim();
  return { thinking, response };
}

type ParsedJSONResponse =
  | { type: 'plan-options'; planComparison: PlanComparisonResponse }
  | { type: 'question'; question: string; options: string[] }
  | { type: 'result'; goal: string; base: string }
  | { type: 'unknown' };

interface AIReply {
  thinking: string;
  question: string;
  options: string[];
  goal: string;
  base: string;
  rawContent: string;
  planComparison?: PlanComparisonResponse;
  extraText?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function getStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

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

function normalizePlanComparison(value: unknown): PlanComparisonResponse | null {
  if (!isRecord(value)) return null;
  if (!Array.isArray(value.options)) return null;

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

function extractJsonText(content: string): string | null {
  const jsonStr = content.trim().replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
  return jsonMatch ? jsonMatch[0] : null;
}

// 解析 JSON 格式的 AI 回复
function parseJSONResponse(content: string): ParsedJSONResponse {
  const jsonText = extractJsonText(content);
  if (!jsonText) return { type: 'unknown' };

  try {
    const parsed: unknown = JSON.parse(jsonText);
    const planComparison = normalizePlanComparison(parsed);

    if (planComparison) {
      return { type: 'plan-options', planComparison };
    }

    if (!isRecord(parsed)) return { type: 'unknown' };

    // 保留旧最终方案格式（goal/base），作为后端链路未完善时的兜底。
    if (parsed.goal !== undefined && parsed.base !== undefined) {
      return {
        type: 'result',
        goal: getString(parsed.goal),
        base: getString(parsed.base),
      };
    }

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

// 发送消息到 consultation API 并解析响应
async function fetchAIReply(message: string, agentId: string, sessionId: string): Promise<AIReply> {
  try {
    const res = await conversationApi.consultation({ agentId, sessionId, message });
    const content = res.data?.content ?? res.data?.message ?? '';

    if (!content) {
      return { thinking: '', question: '', options: [] as string[], goal: '', base: '', rawContent: content };
    }

    const { thinking, response } = parseAIContent(content);
    const parsed = parseJSONResponse(response);

    if (parsed.type === 'plan-options') {
      return {
        thinking,
        question: '',
        options: [],
        goal: '',
        base: '',
        planComparison: parsed.planComparison,
        rawContent: content,
      };
    }

    if (parsed.type === 'result') {
      return {
        thinking,
        question: '',
        options: [],
        goal: parsed.goal,
        base: parsed.base,
        rawContent: content,
      };
    }

    if (parsed.type === 'question') {
      return {
        thinking,
        question: parsed.question,
        options: parsed.options,
        goal: '',
        base: '',
        rawContent: content,
      };
    }

    const extraText = extractFallbackTextFromJson(response) || response.trim() || content.trim();
    return { thinking, question: '', options: [], goal: '', base: '', extraText, rawContent: content };
  } catch (error) {
    console.error('Consultation API error:', error);
    return { thinking: '', question: '', options: [], goal: '', base: '', extraText: '', rawContent: '' };
  }
}

// 生成结果消息的 HTML（使用纯 HTML + data 属性，事件由父层委托处理）
function getResultMessageHtml(): string {
  return `<div class="result-container">
              <p class="result-text">
                <i class="fas fa-check-circle"></i> 已为你生成计划图表
              </p>
              <div class="result-buttons">
                <button class="btn btn-primary btn-view-graph" data-action="view-graph">
                  点击查看
                </button>
                <button class="btn btn-secondary btn-regenerate" data-action="regenerate">
                  重新生成
                </button>
              </div>
            </div>`;
}

// 生成欢迎消息
function getWelcomeMessageHtml(): string {
  return `<p>👋 <strong>我是 PathMind AI 技术顾问</strong></p>
<p>请描述你的开发或学习目标，我会为你生成专属技术路线图与详细计划。</p>
<p>例如：「AI智能问答应用」、「企业级数据分析平台」、「移动端App」</p>
<div class="quick-start-hint">
  <i class="fas fa-bolt"></i> 你也可以直接点击下方的快捷选项开始
</div>`;
}

// 构建用户背景字符串
// function buildBaseString(profile: Session['userProfile']): string {
//   const parts = [];
//   if (profile.experience) parts.push(`已通过英语四级，分数500分以上`);
//   if (profile.timeframe) parts.push(`有${profile.timeframe}备考时间`);
//   parts.push('备考目的为获取证书用于求职或升学');
//   return parts.filter(Boolean).join('，');
// }

// ---------- 子组件：打字动画 ----------
function buildBaseString(profile: Session['userProfile']): string {
  return [
    profile.experience && `Experience: ${profile.experience}`,
    profile.timeframe && `Timeframe: ${profile.timeframe}`,
    profile.scale && `Scale: ${profile.scale}`,
  ].filter(Boolean).join('; ');
}

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
interface MessageItemProps {
  message: Message;
  onOptionSelect?: (option: string) => void;
  onPlanOptionSelect?: (optionId: string) => void;
  optionsDisabled?: boolean;
}

// 格式化选项文本（去除 A. B. 等前缀）
function formatOptionText(option: string): string {
  // 如果选项已经包含前缀，提取纯文本
  const match = option.match(/^[A-F][.、]\s*(.+)$/);
  return match ? match[1] : option;
}

interface PlanComparisonMessageProps {
  data: PlanComparisonResponse;
  disabled: boolean;
  onSelectOption?: (optionId: string) => void;
}

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

function PlanComparisonMessage({ data, disabled, onSelectOption }: PlanComparisonMessageProps) {
  const recommendedOption = data.options.find(
    (option) => option.id === data.recommended.option_id
  );
  const comparisonRows = [
    { label: '核心思路', render: (option: PlanOption) => option.core_idea },
    { label: '适合人群', render: (option: PlanOption) => option.suitable_for },
    // { label: '学习路径', render: (option: PlanOption) => <PlanComparisonList items={option.path} /> },
    { label: '优点', render: (option: PlanOption) => <PlanComparisonList items={option.pros} /> },
    { label: '风险/不足', render: (option: PlanOption) => <PlanComparisonList items={option.cons} /> },
    { label: '成本', render: (option: PlanOption) => option.cost },
    { label: '难度', render: (option: PlanOption) => option.difficulty },
  ];

  return (
    <div className="plan-comparison">
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

      <div className="plan-option-actions">
        {data.options.map((option) => {
          const isRecommended = option.id === data.recommended.option_id;

          return (
            <Button
              key={option.id}
              variant={isRecommended ? 'primary' : 'secondary'}
              disabled={disabled || !onSelectOption}
              onClick={() => onSelectOption?.(option.id)}
            >
              生成：{option.name}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

function MessageItem({
  message,
  onOptionSelect,
  onPlanOptionSelect,
  optionsDisabled = false,
}: MessageItemProps) {
  const [showThinking, setShowThinking] = useState(false);
  const isAssistant = message.role === 'assistant';
  const { thinking, response } = parseAIContent(message.content);

  // 解析 JSON 响应
  const jsonParsed = parseJSONResponse(response);
  const isPlanOptionsFormat = jsonParsed.type === 'plan-options';
  const isQuestionFormat = jsonParsed.type === 'question';
  const isResultFormat = jsonParsed.type === 'result';

  return (
    <div className={`message-item ${isAssistant ? '' : 'message-item--user'}${isPlanOptionsFormat ? ' message-item--plan-options' : ''}`}>
      {isAssistant && (
        <div className="message-header">
          <span className="message-label">PathMind AI</span>
          <span className="message-time">刚刚</span>
        </div>
      )}
      <div className={`message-bubble ${isAssistant ? 'message-bubble--assistant' : 'message-bubble--user'}`}>
        {/* 思考过程 - 可折叠 */}
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

        {/* 渲染内容 */}
        <div className="message-content">
          {isPlanOptionsFormat ? (
            <PlanComparisonMessage
              data={jsonParsed.planComparison}
              disabled={optionsDisabled}
              onSelectOption={onPlanOptionSelect}
            />
          ) : isResultFormat ? (
            // 最终方案：显示图表按钮
            <div className="result-container">
              <p className="result-text">
                <i className="fas fa-check-circle"></i> 已为你生成计划图表
              </p>
              <div className="result-buttons">
                <button className="btn btn-primary btn-view-graph" onClick={(e) => {
                  e.stopPropagation();
                  onOptionSelect?.('__VIEW_GRAPH__');
                }}>
                  点击查看
                </button>
                <button className="btn btn-secondary btn-regenerate" onClick={(e) => {
                  e.stopPropagation();
                  onOptionSelect?.('__REGENERATE__');
                }}>
                  重新生成
                </button>
              </div>
            </div>
          ) : message.isHtml ? (
            <div dangerouslySetInnerHTML={{ __html: message.content }} />
          ) : isQuestionFormat ? (
            // 问答格式：美化显示问题和选项
            <div className="question-container">
              <p className="question-text">{jsonParsed.question}</p>
              {jsonParsed.options && jsonParsed.options.length > 0 && (
                <div className="question-options-list">
                  {jsonParsed.options.map((opt, idx) => {
                    const prefix = String.fromCharCode(65 + idx);
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
            // 普通文本格式
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
}

// ---------- 子组件：快捷选项 ----------
interface QuickOptionsProps {
  options: string[];
  onSelect: (option: string) => void;
  disabled: boolean;
}

function QuickOptions({ options, onSelect, disabled }: QuickOptionsProps) {
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
}

// ---------- 主页面组件 ----------
export function ConsultPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isWaitingForAI, setIsWaitingForAI] = useState(false);
  const [inputText, setInputText] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();
  const loadedHistorySessionIdsRef = useRef<Set<string>>(new Set());
  const loadingHistorySessionIdsRef = useRef<Set<string>>(new Set());
  const quickSelectLockRef = useRef(false);

  // 当前会话
  const currentSession = sessions.find((s) => s.id === currentSessionId) || sessions[0];
  const isResultStep = currentSession?.currentStep === 'RESULT';
  const stepOptions = currentSession?.quickOptions.length 
    ? currentSession.quickOptions 
    : [];

  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
      }
    }, 50);
  }, []);

  // 更新当前会话
  const updateCurrentSession = useCallback((updates: Partial<Session>) => {
    if (!currentSessionId) return;
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === currentSessionId) {
          const updated = { ...s, ...updates };
          // 自动更新标题
          if (updates.messages && s.title === '默认对话') {
            const firstUserMsg = updates.messages.find((m: Message) => m.role === 'user');
            if (firstUserMsg) {
              updated.title = firstUserMsg.content.substring(0, 28) || '技术咨询';
            }
          }
          // 持久化 consult 数据到 sessionStorage
          if (updated.consultationGoal || updated.consultationBase) {
            const sessionData = {
              goal: updated.consultationGoal,
              base: updated.consultationBase,
            };
            sessionStorage.setItem(`pathmind_consult_data_${s.sessionId}`, JSON.stringify(sessionData));
          }
          return updated;
        }
        return s;
      })
    );
  }, [currentSessionId]);

  // 添加消息（使用函数式更新避免闭包中的旧状态问题）
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

  // 添加 AI 响应消息
  const addAIReply = useCallback((reply: Awaited<ReturnType<typeof fetchAIReply>>, userProfile?: Session['userProfile']) => {
    if (reply.planComparison) {
      addMessage('assistant', reply.rawContent);
      updateCurrentSession({ quickOptions: [] });
      return;
    }

    // 处理最终方案
    if (reply.goal && reply.base) {
      const baseStr = reply.base || (userProfile ? buildBaseString(userProfile) : '');
      addMessage('assistant', getResultMessageHtml(), true);
      updateCurrentSession({
        currentStep: 'RESULT',
        consultationGoal: reply.goal,
        consultationBase: baseStr,
        quickOptions: [],
      });
      return;
    }

    // 处理问答
    if (reply.question) {
      const aiContent = `<p>${reply.question}</p>`;
      addMessage('assistant', aiContent, true);
      updateCurrentSession({ quickOptions: reply.options });
      return;
    }

    // 处理未知格式
    if (reply.extraText) {
      addMessage('assistant', `<p>${reply.extraText}</p>`, true);
    }
  }, [addMessage, updateCurrentSession]);

  // 核心：发送消息并处理 AI 响应
  const sendAndProcess = useCallback(async (userInput: string, userProfile: Session['userProfile']) => {
    if (!currentSession?.agentId || !currentSession?.sessionId) {
      addMessage('assistant', '<p>连接失败，请重试</p>', true);
      return { success: false };
    }

    const reply = await fetchAIReply(userInput, currentSession.agentId, currentSession.sessionId);
    addAIReply(reply, userProfile);
    
    return { success: true, reply };
  }, [currentSession, addMessage, addAIReply]);

  // 处理用户输入（更新步骤和用户画像）
  const updateStepAndProfile = useCallback((input: string, step: string, profile: Session['userProfile']) => {
    const newProfile = { ...profile };
    let nextStep = step;

    switch (step) {
      case 'ASK_GOAL':
        newProfile.goal = input;
        nextStep = 'ASK_EXPERIENCE';
        break;
      case 'ASK_EXPERIENCE':
        newProfile.experience = input.includes('初学') ? 'beginner' : input.includes('高级') ? 'advanced' : 'intermediate';
        nextStep = 'ASK_TIMEFRAME';
        break;
      case 'ASK_TIMEFRAME':
        newProfile.timeframe = input;
        nextStep = 'ASK_SCALE';
        break;
      default:
        break;
    }

    updateCurrentSession({ userProfile: newProfile, currentStep: nextStep });
    return { newProfile, nextStep };
  }, [updateCurrentSession]);

  // 发送消息主逻辑
  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isWaitingForAI || !currentSession) return;

    setIsWaitingForAI(true);
    addMessage('user', text);
    updateCurrentSession({ quickOptions: [] });

    const { currentStep, userProfile } = currentSession;
    
    // ASK_SCALE 步骤特殊处理
    if (currentStep === 'ASK_SCALE') {
      let scale = '个人项目';
      if (text.includes('团队')) scale = '团队协作';
      else if (text.includes('生产') || text.includes('高并发')) scale = '生产级';
      
      const newProfile = { ...userProfile, scale };
      updateCurrentSession({ userProfile: newProfile });
      
      await sendAndProcess(text, newProfile);
    } else {
      // 更新步骤和画像后发送
      const { newProfile } = updateStepAndProfile(text, currentStep, userProfile);
      await sendAndProcess(text, newProfile);
    }

    setIsWaitingForAI(false);
    inputRef.current?.focus();
  }, [currentSession, isWaitingForAI, addMessage, updateCurrentSession, sendAndProcess, updateStepAndProfile]);

  const openGraphFromConsultData = useCallback((payload: OpenGraphPayload) => {
    if (!currentSession?.agentId || !currentSession?.sessionId) return;

    // 写入 sessionStore，Graph/Tasks 直接读取
    useSessionStore.getState().setCurrentSession(
      currentSession.sessionId,
      currentSession.agentId,
      payload.optionId
        ? { optionId: payload.optionId }
        : payload.goal && payload.base
          ? { goal: payload.goal, base: payload.base }
          : undefined
    );

    const sessionData = {
      agentId: currentSession.agentId,
      sessionId: currentSession.sessionId,
      optionId: payload.optionId,
      consultationMsg: payload.goal && payload.base
        ? {
            goal: payload.goal,
            base: payload.base,
          }
        : undefined,
    };

    localStorage.setItem('pathmind_consult_chart', JSON.stringify(sessionData));
    navigate('/graph');
  }, [currentSession, navigate]);

  // 查看知识图表
  const handleViewGraph = useCallback(() => {
    if (!currentSession?.consultationGoal || !currentSession?.consultationBase) return;

    openGraphFromConsultData({
      goal: currentSession.consultationGoal,
      base: currentSession.consultationBase,
    });
  }, [currentSession, openGraphFromConsultData]);

  const handlePlanOptionSelect = useCallback((optionId: string) => {
    if (isWaitingForAI || !currentSession?.agentId || !currentSession?.sessionId) return;

    updateCurrentSession({
      currentStep: 'RESULT',
      quickOptions: [],
    });
    openGraphFromConsultData({
      optionId,
      goal: currentSession.consultationGoal,
      base: currentSession.consultationBase,
    });
  }, [
    currentSession,
    isWaitingForAI,
    openGraphFromConsultData,
    updateCurrentSession,
  ]);

  // 重新生成方案
  const handleRegenerate = useCallback(async () => {
    if (!currentSession || isWaitingForAI) return;

    // 找到上一条用户消息（用户选择的 scale）
    const userMessages = currentSession.messages.filter(m => m.role === 'user');

    const lastUserMessage = "重新计划："+userMessages[0].content;

    if (lastUserMessage && currentSession.agentId && currentSession.sessionId) {
      setIsWaitingForAI(true);

      // 重新调用 AI
      const reply = await fetchAIReply(
        lastUserMessage,
        currentSession.agentId,
        currentSession.sessionId
      );

      if (reply.goal && reply.base) {
        const baseStr = reply.base || '';
        addMessage('assistant', getResultMessageHtml(), true);
        updateCurrentSession({
          consultationGoal: reply.goal,
          consultationBase: baseStr,
        });
      }

      setIsWaitingForAI(false);
    }
  }, [currentSession, isWaitingForAI, addMessage, updateCurrentSession]);

  // 快捷选项处理
  const handleQuickSelect = useCallback(async (option: string) => {
    if (isWaitingForAI || !currentSession || quickSelectLockRef.current) return;

    // 处理图表查看
    if (option === '__VIEW_GRAPH__') {
      handleViewGraph();
      return;
    }

    // 处理重新生成
    if (option === '__REGENERATE__') {
      handleRegenerate();
      return;
    }

    // 跳过结果步骤的选项选择
    if (isResultStep) return;

    // 初始快捷选项拼接"我想学"前缀，AI返回的选项不拼接
    const isInitialOption = INITIAL_QUICK_OPTIONS.includes(option);
    const messageToSend = isInitialOption ? `我想学${option}` : option;
    quickSelectLockRef.current = true;
    try {
      await handleSendMessage(messageToSend);
    } finally {
      quickSelectLockRef.current = false;
    }
  }, [isWaitingForAI, isResultStep, currentSession, handleSendMessage, handleViewGraph, handleRegenerate]);

  // 判断消息内交互是否已经回答
  const isAnsweredInteractiveMessage = useCallback((messageIndex: number) => {
    if (!currentSession) return false;

    const message = currentSession.messages[messageIndex];
    if (!message || message.role !== 'assistant') return false;

    const { response } = parseAIContent(message.content);
    const parsed = parseJSONResponse(response);

    if (parsed.type === 'plan-options') return false;
    if (parsed.type !== 'question' || !parsed.options?.length) return false;

    return currentSession.messages
      .slice(messageIndex + 1)
      .some((nextMessage) => nextMessage.role === 'user');
  }, [currentSession]);

  // 发送输入框消息
  const handleSend = useCallback(async () => {
    await handleSendMessage(inputText);
    setInputText('');
  }, [inputText, handleSendMessage]);

  // 加载会话历史
  const loadSessionHistory = useCallback(async (sessionId: string) => {
    if (!sessionId) return;
    if (loadedHistorySessionIdsRef.current.has(sessionId)) return;
    if (loadingHistorySessionIdsRef.current.has(sessionId)) return;

    loadingHistorySessionIdsRef.current.add(sessionId);
    try {
      const res = await getChatHistory({ sessionId, agentId: TRANSCRIPT_AGENT_ID });
      // 恢复 consult 数据
      const savedConsult = sessionStorage.getItem(`pathmind_consult_data_${sessionId}`);
      const consultData = savedConsult ? JSON.parse(savedConsult) : {};
      if (Array.isArray(res.data) && res.data.length > 0) {
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
            consultationGoal: consultData.goal || s.consultationGoal,
            consultationBase: consultData.base || s.consultationBase,
          } : s)
        );
      } else {
        // 历史记录为空，添加欢迎消息和初始快捷选项
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

  // 切换会话
  const handleSwitchSession = useCallback((id: string) => {
    if (isWaitingForAI) return;
    if (id === currentSessionId) return;
    setCurrentSessionId(id);
    scrollToBottom();
  }, [currentSessionId, isWaitingForAI, scrollToBottom]);

  // 删除会话
  const handleDeleteSession = useCallback(async (id: string) => {
    if (sessions.length <= 1) return;
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

  // 新建会话
  const handleNewSession = useCallback(async () => {
    if (isWaitingForAI) return;

    try {
      const sessionRes = await conversationApi.createChatSession(AGENT_ID);
      // axios 拦截器转换后 sessionRes.data 是原始响应的 data 字段
      const newSessionId = (sessionRes.data as unknown as { sessionId: string })?.sessionId;
      if (!newSessionId) return;

      // 重新获取会话列表确保同步
      const res = await getChatSessions(AGENT_ID);
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

  // 初始化：加载会话列表（仅执行一次）
  const hasInitRef = useRef(false);
  useEffect(() => {
    if (hasInitRef.current) return;
    hasInitRef.current = true;

    const loadServerSessions = async () => {
      try {
        const res = await getChatSessions(AGENT_ID);
        const sessionMap = res.data as unknown as Record<string, string> | undefined;
        if (!sessionMap || Object.keys(sessionMap).length === 0) {
          const newSess = [getDefaultSession()];
          setSessions(newSess);
          setCurrentSessionId(newSess[0].id);
          // 无会话时，在服务端创建真实会话
          try {
            const sessionRes = await conversationApi.createChatSession(AGENT_ID);
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
        const newSess = [getDefaultSession()];
        setSessions(newSess);
        setCurrentSessionId(newSess[0].id);
      }
    };
    loadServerSessions();
  }, []);

  // 加载会话历史（仅执行一次，且仅当有 sessionId 且无消息时）
  useEffect(() => {
    const sessionId = currentSession?.sessionId;
    if (!sessionId) return;
    if (currentSession.messages.length > 0) return;

    loadSessionHistory(sessionId);
  }, [currentSession?.sessionId, currentSession?.messages.length, loadSessionHistory]);

  // 输入框高度自适应
  const handleInputHeight = () => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  // 聊天区域点击事件（委托）
  const handleChatClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    // 使用 data-action 属性委托处理
    const action = target.dataset.action;
    if (action === 'view-graph') {
      handleViewGraph();
    } else if (action === 'regenerate') {
      handleRegenerate();
    }
  };

  const sidebarItems: ResourceSidebarItem[] = sessions.map((session) => ({
    id: session.id,
    title: session.title,
    iconClass: 'fas fa-comments',
  }));

  return (
    <div className="consult-page">
      <Header />
      <div className="consult-container">
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
        <main className="consult-main">
          <section className="chat-area" ref={chatScrollRef} onClick={handleChatClick}>
            <div className="chat-messages">
              {currentSession?.messages.map((msg, i) => (
                <MessageItem
                  key={i}
                  message={msg}
                  onOptionSelect={handleQuickSelect}
                  onPlanOptionSelect={handlePlanOptionSelect}
                  optionsDisabled={isWaitingForAI || isResultStep || isAnsweredInteractiveMessage(i)}
                />
              ))}
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
          <div className="consult-input-area">
            <div className="consult-input-container">
              <QuickOptions
                options={stepOptions}
                onSelect={handleQuickSelect}
                disabled={isWaitingForAI || isResultStep}
              />
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
