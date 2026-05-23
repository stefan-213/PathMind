import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header, Footer } from '../../components/layout';
import { Card, Badge, EmptyState } from '../../components/common';
import { useScheduleStore } from '../../stores/scheduleStore';
import type { Schedule, SubSchedule } from '../../types/api';
import './TasksPage.scss';

type TasksByWeek = Record<string, SubSchedule[]>;
type PlanDataRecord = Record<string, unknown>;

const PLAN_DATA_STORAGE_KEY = 'pathmind_plan_data';

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
    .split(/[；;\n]+/)
    .map(task => task.trim())
    .filter(Boolean);
};

const getTaskInputs = (record: PlanDataRecord) => {
  if (Array.isArray(record.subScheduleList)) return record.subScheduleList;
  if (Array.isArray(record.tasks)) return record.tasks;
  if (Array.isArray(record.details)) return record.details;
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
    const task = taskInput.trim();
    if (!task) return null;
    return {
      id: fallbackId,
      parentId,
      day: `第${taskIndex + 1}天`,
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

  return {
    id: getNumber(taskInput.id, fallbackId),
    parentId: getNumber(taskInput.parentId, parentId),
    day: getText(taskInput.day, `第${taskIndex + 1}天`),
    task,
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

export function TasksPage() {
  const { schedules, currentSchedule, setSchedules, setCurrentSchedule, setLoading, clearSchedules } = useScheduleStore();

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = () => {
    setLoading(true);
    try {
      const planDataStr = localStorage.getItem(PLAN_DATA_STORAGE_KEY);
      if (!planDataStr) {
        clearSchedules();
        return;
      }

      const localSchedules = normalizePlanData(JSON.parse(planDataStr));
      if (localSchedules.length === 0) {
        clearSchedules();
        return;
      }

      setSchedules(localSchedules);
      setCurrentSchedule(localSchedules[0]);
      saveLocalSchedules(localSchedules);
    } catch (err) {
      console.error('读取本地任务数据失败:', err);
      clearSchedules();
    } finally {
      setLoading(false);
    }
  };

  const tasks = currentSchedule?.subScheduleList || [];

  const toggleTask = (taskId: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.id === undefined || !currentSchedule) return;

    const newStatus = task.status === 1 ? 0 : 1;
    const nextSchedule = {
      ...currentSchedule,
      subScheduleList: tasks.map(item =>
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
          schedule.scheduleId === currentSchedule.scheduleId ? nextSchedule : schedule,
        )
      : [nextSchedule];

    setSchedules(nextSchedules);
    setCurrentSchedule(nextSchedule);
    saveLocalSchedules(nextSchedules);
  };

  const handleClearAll = () => {
    if (confirm('确定要删除这个日程表吗？')) {
      localStorage.removeItem(PLAN_DATA_STORAGE_KEY);
      clearSchedules();
    }
  };

  const tasksByWeek: TasksByWeek = tasks.reduce((acc, task) => {
    const week = task.taskGoal || '学习任务';
    if (!acc[week]) {
      acc[week] = [];
    }
    acc[week].push(task);
    return acc;
  }, {} as TasksByWeek);

  const completedCount = tasks.filter(t => t.status === 1).length;
  const totalCount = tasks.length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (!currentSchedule || tasks.length === 0) {
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
      <main className="main">
        {/* Schedule Selector */}
        {schedules.length > 1 && (
          <div className="schedule-selector">
            <select
              value={currentSchedule?.scheduleId || ''}
              onChange={(e) => {
                const selected = schedules.find(s => s.scheduleId === e.target.value);
                if (selected) {
                  setCurrentSchedule(selected);
                }
              }}
            >
              {schedules.map(s => (
                <option key={s.scheduleId} value={s.scheduleId}>{s.title}</option>
              ))}
            </select>
          </div>
        )}

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
          <div className="goal-label">当前目标</div>
          <div className="goal-text">{currentSchedule.title}</div>
        </Card>

        {/* Task List */}
        {Object.entries(tasksByWeek).map(([week, weekTasks]) => (
          <div key={week}>
            <div className="section-title">{week}</div>
            <div className="task-list">
              {weekTasks.map((task, index) => (
                <Card
                  key={task.id ?? `${week}-${index}`}
                  variant="bordered"
                  padding="md"
                  className={`task-card ${task.status === 1 ? 'completed' : ''}`}
                  onClick={() => task.id !== undefined && toggleTask(task.id)}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="task-check">
                    {task.status === 1 ? <i className="fas fa-check"></i> : ''}
                  </div>
                  <div className="task-content">
                    <div className="task-week">{task.day}</div>
                    <div className="task-title">{task.task}</div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}

        {/* Action Buttons */}
        <div className="action-buttons">
          <button className="btn btn-secondary" onClick={handleClearAll}>
            重新开始
          </button>
          <Link to={`/graph?goal=${encodeURIComponent(currentSchedule.title)}`} className="btn btn-primary">
            查看知识图表
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
