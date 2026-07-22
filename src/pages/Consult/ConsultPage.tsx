/* ============================================
   ConsultPage - AI Copilot对话页面
   功能：与AI助手进行技术咨询对话，生成技术路线图
============================================ */

// ---------- React 核心库导入 ----------
import { useState, useEffect, useRef, useCallback } from 'react';
// useState: 管理组件状态
// useEffect: 处理副作用（初始化、加载数据等）
// useRef: 引用DOM元素或保存不触发渲染的值
// useCallback: 缓存函数，避免不必要的重新创建
// memo: 组件记忆化，避免不必要的重渲染

// ---------- 路由库导入 ----------
import { useNavigate } from 'react-router-dom';
// useNavigate: 编程式导航，用于页面跳转

// ---------- 组件导入 ----------
import { ResourceSidebar, Spin, type ResourceSidebarItem } from '../../components/common';
// Badge: 徽章组件，显示"推荐"标签
// Button: 按钮组件
// ResourceSidebar: 侧边栏组件，显示会话列表
// Spin: 加载动画组件
// ResourceSidebarItem: 侧边栏项的类型定义

// ---------- 布局组件导入 ----------
import { Header } from '../../components/layout/Header';
// Header: 页面顶部导航栏

// ---------- 子组件导入 ----------
import { TypingDots } from '../../components/common';
import { MessageItem, QuickOptions } from './components';

// ---------- API 函数导入 ----------
import { createChatSession, deleteChatSession, getChatList, getChatHistory } from '../../api/conversation';
import { setXml } from '../../api/graph';
// createChatSession: 创建新的聊天会话
// deleteChatSession: 删除聊天会话
// getChatList: 获取会话列表

// ---------- 类型定义导入 ----------
import type {
  Session,                 // 会话数据类型
  OpenGraphPayload,       // 打开图表时的参数类型
} from '../../types/copilot';

// ---------- 状态管理导入 ----------
import { useSessionStore } from '../../stores/sessionStore';
import { useChatStore, type ChatMessage } from '../../stores/chatStore';
// useSessionStore: 全局会话状态管理
// useChatStore: AI对话消息状态管理（按会话隔离）

// ---------- 常量导入 ----------
import { STORAGE_KEYS } from '../../constants';
// STORAGE_KEYS: 本地存储的key常量

// ---------- 样式导入 ----------
import './ConsultPage.scss';
// 页面样式文件

// ---------- 工具函数导入 ----------
import { getDefaultSession, INITIAL_QUICK_OPTIONS, AGENT_ID, TRANSCRIPT_AGENT_ID, parseAIContent, parseJSONResponse, fetchAIReply, getWelcomeMessageHtml } from './utils';

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

  // ---------- 订阅 chatStore（消息按会话隔离） ----------
  const chatStoreMessages = useChatStore((s) => s.messagesBySession);
  const chatStoreActiveId = useChatStore((s) => s.activeSessionId);
  const chatMessages = chatStoreActiveId ? (chatStoreMessages[chatStoreActiveId] ?? []) : [];

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
   * @param sessionId - 可选，指定会话ID（默认使用 currentSessionId）
   */
  const updateCurrentSession = useCallback((updates: Partial<Session>, sessionId?: string) => {
    const targetId = sessionId ?? currentSessionId;
    if (!targetId) return;
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === targetId) {
          return { ...s, ...updates };
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
    useChatStore.getState().addMessage({ role, content, isHtml });
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
    if (!chatMessages.length) return false;

    const message = chatMessages[messageIndex];
    if (!message || message.role !== 'assistant') return false;

    const { response } = parseAIContent(message.content);
    const parsed = parseJSONResponse(response);

    // 只有问答格式才需要判断
    if (!parsed || parsed.type !== 'question' || !parsed.options?.length) return false;

    // 检查该消息之后是否有用户消息
    return chatMessages
      .slice(messageIndex + 1)
      .some((nextMessage) => nextMessage.role === 'user');
  }, [chatMessages]);

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
        // 有历史消息：转换为ChatMessage格式并注入chatStore
        const chatMessages: ChatMessage[] = res.data.map((item, idx) => ({
          id: `history-${sessionId}-${idx}`,
          role: item.role === 'user' ? 'user' : 'assistant',
          content: item.content,
          timestamp: Date.now(),
        }));
        useChatStore.getState().setMessagesForSession(sessionId, chatMessages);
        updateCurrentSession({ quickOptions: [] });
      } else {
        // 没有历史消息：添加欢迎消息
        useChatStore.getState().addMessage({ role: 'assistant', content: getWelcomeMessageHtml(), isHtml: true });
        // 需要显示快捷选项
        updateCurrentSession({ quickOptions:INITIAL_QUICK_OPTIONS});
      }
      loadedHistorySessionIdsRef.current.add(sessionId);
    } catch (err) {
      console.error('加载历史记录失败:', err);
    } finally {
      loadingHistorySessionIdsRef.current.delete(sessionId);
    }
  }, [updateCurrentSession]);
  
  /**
   * 判断是否加载初始快捷选项
   */

  const initializeSessionQuickOptions = useCallback((sessionId: string) => {
    const messages = useChatStore.getState().messagesBySession[sessionId] || [];
    const hasUserMessage = messages.some(msg => msg.role === 'user');
    
    if (hasUserMessage) {
      // 有用户消息 → 有真实对话，清空快捷选项
      updateCurrentSession({ quickOptions: [] }, sessionId);
    } else if (messages.length === 0) {
      // 完全没有消息 → 新会话，设置初始快捷选项
      updateCurrentSession({ quickOptions: INITIAL_QUICK_OPTIONS }, sessionId);
    } else {
      // 只有欢迎消息 → 新会话，设置初始快捷选项
      updateCurrentSession({ quickOptions: INITIAL_QUICK_OPTIONS }, sessionId);
    }
  }, [updateCurrentSession]);
  /**
   * 切换会话
   */
  const handleSwitchSession = useCallback((id: string) => {
    if (isWaitingForAI) return;
    if (id === currentSessionId) return;
    setCurrentSessionId(id);
    useChatStore.getState().setActiveSessionId(id);
    initializeSessionQuickOptions(id)
    scrollToBottom();
  }, [currentSessionId, isWaitingForAI, updateCurrentSession, scrollToBottom]);

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
      const nextSession = remaining[0];
      const nextSessionId = nextSession?.id || null;
      setCurrentSessionId(nextSessionId);
      if (nextSession) {
        useChatStore.getState().setActiveSessionId(nextSession.id);
        updateCurrentSession({ quickOptions: [] }, nextSession.id);
      }
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
          useChatStore.getState().setActiveSessionId(newSession.id);
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
        useChatStore.getState().setActiveSessionId(latestSession.id);
        initializeSessionQuickOptions(latestSession.id);
      } catch (err) {
        console.error('Load server sessions failed:', err);
        // 降级：创建本地默认会话
        const newSess = [getDefaultSession()];
        setSessions(newSess);
        setCurrentSessionId(newSess[0].id);
        useChatStore.getState().setActiveSessionId(newSess[0].id);
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
    if (chatMessages.length > 0) return;

    loadSessionHistory(sessionId);
  }, [currentSession?.sessionId, chatMessages.length, loadSessionHistory]);

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
              {chatMessages.map((msg, i) => (
                <MessageItem
                  key={msg.id}
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