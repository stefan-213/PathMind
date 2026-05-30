import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Header } from '../../../components/layout';
import { scheduleChat } from '../../../api/tasks';
import type { Schedule, SubSchedule } from '../../../types/api';
import './TaskDetailPage.scss';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
};

type PlanRecord = Record<string, unknown>;

const PLAN_DATA_STORAGE_KEY = 'pathmind_plan_data';

const QUICK_OPTIONS = [
  '帮我拆解这个任务的学习步骤',
  '推荐完成这个任务需要看的资料',
  '给我设计一个练习题',
  '如何判断这个任务已经完成',
];

const isRecord = (value: unknown): value is PlanRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toText = (value: unknown, fallback = '') => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return fallback;
};

const toNumber = (value: unknown, fallback: number) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const splitDetails = (value: unknown) => {
  if (typeof value !== 'string') return [];
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/(第\d+(?:-\d+)?[天周])\s*\n\s*(?!第\d+(?:-\d+)?[天周])([^\n]+)/g, '$1-$2')
    .replace(/[，,；;]\s*(?=第\d+(?:-\d+)?[天周](?:\s*[-—－:：])?)/g, '\n')
    .split(/[；;\n]+/)
    .map(item => item.trim())
    .filter(Boolean);
};

const parseTaskText = (value: string, taskIndex: number) => {
  const text = value.trim();
  const match = text.match(/^(第\d+(?:-\d+)?[天周])\s*[-—－:：]\s*(.+)$/);

  if (match) {
    return {
      day: match[1],
      task: match[2].trim(),
    };
  }

  return {
    day: `第${taskIndex + 1}天`,
    task: text,
  };
};

const expandTaskInputs = (inputs: unknown[]) =>
  inputs.flatMap(input => {
    if (typeof input === 'string') return splitDetails(input);

    if (isRecord(input)) {
      const taskText = toText(input.task ?? input.title ?? input.name);
      const splitItems = splitDetails(taskText);
      if (splitItems.length > 1) {
        return splitItems.map(task => ({
          ...input,
          id: undefined,
          day: undefined,
          task,
          status: 0,
          completedAt: null,
        }));
      }
    }

    return [input];
  });

const normalizeTask = (
  taskInput: unknown,
  taskIndex: number,
  parentId: number,
  fallbackGoal: string,
): SubSchedule | null => {
  const fallbackId = parentId * 1000 + taskIndex + 1;

  if (typeof taskInput === 'string') {
    const { day, task } = parseTaskText(taskInput, taskIndex);
    return {
      id: fallbackId,
      parentId,
      day,
      task,
      taskGoal: fallbackGoal,
      status: 0,
      description: null,
      completedAt: null,
    };
  }

  if (!isRecord(taskInput)) return null;
  const task = toText(taskInput.task ?? taskInput.title ?? taskInput.name).trim();
  if (!task) return null;
  const parsedTask = parseTaskText(task, taskIndex);

  return {
    id: toNumber(taskInput.id, fallbackId),
    parentId: toNumber(taskInput.parentId, parentId),
    day: toText(taskInput.day, parsedTask.day),
    task: parsedTask.task,
    taskGoal: toText(taskInput.taskGoal ?? taskInput.goal ?? taskInput.week, fallbackGoal),
    description: toText(taskInput.description) || null,
    status: taskInput.status === 1 || taskInput.status === '1' || taskInput.status === true ? 1 : 0,
    completedAt: toText(taskInput.completedAt) || null,
  };
};

