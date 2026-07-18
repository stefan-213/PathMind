import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Header } from '../../../components/layout';
import { scheduleChat, getScheduleList, convertDTOToSchedule } from '../../../api/tasks';
import { pathmindStorage } from '../../../utils/storage';
import type { Schedule, SubSchedule } from '../../../types/api';
import type { Message } from './utils';
import { QUICK_OPTIONS, readLocalSchedules, generateLocalReply } from './utils';
import { TypingDots } from './components/TypingDots';
import './TaskDetailPage.scss';

export function TaskDetailPage() {
  const [searchParams] = useSearchParams();
  const taskParam = searchParams.get('task') || '';
  const taskIdParam = searchParams.get('taskId');
  const scheduleIdParam = searchParams.get('schedule');
  const sessionIdParam = searchParams.get('sessionId');
  const messagesInnerRef = useRef<HTMLDivElement>(null);

  // 从 URL 参数或 localStorage 获取 sessionId
  const sessionId = useMemo(() => {
    if (sessionIdParam) return sessionIdParam;
    // 尝试从 Copilot 会话中获取
    const consultData = pathmindStorage.consult.load();
    if (consultData) {
      return consultData.sessionId || null;
    }
    return null;
  }, [sessionIdParam]);

  const schedules = useMemo(() => readLocalSchedules(), []);

  // 当有 sessionId 时，尝试从后端获取数据覆盖 localStorage 的数据
  const [backendSchedules, setBackendSchedules] = useState<Schedule[]>([]);
  useEffect(() => {
    if (!sessionId) return;
    let isMounted = true;
    const fetchBackend = async () => {
      try {
        const response = await getScheduleList(sessionId);
        const dtoList = response.data || [];
        if (dtoList.length > 0 && isMounted) {
          setBackendSchedules(dtoList.map(convertDTOToSchedule));
        }
      } catch {
        // 降级到 localStorage 数据
      }
    };
    void fetchBackend();
    return () => { isMounted = false; };
  }, [sessionId]);

  // 合并后端数据和本地数据，优先后端
  const mergedSchedules = backendSchedules.length > 0 ? backendSchedules : schedules;
  const currentSchedule = useMemo(() => {
    return mergedSchedules.find(schedule => schedule.scheduleId === scheduleIdParam) || mergedSchedules[0] || null;
  }, [scheduleIdParam, mergedSchedules]);

  const currentTask = useMemo(() => {
    const taskId = taskIdParam ? Number(taskIdParam) : NaN;
    return (
      currentSchedule?.subScheduleList.find(task => task.id === taskId) ||
      currentSchedule?.subScheduleList.find(task => task.task === taskParam) ||
      currentSchedule?.subScheduleList[0] ||
      null
    );
  }, [currentSchedule, taskIdParam, taskParam]);

  const taskTitle = currentTask?.task || taskParam || '学习任务';
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      role: 'assistant',
      content: `已经进入 **${taskTitle}** 的任务详情。你可以把这里当成这个任务的临时学习助手，我会帮你拆步骤、补资料、出练习、定完成标准。`,
      timestamp: Date.now(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (messagesInnerRef.current) {
        messagesInnerRef.current.scrollTop = messagesInnerRef.current.scrollHeight;
      }
    }, 50);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  /**
   * 发送消息 - 优先调用后端 API，失败时降级到本地回复
   */
  const sendMessage = useCallback(async (message: string) => {
    const text = message.trim();
    if (!text || isTyping) return;

    setInputText('');
    setMessages(prev => [
      ...prev,
      { role: 'user', content: text, timestamp: Date.now() },
    ]);
    setIsTyping(true);

    try {
      // 优先调用后端 scheduleChat API
      if (sessionId && currentTask?.id) {
        const response = await scheduleChat(sessionId, text, String(currentTask.id));
        if (response.success && response.data?.content) {
          // 清理 think 标签
          const content = response.data.content
            .replace(/<think>[\s\S]*?<\/think>/g, '')
            .trim();
          setMessages(prev => [
            ...prev,
            { role: 'assistant', content, timestamp: Date.now() },
          ]);
          setIsTyping(false);
          return;
        }
      }
    } catch (error) {
      console.warn('调用后端 API 失败，使用本地回复:', error);
    }

    // 降级: 使用本地回复
    await new Promise(resolve => setTimeout(resolve, 500));
    setMessages(prev => [
      ...prev,
      {
        role: 'assistant',
        content: generateLocalReply(taskTitle, text),
        timestamp: Date.now(),
      },
    ]);
    setIsTyping(false);
  }, [isTyping, taskTitle, sessionId, currentTask]);

  const handleQuickOption = (option: string) => {
    void sendMessage(option);
  };

  return (
    <div className="task-detail-page">
      <Header />

      <div className="task-detail-layout">
        <aside className="task-detail-sidebar">
          <div className="task-detail-sidebar-header">
            <Link to="/tasks" className="task-detail-back">
              <i className="fas fa-arrow-left"></i>
              返回任务
            </Link>
            <span className="task-detail-badge">任务详情</span>
          </div>

          <div className="task-detail-plan-title">
            <div className="task-detail-label">当前计划</div>
            <h2>{currentSchedule?.title || '学习计划'}</h2>
            {currentSchedule?.time && <p>{currentSchedule.time}</p>}
          </div>

          <div className="task-detail-current">
            <div className="task-detail-label">当前任务</div>
            <h3>{taskTitle}</h3>
            {currentTask?.day && <span>{currentTask.day}</span>}
          </div>

          <div className="task-detail-timeline">
            {(currentSchedule?.subScheduleList || []).filter(
              (task: SubSchedule, index: number, arr: SubSchedule[]) => arr.findIndex((t: SubSchedule) => t.id === task.id) === index,
            ).map((task: SubSchedule, index: number) => (
              <button
                key={`${currentSchedule.scheduleId}-${task.id ?? index}`}
                type="button"
                className={`task-detail-timeline-item ${task.task === taskTitle ? 'active' : ''}`}
                onClick={() => setInputText(`帮我拆解「${task.task}」这个任务`)}
              >
                <span className="task-detail-dot"></span>
                <span>
                  <strong>{task.day || `第${index + 1}天`}</strong>
                  {task.task}
                </span>
              </button>
            ))}
          </div>
        </aside>

        <section className="task-detail-chat">
          <div className="task-detail-messages" ref={messagesInnerRef}>
            {messages.map((message, index) => (
              <div
                key={`${message.timestamp}-${index}`}
                className={`task-detail-message ${message.role}`}
              >
                <div className="task-detail-message-label">
                  {message.role === 'user' ? '你' : 'PathMind AI'}
                </div>
                <div className="task-detail-message-bubble">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="task-detail-message assistant">
                <div className="task-detail-message-label">PathMind AI</div>
                <div className="task-detail-message-bubble">
                  <TypingDots />
                </div>
              </div>
            )}
          </div>

          <div className="task-detail-quick-options">
            {QUICK_OPTIONS.map(option => (
              <button key={option} type="button" onClick={() => handleQuickOption(option)}>
                {option}
              </button>
            ))}
          </div>

          <div className="task-detail-input-area">
            <textarea
              value={inputText}
              onChange={(event) => setInputText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  void sendMessage(inputText);
                }
              }}
              placeholder="输入你对这个任务的疑问..."
              rows={1}
            />
            <button
              type="button"
              className="task-detail-send"
              onClick={() => void sendMessage(inputText)}
              disabled={!inputText.trim() || isTyping}
            >
              <i className="fas fa-paper-plane"></i>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}