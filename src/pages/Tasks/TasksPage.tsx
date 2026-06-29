import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header, Footer } from '../../components/layout';
import { Card, Badge, EmptyState, ResourceSidebar, Spin, type ResourceSidebarItem } from '../../components/common';
import { getChatSessions } from '../../api/useApi';
import { useScheduleStore } from '../../stores/scheduleStore';
import { useSessionStore } from '../../stores/sessionStore';
import { normalizeCopilotSessionMap, type CopilotSessionResource } from '../../utils';
import { AGENT_IDS, STORAGE_KEYS } from '../../constants';
import type { Schedule, SubSchedule } from '../../types/api';
import './TasksPage.scss';

type PlanDataRecord = Record<string, unknown>;

interface TaskTimeMeta {
  weekLabel?: string;
  dayLabel?: string;
}

interface StageTaskViewModel {
  id: number | string;
  scheduleId: string;
  taskId?: number;
  stageIndex: number;
  stageTitle: string;
  timeText: string;
  taskTitle: string;
  status: number;
  completedAt?: string | null;
}

interface StageViewModel {
  id: string;
  title: string;
  tasks: StageTaskViewModel[];
}

const TIME_PREFIX_PATTERN = /^(第\d+(?:-\d+)?周(?:\s*[，,、]?\s*第\d+(?:-\d+)?天)?|第\d+(?:-\d+)?天|Day\s*\d+(?:-\d+)?)\s*[-—－:：]\s*(.+)$/i;
const WEEK_PATTERN = /第\d+(?:-\d+)?周/;
const DAY_PATTERN = /第\d+(?:-\d+)?天/;

const isRecord = (value: unknown): value is PlanDataRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const getText = (value: unknown, fallback = '') => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return fallback;
};

const getNumber = (value: unknown, fallback: number) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const getStatus = (value: unknown) => {
  if (value === 1 || value === '1' || value === true || value === 'completed') return 1;
  return 0;
};

const getOptionalText = (value: unknown): string | null => {
  if (value === undefined || value === null) return null;
  const text = getText(value);
  return text || null;
};

const normalizeTimePrefix = (value: string) => {
  const compactValue = value.replace(/\s*[，,、]\s*/g, '，').trim();
  const dayMatch = compactValue.match(/^Day\s*(\d+(?:-\d+)?)$/i);
  return dayMatch ? `第${dayMatch[1]}天` : compactValue;
};

const getTimePartLabel = (value: unknown, unit: '周' | '天'): string | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `第${value}${unit}`;
  }

  if (typeof value !== 'string') return undefined;

  const text = value.trim();
  if (!text) return undefined;

  const pattern = unit === '周' ? WEEK_PATTERN : DAY_PATTERN;
  const match = text.match(pattern);
  if (match) return match[0];

  const numericMatch = text.match(/^\d+(?:-\d+)?$/);
  if (numericMatch) return `第${text}${unit}`;

  if (unit === '天') {
    const dayMatch = text.match(/Day\s*(\d+(?:-\d+)?)/i);
    if (dayMatch) return `第${dayMatch[1]}天`;
  }

  return undefined;
};

const formatTaskTimeText = ({ weekLabel, dayLabel }: TaskTimeMeta) => {
  if (weekLabel && dayLabel) return `${weekLabel}，${dayLabel}`;
  if (weekLabel) return weekLabel;
  if (dayLabel) return dayLabel;
  return '未标注时间';
};

const getUnknownField = (value: unknown, key: string) => (
  isRecord(value) ? value[key] : undefined
);

const getTaskTimeText = (task: SubSchedule) => {
  const weekLabel =
    getTimePartLabel(getUnknownField(task, 'week'), '周') ||
    getTimePartLabel(task.taskGoal, '周') ||
    getTimePartLabel(task.day, '周') ||
    getTimePartLabel(task.task, '周');
  const dayLabel =
    getTimePartLabel(task.day, '天') ||
    getTimePartLabel(task.task, '天');

  return formatTaskTimeText({ weekLabel, dayLabel });
};

const stripStagePrefix = (value: string) =>
  value.replace(/^阶段\s*\d+\s*[·.．、:：\-—－]?\s*/, '').trim();

const getStageTitle = (schedule: Schedule, stageIndex: number) => {
  const title = stripStagePrefix(schedule.title) || '未命名阶段';
  return `阶段${stageIndex + 1}·${title}`;
};

const createStageViewModel = (schedule: Schedule, stageIndex: number): StageViewModel => {
  const stageTitle = getStageTitle(schedule, stageIndex);

  return {
    id: `${schedule.scheduleId}-${stageIndex}`,
    title: stageTitle,
    tasks: schedule.subScheduleList.map((task, taskIndex) => ({
      id: task.id ?? `${schedule.scheduleId}-${taskIndex}`,
      scheduleId: schedule.scheduleId,
      taskId: task.id,
      stageIndex,
      stageTitle,
      timeText: getTaskTimeText(task),
      taskTitle: task.task || '未命名任务',
      status: task.status,
      completedAt: task.completedAt,
    })),
  };
};

