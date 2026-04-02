/**
 * AI 对话面板组件
 */
import { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { useGraphStore } from '../../stores/graphStore';
import { aiApi } from '../../api/useApi';
import { graphToDrawioXml } from '../../utils/graphToXml';
import './AISidePanel.scss';

interface AISidePanelProps {
  /** 图表更新回调 */
  onGraphUpdate?: (xml: string) => void;
}

export function AISidePanel({ onGraphUpdate }: AISidePanelProps) {
  const { messages, addMessage, setLoading, sessionId } = useChatStore();
  const { setLoading: setGraphLoading } = useGraphStore();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    // 如果没有 sessionId，先创建
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      // 使用随机 sessionId（Mock 模式）
      currentSessionId = crypto.randomUUID();
      useChatStore.getState().setSessionId(currentSessionId);
    }

    const userMessage = input.trim();
    setInput('');
    addMessage({ role: 'user', content: userMessage });
    setLoading(true);
    setGraphLoading(true);

    try {
      const res = await aiApi.chatWithAI({
        agentId: '100001',
        sessionId: currentSessionId,
        message: userMessage,
      });

      const response = res.data;
      if (!response) {
        throw new Error('AI 响应数据异常');
      }

      const aiContent = response.message || '';
      const graphData = response.graphData;

      // 添加 AI 消息
      addMessage({
        role: 'assistant',
        content: aiContent,
        hasGraph: Boolean(graphData),
      });

      // 如果 AI 返回了图表数据，更新图表
      if (graphData) {
        const xml = graphToDrawioXml(graphData);
        onGraphUpdate?.(xml);
      }
    } catch (err) {
      addMessage({
        role: 'assistant',
        content: '抱歉，发生了错误：' + (err as Error).message,
      });
    } finally {
      setLoading(false);
      setGraphLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
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
              <div className="message-time">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-area">
        <textarea
          className="message-input"
          placeholder="描述你想要的技术图表..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
        />
        <button
          className="send-btn"
          onClick={handleSend}
          disabled={!input.trim()}
        >
          <i className="fas fa-paper-plane"></i>
        </button>
      </div>
    </div>
  );
}
