/* ============================================
   ConsultPage - AI Copilot对话页面
   使用真实 API 接口
   流程: /api/agent/list -> /api/agent/createSession -> /api/agent/consultation
============================================ */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResourceSidebar, type ResourceSidebarItem } from '../../components/common';
import { Header } from '../../components/layout/Header';
import { conversationApi, deleteChatSession, getChatSessions } from '../../api/useApi';
import { getChatHistory } from '../../api/conversation';
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

// 发送消息到 consultation API 并解析响应
async function fetchAIReply(message: string, agentId: string, sessionId: string) {
  try {
    const res = await conversationApi.consultation({ agentId, sessionId, message });
    const content = res.data?.content ?? res.data?.message ?? '';
    
    const thinkMatch = content.match(/<think>[\s\S]*?<\/think>([\s\S]*)$/);
    if (!thinkMatch) {
      return { thinking: '', question: '', options: [] as string[], goal: '', base: '', rawContent: content };
    }

    const thinking = thinkMatch[0].replace(/<\/think>$/, '').replace(/<think>/, '').trim();
    let jsonStr = thinkMatch[1].trim();
    jsonStr = jsonStr.replace(/^```json\s*/i, '').replace(/\s*```$/, '');

    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.goal !== undefined && parsed.base !== undefined) {
        return { thinking, question: '', options: [], goal: parsed.goal || '', base: parsed.base || '', rawContent: content };
      }
      if (parsed.question !== undefined || (parsed.options && Array.isArray(parsed.options))) {
        return { thinking, question: parsed.question || '', options: parsed.options || [], goal: '', base: '', rawContent: content };
      }
      const extraText = parsed.message || parsed.text || parsed.content || JSON.stringify(parsed);
      return { thinking, question: '', options: [], goal: '', base: '', extraText, rawContent: content };
    } catch {
      const extraText = jsonStr.trim() || content.trim();
      return { thinking: '', question: '', options: [], goal: '', base: '', extraText, rawContent: content };
    }
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
  optionsDisabled?: boolean;
}

// 解析 JSON 格式的 AI 回复
function parseJSONResponse(content: string): {
  type: 'question' | 'result' | 'unknown';
  question?: string;
  options?: string[];
  goal?: string;
  base?: string;
} {
  // 提取 JSON 内容（可能被 markdown 代码块包裹）
  let jsonStr = content.trim();

  // 去除 markdown 代码块标记
  jsonStr = jsonStr.replace(/^```json\s*/i, '').replace(/\s*```$/, '');

  // 尝试找到 JSON 对象
  const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return { type: 'unknown' };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);

    // 检测是否为最终方案格式（goal/base）
    if (parsed.goal !== undefined && parsed.base !== undefined) {
      return { type: 'result', goal: parsed.goal, base: parsed.base };
    }

    // 问答格式（question/options）
    if (parsed.question !== undefined) {
      return {
        type: 'question',
        question: parsed.question,
        options: parsed.options || []
      };
    }

    return { type: 'unknown' };
  } catch {
    return { type: 'unknown' };
  }
}

// 格式化选项文本（去除 A. B. 等前缀）
function formatOptionText(option: string): string {
  // 如果选项已经包含前缀，提取纯文本
  const match = option.match(/^[A-D][.、]\s*(.+)$/);
  return match ? match[1] : option;
}

function MessageItem({ message, onOptionSelect, optionsDisabled = false }: MessageItemProps) {
  const [showThinking, setShowThinking] = useState(false);
  const isAssistant = message.role === 'assistant';
  const { thinking, response } = parseAIContent(message.content);

  // 解析 JSON 响应
  const jsonParsed = parseJSONResponse(response);
  const isQuestionFormat = jsonParsed.type === 'question';
  const isResultFormat = jsonParsed.type === 'result';

  return (
    <div className={`message-item ${isAssistant ? '' : 'message-item--user'}`}>
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
          {/* isResultFormat 时忽略 isHtml，直接用 JSX 渲染按钮 */}
          {isResultFormat ? (
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
  const hasLoadedHistoryRef = useRef<string | null>(null);
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

  // 添加消息
  const addMessage = useCallback((role: 'user' | 'assistant', content: string, isHtml = false) => {
    if (!currentSession) return;
    const newMessage: Message = { role, content, isHtml, timestamp: Date.now() };
    updateCurrentSession({ messages: [...currentSession.messages, newMessage] });
    scrollToBottom();
  }, [currentSession, updateCurrentSession, scrollToBottom]);

  // 添加 AI 响应消息
  const addAIReply = useCallback((reply: Awaited<ReturnType<typeof fetchAIReply>>, userProfile?: Session['userProfile']) => {
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

  // 查看知识图表
  const handleViewGraph = useCallback(() => {
    if (!currentSession?.consultationGoal || !currentSession?.consultationBase) return;
    const sessionData = {
      agentId: currentSession.agentId || '',
      sessionId: currentSession.sessionId || '',
      consultationMsg: {
        goal: currentSession.consultationGoal,
        base: currentSession.consultationBase,
      },
    };
    localStorage.setItem('pathmind_consult_chart', JSON.stringify(sessionData));
    navigate('/graph');
  }, [currentSession, navigate]);

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

  // 判断问题选项是否已经回答
  const isAnsweredQuestionMessage = useCallback((messageIndex: number) => {
    if (!currentSession) return false;

    const message = currentSession.messages[messageIndex];
    if (!message || message.role !== 'assistant') return false;

    const { response } = parseAIContent(message.content);
    const parsed = parseJSONResponse(response);
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
    try {
      const res = await getChatHistory({ sessionId });
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
    } catch (err) {
      console.error('加载历史记录失败:', err);
    }
  }, []);

  // 切换会话
  const handleSwitchSession = useCallback(async (id: string) => {
    if (isWaitingForAI) return;
    setCurrentSessionId(id);
    // 等待状态更新后加载历史
    setTimeout(() => {
      setSessions(prev => {
        const session = prev.find((s) => s.id === id);
        if (session?.sessionId) {
          loadSessionHistory(session.sessionId);
        }
        return prev;
      });
    }, 0);
    scrollToBottom();
  }, [isWaitingForAI, loadSessionHistory, scrollToBottom]);

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
    if (!currentSession?.sessionId) return;
    if (currentSession.messages.length > 0) return;
    if (hasLoadedHistoryRef.current === currentSession.sessionId) return;

    hasLoadedHistoryRef.current = currentSession.sessionId;
    loadSessionHistory(currentSession.sessionId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSession?.sessionId, currentSessionId]);

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
                  optionsDisabled={isWaitingForAI || isResultStep || isAnsweredQuestionMessage(i)}
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
