/**
 * AI 对话面板组件
 */
import { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import './AISidePanel.scss';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  hasGraph?: boolean;
  timestamp: number;
}

interface AISidePanelProps {
  /** 消息列表（由父组件 GraphPage 管理） */
  messages: ChatMessage[];
  /** 添加消息回调（由父组件调用） */
  onAddMessage?: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  /** 发送消息回调（由父组件处理 API 调用） */
  onSendMessage?: (message: string) => void | Promise<void>;
  /** 加载状态 */
  isLoading?: boolean;
  /** 是否正在生成日程表 */
  isScheduleGenerating?: boolean;
  /** 是否收起 AI 面板 */
  isCollapsed?: boolean;
  /** 展开 / 收起 AI 面板 */
  onToggleCollapse?: () => void;
  /** 点击满意后的提交回调 */
  onSatisfied?: () => void | Promise<void>;
}

export function AISidePanel({
  messages,
  onAddMessage,
  onSendMessage,
  isLoading,
  isScheduleGenerating = false,
  isCollapsed = false,
  onToggleCollapse,
  onSatisfied,
}: AISidePanelProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const panelClassName = [
    'ai-side-panel',
    isCollapsed ? 'ai-side-panel--collapsed' : '',
  ].filter(Boolean).join(' ');
  const toggleTitle = isCollapsed ? '展开 AI 助手' : '收起 AI 助手';

  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = () => {
    if (!input.trim() || isLoading || isScheduleGenerating) return;

    const userMessage = input.trim();
    setInput('');
    onAddMessage?.({ role: 'user', content: userMessage });
    void onSendMessage?.(userMessage);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSatisfied = () => {
    if (isScheduleGenerating) return;
    void onSatisfied?.();
  };

  return (
    <aside className={panelClassName} aria-label="AI 助手">
      <div className="panel-header">
        <div className="panel-title-area">
          <h3>
            <i className="fas fa-robot"></i> AI 助手
          </h3>
          <p className="panel-hint">描述你想要的图表，AI 会自动分析并修改</p>
        </div>
        {onToggleCollapse ? (
          <button
            type="button"
            className="panel-toggle-btn"
            onClick={onToggleCollapse}
            title={toggleTitle}
            aria-label={toggleTitle}
            aria-expanded={!isCollapsed}
          >
            <i className={`fas ${isCollapsed ? 'fa-angle-left' : 'fa-angle-right'}`}></i>
          </button>
        ) : null}
      </div>

      {isCollapsed ? (
        <div className="panel-collapsed-body" aria-hidden="true">
          <i className="fas fa-robot"></i>
        </div>
      ) : (
        <>
          <div className="messages-container">
            {messages.length === 0 && (
              <div className="empty-state">
                <i className="fas fa-lightbulb"></i>
                <p>在Copilot页面输入需求，让 AI 为你生成计划图表</p>
                <p>AI 会分析你的需求，自动调整图表</p>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`message ${msg.role}`}>
                <div className="message-avatar">
                  {msg.role === 'user' ? (
                    <i className="fas fa-user"></i>
                  ) : (
                    <i className="fas fa-robot"></i>
                  )}
                </div>
                <div className="message-content">
                  <div className="message-text">{msg.content}</div>
                  {msg.hasGraph && (
                    <div className="graph-indicator">
                      <i className="fas fa-chart-pie"></i> 已生成图表
                    </div>
                  )}
                  {/* 满意度按钮 - 仅在最后一条 AI 消息时显示 */}
                  {msg.role === 'assistant' &&
                    msg === messages[messages.length - 1] && (
                      <div className="satisfaction-buttons">
                        <button
                          className="btn-satisfy"
                          onClick={handleSatisfied}
                          disabled={isScheduleGenerating}
                        >
                          {isScheduleGenerating ? '生成中...' : '满意'}
                        </button>
                      </div>
                    )}
                  <div className="message-time">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            {isLoading ? (
              <div className="message assistant message--loading" role="status" aria-live="polite">
                <div className="message-avatar">
                  <i className="fas fa-robot"></i>
                </div>
                <div className="message-content">
                  <div className="message-text message-loading-text">
                    <i className="fas fa-spinner fa-spin" aria-hidden="true"></i>
                    <span>图表正在修改中...</span>
                  </div>
                </div>
              </div>
            ) : null}
            <div ref={messagesEndRef} />
          </div>

          <div className="input-area">
            <input
              type="text"
              className="message-input"
              placeholder="输入你的修改意见..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading || isScheduleGenerating}
            />
            <button
              className="send-btn"
              onClick={handleSend}
              disabled={!input.trim() || isLoading || isScheduleGenerating}
            >
              <i className="fas fa-paper-plane"></i>
            </button>
          </div>
        </>
      )}
    </aside>
  );
}