const readLocalSchedules = (): Schedule[] => {
  const planDataStr = localStorage.getItem(PLAN_DATA_STORAGE_KEY);
  if (!planDataStr) return [];

  try {
    const planData = JSON.parse(planDataStr);
    if (!Array.isArray(planData)) return [];

    return planData
      .map((item, scheduleIndex) => {
        if (!isRecord(item)) return null;

        const id = toNumber(item.id, scheduleIndex + 1);
        const title = toText(item.title, `学习计划 ${scheduleIndex + 1}`);
        const rawTasks = Array.isArray(item.subScheduleList)
          ? expandTaskInputs(item.subScheduleList)
          : Array.isArray(item.tasks)
            ? expandTaskInputs(item.tasks)
            : Array.isArray(item.details)
              ? expandTaskInputs(item.details)
              : splitDetails(item.details);

        const subScheduleList = rawTasks
          .map((taskInput, taskIndex) => normalizeTask(taskInput, taskIndex, id, title))
          .filter((task): task is SubSchedule => Boolean(task));

        return {
          id,
          scheduleId: toText(item.scheduleId, `local-schedule-${scheduleIndex + 1}`),
          userId: toText(item.userId, 'local'),
          title,
          time: toText(item.time),
          content: toText(item.content),
          status: item.status === 1 || item.status === '1' ? 1 : 0,
          subScheduleList,
        };
      })
      .filter((schedule): schedule is Schedule => Boolean(schedule));
  } catch (error) {
    console.error('读取任务详情本地数据失败:', error);
    return [];
  }
};

/** 本地降级回复 */
const generateLocalReply = (taskTitle: string, message: string) => {
  const lower = message.toLowerCase();

  if (message.includes('拆解') || message.includes('步骤') || lower.includes('step')) {
    return `可以把 **${taskTitle}** 拆成 4 步：

1. 先明确这个任务要解决的问题和最终产出。
2. 找一个最小示例，跑通关键概念。
3. 记录 3 个容易混淆的点，并用自己的话解释。
4. 做一个小练习或复盘，把结论沉淀成笔记。`;
  }

  if (message.includes('资料') || message.includes('推荐') || lower.includes('resource')) {
    return `建议按这个顺序准备 **${taskTitle}** 的资料：

- 官方文档或权威教程：用来确认概念边界。
- 一篇完整实战文章：用来理解真实流程。
- 一个可运行 demo：用来把知识变成手感。

看资料时重点记三件事：核心概念、常见坑、可以复用的代码或流程。`;
  }

  if (message.includes('练习') || message.includes('题')) {
    return `这里有一个适合 **${taskTitle}** 的练习：

**练习目标**：用 30 分钟做一个最小可验证版本。

**要求**：

1. 写出你对任务目标的 3 句话理解。
2. 找到一个最小示例并运行或推演。
3. 总结"输入、处理、输出"分别是什么。
4. 写下一个还没搞懂的问题，下一轮重点解决。`;
  }

  if (message.includes('完成') || message.includes('判断') || lower.includes('done')) {
    return `判断 **${taskTitle}** 是否完成，可以看这 3 个标准：

- 你能不用复制原文，解释它的核心概念。
- 你能完成一个小例子，或说清楚执行步骤。
- 你知道这个任务最容易出错的地方，并能给出规避方法。`;
  }

  return `我会围绕 **${taskTitle}** 帮你拆解。你可以问我学习步骤、资料推荐、练习设计、完成标准，或者直接说你卡在哪个概念上。`;
};

function TypingDots() {
  return (
    <div className="typing-dots">
      <span></span>
      <span></span>
      <span></span>
    </div>
  );
}

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
    const consultData = localStorage.getItem('pathmind_consult_chart');
    if (consultData) {
      try {
        const parsed = JSON.parse(consultData);
        return parsed.sessionId || null;
      } catch {
        // ignore
      }
    }
    return null;
  }, [sessionIdParam]);

  const schedules = useMemo(() => readLocalSchedules(), []);
  const currentSchedule = useMemo(() => {
    return schedules.find(schedule => schedule.scheduleId === scheduleIdParam) || schedules[0] || null;
  }, [scheduleIdParam, schedules]);

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
            {(currentSchedule?.subScheduleList || []).map((task, index) => (
              <button
                key={task.id ?? `${task.task}-${index}`}
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
