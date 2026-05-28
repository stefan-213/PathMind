import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header, Footer } from '../../components/layout';
import { Card, Badge, EmptyState, Spin } from '../../components/common';
import { useScheduleStore } from '../../stores/scheduleStore';
import type { Schedule, SubSchedule } from '../../types/api';
import './TasksPage.scss';

type TasksByWeek = Record<string, SubSchedule[]>;
type PlanDataRecord = Record<string, unknown>;

const PLAN_DATA_STORAGE_KEY = 'pathmind_plan_data';
const PLAN_TITLE_STORAGE_KEY = 'pathmind_plan_title';

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

const splitTasks = (value: unknown) => {
  if (typeof value !== 'string') return [];
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/(第\d+(?:-\d+)?[天周])\s*\n\s*(?!第\d+(?:-\d+)?[天周])([^\n]+)/g, '$1-$2')
    .replace(/[，,；;]\s*(?=第\d+(?:-\d+)?[天周](?:\s*[-—－:：])?)/g, '\n')
    .split(/[；;\n]+/)
    .map(task => task.trim())
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

const saveLocalSchedules = (schedules: Schedule[]) => {
  localStorage.setItem(PLAN_DATA_STORAGE_KEY, JSON.stringify(schedules));
};

const groupTasksByWeek = (tasks: SubSchedule[]): TasksByWeek => {
  return tasks.reduce((acc, task) => {
    const week = task.taskGoal || '学习任务';
    if (!acc[week]) {
      acc[week] = [];
    }
    acc[week].push(task);
    return acc;
  }, {} as TasksByWeek);
};

export function TasksPage() {
  const navigate = useNavigate();
  const { schedules, setSchedules, setCurrentSchedule, setLoading, clearSchedules } = useScheduleStore();
  const [isTaskLoading, setIsTaskLoading] = useState(false);
  const [planTitle, setPlanTitle] = useState(() =>
    localStorage.getItem(PLAN_TITLE_STORAGE_KEY)?.trim() || ''
  );

  const loadSchedules = useCallback(() => {
    setLoading(true);
    try {
      const planDataStr = localStorage.getItem(PLAN_DATA_STORAGE_KEY);
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

      setPlanTitle(localStorage.getItem(PLAN_TITLE_STORAGE_KEY)?.trim() || '');
      setSchedules(localSchedules);
      setCurrentSchedule(localSchedules[0]);
      saveLocalSchedules(localSchedules);
    } catch (err) {
      console.error('读取本地任务数据失败:', err);
      clearSchedules();
    } finally {
      setLoading(false);
    }
  }, [clearSchedules, setCurrentSchedule, setLoading, setSchedules]);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  const scheduleSections = schedules.filter(schedule => schedule.subScheduleList.length > 0);
  const allTasks = scheduleSections.reduce<SubSchedule[]>(
    (acc, schedule) => acc.concat(schedule.subScheduleList),
    [],
  );

  const toggleTask = (scheduleId: string, taskId: number) => {
    const targetSchedule = schedules.find(schedule => schedule.scheduleId === scheduleId);
    const task = targetSchedule?.subScheduleList.find(item => item.id === taskId);
    if (!targetSchedule || !task || task.id === undefined) return;

    const newStatus = task.status === 1 ? 0 : 1;
    const nextSchedule = {
      ...targetSchedule,
      subScheduleList: targetSchedule.subScheduleList.map(item =>
        item.id === taskId
          ? {
              ...item,
              status: newStatus,
              completedAt: newStatus === 1 ? new Date().toISOString() : null,
            }
          : item,
      ),
    };
    const nextSchedules = schedules.length > 0
      ? schedules.map(schedule =>
          schedule.scheduleId === targetSchedule.scheduleId ? nextSchedule : schedule,
        )
      : [nextSchedule];

    setSchedules(nextSchedules);
    setCurrentSchedule(nextSchedule);
    saveLocalSchedules(nextSchedules);
  };

  const handleTaskContentClick = (schedule: Schedule, task: SubSchedule) => {
    const params = new URLSearchParams({
      schedule: schedule.scheduleId,
      task: task.task,
    });

    if (task.id !== undefined) {
      params.set('taskId', String(task.id));
    }

    setIsTaskLoading(true);
    setTimeout(() => {
      navigate(`/task-detail?${params.toString()}`);
    }, 300);
  };

  const handleClearAll = () => {
    if (confirm('确定要删除这个日程表吗？')) {
      localStorage.removeItem(PLAN_DATA_STORAGE_KEY);
      localStorage.removeItem(PLAN_TITLE_STORAGE_KEY);
      setPlanTitle('');
      clearSchedules();
    }
  };

  const completedCount = allTasks.filter(t => t.status === 1).length;
  const totalCount = allTasks.length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const totalGoalTitle = planTitle || 'AI 对话中的学习任务（总）';
  const graphGoal = planTitle || scheduleSections.map(schedule => schedule.title).join('、') || totalGoalTitle;

  if (scheduleSections.length === 0 || allTasks.length === 0) {
    return (
      <div className="tasks-page">
        <Header />
        <main className="main">
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
      <main className="main">
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
        <div className="schedule-list">
          {scheduleSections.map((schedule) => {
            const tasksByWeek = groupTasksByWeek(schedule.subScheduleList);

            return (
              <section className="schedule-section" key={schedule.scheduleId}>
                <div className="schedule-heading">
                  <div className="schedule-heading-main">
                    <h2>{schedule.title}</h2>
                  </div>
                </div>

                {Object.entries(tasksByWeek).map(([week, weekTasks]) => (
                  <div key={`${schedule.scheduleId}-${week}`}>
                    {/* <div className="section-title">{week}</div> */}
                    <div className="task-list">
                      {weekTasks.map((task, index) => (
                        <Card
                          key={task.id ?? `${schedule.scheduleId}-${week}-${index}`}
                          variant="bordered"
                          padding="md"
                          className={`task-card ${task.status === 1 ? 'completed' : ''}`}
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          <div
                            className="task-check"
                            onClick={(event) => {
                              event.stopPropagation();
                              if (task.id !== undefined) toggleTask(schedule.scheduleId, task.id);
                            }}
                          >
                            {task.status === 1 ? <i className="fas fa-check"></i> : ''}
                          </div>
                          <div className="task-content" onClick={() => handleTaskContentClick(schedule, task)}>
                            <div className="task-week">{task.day}</div>
                            <div className="task-title">{task.task}</div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
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
      <Footer />
    </div>
  );
}
