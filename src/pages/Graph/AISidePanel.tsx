/**
 * AI 对话面板组件
 */
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatStore } from '../../stores/chatStore';
import { createTask } from '../../api/tasks';
import './AISidePanel.scss';

interface AISidePanelProps {
  /** 是否有初始图表（进入页面时已有） */
  hasInitialGraph?: boolean;
  /** 发送消息回调（由父组件处理 API 调用） */
  onSendMessage?: (message: string) => void;
  /** 加载状态 */
  isLoading?: boolean;
}

export function AISidePanel({ hasInitialGraph, onSendMessage, isLoading }: AISidePanelProps) {
  const navigate = useNavigate();
  const { messages, addMessage, sessionId, satisfactionState, setSatisfactionState } = useChatStore();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasInitializedRef = useRef(false);

  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 初始化：进入页面时如果已有图表，自动发送满意度询问
  useEffect(() => {
    if (hasInitialGraph && messages.length === 0 && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      addMessage({
        role: 'assistant',
        content: '左侧图表您是否满意？如果不满意请提出修改意见',
      });
      setSatisfactionState('waiting');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasInitialGraph]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    addMessage({ role: 'user', content: userMessage });

    // 如果是满意度询问阶段，用户输入视为修改意见，AI 自动回复
    if (satisfactionState === 'waiting') {
      setTimeout(() => {
        addMessage({
          role: 'assistant',
          content: '已按照您的需求修改，请查看，如果不满意请提出修改意见',
        });
      }, 100);
    }

    // 通知父组件发送消息
    onSendMessage?.(userMessage);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSatisfied = async () => {
    setSatisfactionState('satisfied');

    // 从 localStorage 获取计划数据并创建日程表
    const planDataStr = localStorage.getItem('pathmind_plan_data');
    if (planDataStr) {
      try {
        const planData = JSON.parse(planDataStr);
        // 转换为 CreateScheduleRequest 格式
        const scheduleItems = planData.map((item: any) => ({
          title: item.title || '',
          time: item.time || '',
          content: item.content || '',
          tasks: item.details ? item.details.split(/[；]/).map((task: string, idx: number) => ({
            day: `第${idx + 1}天`,
            task: task.trim(),
            taskGoal: '',
            status: 0,
          })) : [],
        }));

        await createTask({ data: scheduleItems });

        // 清空 localStorage
        localStorage.removeItem('pathmind_plan_data');
        localStorage.removeItem('pathmind_consult_chart');
      } catch (err) {
        console.error('创建日程表失败:', err);
      }
    }

    // 跳转到 Tasks 页面
    navigate('/tasks');
  };

  return (
    <div className="ai-side-panel">
      <div className="panel-header">
        <h3>
          <i className="fas fa-comment-dots"></i> AI 助手
        </h3>
        <p className="panel-hint">描述你想要的技术图表，AI 会自动分析并生成</p>
      </div>

      <div className="messages-container">
        {messages.length === 0 && (
          <div className="empty-state">
            <i className="fas fa-lightbulb"></i>
            <p>例如："帮我画一个前端学习路线图"</p>
            <p>AI 会分析你的需求，自动选择合适的图表类型</p>
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
              {/* 满意度按钮 - 仅在最后一条 AI 消息且状态为 waiting 时显示 */}
              {msg.role === 'assistant' &&
                msg === messages[messages.length - 1] &&
                satisfactionState === 'waiting' && (
                  <div className="satisfaction-buttons">
                    <button
                      className="btn-satisfy"
                      onClick={handleSatisfied}
                    >
                      满意
                    </button>
                  </div>
                )}
              {/* 计划表跳转按钮 - 仅在满意后显示 */}
              {msg.role === 'assistant' &&
                msg === messages[messages.length - 1] &&
                satisfactionState === 'satisfied' && (
                  <div className="plan-link">
                    <a href={`/tasks?sessionId=${sessionId}`} className="btn-to-plan">
                      <i className="fas fa-tasks"></i> 查看计划表
                    </a>
                  </div>
                )}
              <div className="message-time">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
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
        />
        <button
          className="send-btn"
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
        >
          <i className="fas fa-paper-plane"></i>
        </button>
      </div>
    </div>
  );
}