const splitTasks = (value: unknown) => {
  if (typeof value !== 'string') return [];
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/(第\d+(?:-\d+)?[天周])\s*\n\s*(?!第\d+(?:-\d+)?[天周])([^\n]+)/g, '$1-$2')
    .replace(/(第\d+(?:-\d+)?周)\s*[，,、]\s*(第\d+(?:-\d+)?天)/g, '$1、$2')
    .replace(/[，,；;]\s*(?=第\d+(?:-\d+)?[天周](?:\s*[-—－:：])?)/g, '\n')
    .split(/[；;\n]+/)
    .map(task => task.trim())
    .filter(Boolean);
};

const parseTaskText = (value: string, taskIndex: number) => {
  const text = value.trim();
  const match = text.match(TIME_PREFIX_PATTERN);

  if (match) {
    return {
      day: normalizeTimePrefix(match[1]),
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
    if (typeof input === 'string') return splitTasks(input);

    if (isRecord(input)) {
      const taskText = getText(input.task ?? input.title ?? input.name);
      const splitItems = splitTasks(taskText);
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

const getTaskInputs = (record: PlanDataRecord) => {
  if (Array.isArray(record.subScheduleList)) return expandTaskInputs(record.subScheduleList);
  if (Array.isArray(record.tasks)) return expandTaskInputs(record.tasks);
  if (Array.isArray(record.details)) return expandTaskInputs(record.details);
  return splitTasks(record.details);
};

const normalizeSubSchedule = (
  taskInput: unknown,
  taskIndex: number,
  parentId: number,
  fallbackGoal: string,
): SubSchedule | null => {
  const fallbackId = parentId * 1000 + taskIndex + 1;

  if (typeof taskInput === 'string') {
    const { day, task } = parseTaskText(taskInput, taskIndex);
    if (!task) return null;
    return {
      id: fallbackId,
      parentId,
      day,
      task,
      taskGoal: fallbackGoal,
      description: null,
      status: 0,
      completedAt: null,
    };
  }

  if (!isRecord(taskInput)) return null;

  const task = getText(taskInput.task ?? taskInput.title ?? taskInput.name).trim();
  if (!task) return null;
  const parsedTask = parseTaskText(task, taskIndex);

  return {
    id: getNumber(taskInput.id, fallbackId),
    parentId: getNumber(taskInput.parentId, parentId),
    day: getText(taskInput.day, parsedTask.day),
    task: parsedTask.task,
    taskGoal: getText(taskInput.taskGoal ?? taskInput.goal ?? taskInput.week, fallbackGoal),
    description: getOptionalText(taskInput.description),
    status: getStatus(taskInput.status),
    completedAt: getOptionalText(taskInput.completedAt),
  };
};

const normalizePlanData = (planData: unknown): Schedule[] => {
  if (!Array.isArray(planData)) return [];

  return planData
    .map((item, scheduleIndex) => {
      if (!isRecord(item)) return null;

      const id = getNumber(item.id, scheduleIndex + 1);
      const title = getText(item.title, `学习计划 ${scheduleIndex + 1}`);
      const taskInputs = getTaskInputs(item);
      const subScheduleList = taskInputs
        .map((taskInput, taskIndex) => normalizeSubSchedule(taskInput, taskIndex, id, title))
        .filter((task): task is SubSchedule => Boolean(task));

      return {
        id,
        scheduleId: getText(item.scheduleId, `local-schedule-${scheduleIndex + 1}`),
        userId: getText(item.userId, 'local'),
        title,
        time: getText(item.time),
        content: getText(item.content),
        status: getStatus(item.status),
        subScheduleList,
      };
    })
    .filter((schedule): schedule is Schedule => Boolean(schedule));
};

export function TasksPage() {
  const navigate = useNavigate();
  const {
    schedules,
    fetchSchedules,
    setSchedules,
    setCurrentSchedule,
    clearSchedules,
    toggleTask: storeToggleTask,
  } = useScheduleStore();
  const [isTaskLoading, setIsTaskLoading] = useState(false);
  const [collapsedStageIds, setCollapsedStageIds] = useState<Set<string>>(() => new Set());
  const [planTitle, setPlanTitle] = useState(() =>
    localStorage.getItem(STORAGE_KEYS.PLAN_TITLE)?.trim() || ''
  );
  const [sessions, setSessions] = useState<CopilotSessionResource[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const { currentSessionId: storeSessionId } = useSessionStore();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSessionListLoading, setIsSessionListLoading] = useState(false);
  const [sessionListError, setSessionListError] = useState<string | null>(null);

  /**
   * 从后端加载日程数据
   * 优先使用 sessionId 从后端获取，失败时降级到 localStorage
   */
  const loadSchedules = useCallback(async (sessionId?: string) => {
    if (sessionId) {
      // 从后端获取
      await fetchSchedules(sessionId);
      setPlanTitle(localStorage.getItem(STORAGE_KEYS.PLAN_TITLE)?.trim() || '');
    } else {
      // 降级: 从 localStorage 读取
      try {
        const planDataStr = localStorage.getItem(STORAGE_KEYS.PLAN_DATA);
        if (!planDataStr) {
          setPlanTitle('');
          clearSchedules();
          return;
        }
        const localSchedules = normalizePlanData(JSON.parse(planDataStr));
        if (localSchedules.length === 0) {
          setPlanTitle('');
          clearSchedules();
          return;
        }
        setPlanTitle(localStorage.getItem(STORAGE_KEYS.PLAN_TITLE)?.trim() || '');
        setSchedules(localSchedules);
        setCurrentSchedule(localSchedules[0]);
      } catch (err) {
        console.error('读取本地任务数据失败:', err);
        clearSchedules();
      }
    }
  }, [fetchSchedules, clearSchedules, setCurrentSchedule, setSchedules]);

  // 加载会话列表
  useEffect(() => {
    let isMounted = true;

    const loadCopilotSessions = async () => {
      setIsSessionListLoading(true);
      setSessionListError(null);

      try {
        const response = await getChatSessions(AGENT_IDS.COPILOT);
        if (response.success === false) {
          throw new Error(response.error || '会话列表加载失败');
        }

        const nextSessions = normalizeCopilotSessionMap(response.data);
        if (!isMounted) return;

        setSessions(nextSessions);
        setActiveSessionId((currentSessionId) => {
          if (
            currentSessionId &&
            nextSessions.some((session) => session.sessionId === currentSessionId)
          ) {
            return currentSessionId;
          }

          return nextSessions[0]?.sessionId ?? null;
        });
      } catch (error) {
        console.error('Load copilot sessions failed:', error);
        if (isMounted) {
          setSessionListError('会话列表加载失败');
        }
      } finally {
        if (isMounted) {
          setIsSessionListLoading(false);
        }
      }
    };

    void loadCopilotSessions();

    return () => {
      isMounted = false;
    };
  }, []);

  // 统一加载逻辑：优先使用 activeSessionId 从后端加载，否则降级到 localStorage
  // 避免两个 useEffect 并发调用 loadSchedules 产生竞态条件
  useEffect(() => {
    // 优先从 sessionStore 读取 sessionId
    const effectiveSessionId = storeSessionId || activeSessionId;
    if (effectiveSessionId) {
      void loadSchedules(effectiveSessionId);
    } else {
      void loadSchedules();
    }
  }, [storeSessionId, activeSessionId, loadSchedules]);

  const scheduleSections = schedules.filter(schedule => schedule.subScheduleList.length > 0);
  const allTasks = scheduleSections.reduce<SubSchedule[]>(
    (acc, schedule) => acc.concat(schedule.subScheduleList),
    [],
  );

  const toggleTask = (scheduleId: string, taskId: number) => {
    storeToggleTask(scheduleId, taskId);
  };

  const handleToggleStage = (stageId: string) => {
    setCollapsedStageIds(prev => {
      const next = new Set(prev);
      if (next.has(stageId)) {
        next.delete(stageId);
      } else {
        next.add(stageId);
      }
      return next;
    });
  };

  const handleTaskContentClick = (task: StageTaskViewModel) => {
    const params = new URLSearchParams({
      schedule: task.scheduleId,
      task: task.taskTitle,
    });

    if (task.taskId !== undefined) {
      params.set('taskId', String(task.taskId));
    }

    // 传递 sessionId 以便任务详情页调用后端 API
    if (activeSessionId) {
      params.set('sessionId', activeSessionId);
    }

    setIsTaskLoading(true);
    navigate(`/task-detail?${params.toString()}`);
  };

  const handleClearAll = () => {
    if (confirm('确定要删除这个日程表吗？')) {
      localStorage.removeItem(STORAGE_KEYS.PLAN_DATA);
      localStorage.removeItem(STORAGE_KEYS.PLAN_TITLE);
      setPlanTitle('');
      clearSchedules();
    }
  };

  const completedCount = allTasks.filter(t => t.status === 1).length;
  const totalCount = allTasks.length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const totalGoalTitle = planTitle || 'AI 对话中的学习任务（总）';
  const graphGoal = planTitle || scheduleSections.map(schedule => schedule.title).join('、') || totalGoalTitle;
  const stages = scheduleSections.map((schedule, stageIndex) =>
    createStageViewModel(schedule, stageIndex)
  );
  const activeSessionTitle =
    sessions.find((session) => session.sessionId === activeSessionId)?.title ?? '';
  const sessionSidebarItems: ResourceSidebarItem[] = sessions.map((session) => ({
    id: session.sessionId,
    title: session.title,
    iconClass: 'fas fa-tasks',
    // description: session.sessionId === activeSessionId ? '当前任务' : '待接入任务接口',
  }));
  const sessionSidebarEmptyText = isSessionListLoading
    ? '会话加载中...'
    : sessionListError || '暂无历史会话';

  const handleSelectTaskSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
    // 切换会话时加载对应日程
    void loadSchedules(sessionId);
  };

  const renderSessionSidebar = (fallbackSubtitle: string) => (
    <ResourceSidebar
      header={{
        title: '我的任务',
        iconClass: 'fas fa-tasks',
        subtitle: activeSessionTitle || fallbackSubtitle,
      }}
      sectionTitle="历史会话"
      items={sessionSidebarItems}
      activeItemId={activeSessionId ?? ''}
      isCollapsed={isSidebarCollapsed}
      onToggleCollapse={() => setIsSidebarCollapsed((current) => !current)}
      onSelectItem={handleSelectTaskSession}
      emptyText={sessionSidebarEmptyText}
      collapseTitle="收起侧栏"
      expandTitle="展开侧栏"
      className="tasks-resource-sidebar"
    />
  );

  if (scheduleSections.length === 0 || allTasks.length === 0) {
    return (
      <div className="tasks-page">
        <Header />
        <div className="tasks-layout">
          {renderSessionSidebar('暂无任务数据')}
          <main className="main tasks-main tasks-main--empty">
            <EmptyState
              icon={<i className="fas fa-clipboard-list"></i>}
              title="还没有任务"
              description="先去AI Copilot制定你的学习计划吧"
              action={
                <Link to="/consult" className="btn btn-primary">
                  制定计划
                  <div className="arrow-right">
                    <i className="fas fa-arrow-right"></i>
                  </div>
                </Link>
              }
            />
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="tasks-page">
      <Header />
      {isTaskLoading && (
        <div className="task-loading-overlay">
          <Spin size="large" />
        </div>
      )}
      <div className="tasks-layout">
        {renderSessionSidebar(`${completedCount}/${totalCount} 已完成`)}
        <main className="main tasks-main">
        {/* Progress Card */}
        <Card className="progress-card">
          <div className="progress-header">
            <div className="progress-title">学习进度</div>
            <Badge variant="accent">{percentage}% 完成</Badge>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${percentage}%` }}></div>
          </div>
          <div className="progress-stats">
            <span>已完成 {completedCount} 项</span>
            <span>共 {totalCount} 项</span>
          </div>
        </Card>

        {/* Goal Card */}
        <Card className="goal-card">
          <div className="goal-text">{totalGoalTitle}</div>
        </Card>

        {/* Task List */}
        <div className="stage-task-list">
          {stages.map((stage) => {
            const isCollapsed = collapsedStageIds.has(stage.id);
            return (
              <section className="stage-task-section" key={stage.id}>
                <button
                  type="button"
                  className="stage-task-section__header"
                  aria-expanded={!isCollapsed}
                  onClick={() => handleToggleStage(stage.id)}
                >
                  <span className="stage-task-section__triangle" aria-hidden="true">
                    {isCollapsed ? '▶' : '▼'}
                  </span>
                  <span className="stage-task-section__title">{stage.title}</span>
                </button>

                {!isCollapsed ? (
                  <div className="stage-task-section__tasks">
                    {stage.tasks.map((task) => (
                      <div
                        key={task.id}
                        className={`stage-task-item ${task.status === 1 ? 'stage-task-item--completed' : ''}`}
                      >
                        <label className="stage-task-item__meta">
                          <input
                            type="checkbox"
                            checked={task.status === 1}
                            disabled={task.taskId === undefined}
                            aria-label={`标记「${task.taskTitle}」为${task.status === 1 ? '未完成' : '已完成'}`}
                            onChange={() => {
                              if (task.taskId !== undefined) {
                                toggleTask(task.scheduleId, task.taskId);
                              }
                            }}
                          />
                          <span>{task.timeText}</span>
                        </label>
                        <button
                          type="button"
                          className="stage-task-item__content"
                          onClick={() => handleTaskContentClick(task)}
                        >
                          {task.taskTitle}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button className="btn btn-secondary" onClick={handleClearAll}>
            重新开始
          </button>
          <Link to={`/graph?goal=${encodeURIComponent(graphGoal)}`} className="btn btn-primary">
            查看知识图表
          </Link>
        </div>
        </main>
      </div>
      {/* <Footer /> */}
    </div>
  );
}
