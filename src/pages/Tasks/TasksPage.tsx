import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header, Footer } from '../../components/layout';
import { Card, Badge, EmptyState, ResourceSidebar, Spin, CelebrationModal, type ResourceSidebarItem } from '../../components/common';
import { getChatList } from '../../api/conversation';
import { getAchievements } from '../../api/profile';
import { deleteSchedule } from '../../api/tasks';
import { useScheduleStore } from '../../stores/scheduleStore';
import { useSessionStore } from '../../stores/sessionStore';
import { normalizeCopilotSessionMap, type CopilotSessionResource } from '../../utils';
import { AGENT_IDS } from '../../constants';
import { pathmindStorage } from '../../utils/storage';
import type { Schedule, SubSchedule, Achievement } from '../../types/api';
import './TasksPage.scss';

interface StageTaskViewModel {
  id: number | string;
  scheduleId: string;
  taskId?: number;
  timeText: string;
  taskTitle: string;
  status: number;
}

interface StageViewModel {
  id: string;
  title: string;
  tasks: StageTaskViewModel[];
}

const createStageViewModel = (schedule: Schedule, stageIndex: number): StageViewModel => {
  const stageTitle = `阶段${stageIndex + 1}·${schedule.title || '未命名阶段'}`;

  // 对 tasks 去重，防止相同 task.id 重复渲染导致 key 冲突
  const uniqueTasks = schedule.subScheduleList.filter(
    (task, index, arr) => arr.findIndex(t => t.id === task.id) === index,
  );

  return {
    id: `${schedule.scheduleId}-${stageIndex}`,
    title: stageTitle,
    tasks: uniqueTasks.map((task, taskIndex) => ({
      id: `${schedule.scheduleId}-${task.id ?? taskIndex}`,
      scheduleId: schedule.scheduleId,
      taskId: task.id,
      timeText: task.day || '未标注时间',
      taskTitle: task.task || '未命名任务',
      status: task.status,
    })),
  };
};

export function TasksPage() {
  const navigate = useNavigate();
  const {
    schedules,
    fetchSchedules,
    clearSchedules,
    toggleTask: storeToggleTask,
  } = useScheduleStore();
  const [isTaskLoading, setIsTaskLoading] = useState(false);
  const [collapsedStageIds, setCollapsedStageIds] = useState<Set<string>>(() => new Set());
  const [planTitle, setPlanTitle] = useState(() =>
    pathmindStorage.plan.loadTitle()?.trim() || ''
  );
  const [sessions, setSessions] = useState<CopilotSessionResource[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const { currentSessionId: storeSessionId } = useSessionStore();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSessionListLoading, setIsSessionListLoading] = useState(false);
  const [sessionListError, setSessionListError] = useState<string | null>(null);
  const [hasAttemptedLoadSchedules, setHasAttemptedLoadSchedules] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);

  /**
   * 从后端加载日程数据
   * 每次从接口获取最新数据
   */
  const loadSchedules = useCallback(async (sessionId?: string) => {
    if (!sessionId) {
      clearSchedules();
      setPlanTitle('');
      setHasAttemptedLoadSchedules(true);
      return;
    }

    setHasAttemptedLoadSchedules(false);
    try {
      await fetchSchedules(sessionId);
      const title = pathmindStorage.plan.loadTitle(sessionId)?.trim() || '';
      setPlanTitle(title);
    } catch (err) {
      console.error('加载日程数据失败:', err);
      clearSchedules();
      setPlanTitle('');
    } finally {
      setHasAttemptedLoadSchedules(true);
    }
  }, [fetchSchedules, clearSchedules]);

  // 加载会话列表
  useEffect(() => {
    let isMounted = true;

    const loadCopilotSessions = async () => {
      setIsSessionListLoading(true);
      setSessionListError(null);

      try {
        const response = await getChatList(AGENT_IDS.COPILOT);
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

  const toggleTask = async (scheduleId: string, taskId: number) => {
    await storeToggleTask(scheduleId, taskId);

    // 检查是否所有任务都已完成
    const { schedules } = useScheduleStore.getState();
    const allTasks = schedules.flatMap(s => s.subScheduleList);
    const allCompleted = allTasks.length > 0 && allTasks.every(t => t.status === 1);
    if (allCompleted) {
      // 获取最新成就
      const res = await getAchievements();
      const unlocked = res.data?.filter(a => a.unlocked) ?? [];
      setNewAchievements(unlocked);
      setShowCelebration(true);
    }
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

  const handleClearAll = async () => {
    if (confirm('确定要删除这个日程表吗？')) {
      if (activeSessionId) {
        await deleteSchedule(activeSessionId);
      }
      pathmindStorage.plan.clear(activeSessionId ?? undefined);
      setPlanTitle('');
      clearSchedules();
    }
  };

  const completedCount = allTasks.filter(t => t.status === 1).length;
  const totalCount = allTasks.length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const totalGoalTitle = planTitle || 'AI 对话中的学习任务（总）';
  const graphGoal = planTitle || scheduleSections.map(schedule => schedule.title).join('、') || totalGoalTitle;
  const stages = scheduleSections.map((schedule, stageIndex) => {
    // console.log('[stages] creating stage', stageIndex, 'with scheduleId:', schedule.scheduleId, 'tasks:', schedule.subScheduleList.map(t => t.id));
    return createStageViewModel(schedule, stageIndex);
  });
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

  // 曾尝试加载但数据为空
  const isEmptyAfterLoad = hasAttemptedLoadSchedules && scheduleSections.length === 0;

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
              description={isEmptyAfterLoad
                ? '请到Graph页面继续完善计划，生成计划表'
                : '先去AI Copilot制定你的学习计划吧'}
              action={
                isEmptyAfterLoad ? (
                  <Link to="/graph" className="btn btn-primary">
                    去Graph页面
                    <div className="arrow-right">
                      <i className="fas fa-arrow-right"></i>
                    </div>
                  </Link>
                ) : (
                  <Link to="/consult" className="btn btn-primary">
                    制定计划
                    <div className="arrow-right">
                      <i className="fas fa-arrow-right"></i>
                    </div>
                  </Link>
                )
              }
            />
          </main>
        </div>
        <Footer />
        <CelebrationModal
          isOpen={showCelebration}
          onClose={() => setShowCelebration(false)}
          newAchievements={newAchievements}
        />
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
      <CelebrationModal
        isOpen={showCelebration}
        onClose={() => setShowCelebration(false)}
        newAchievements={newAchievements}
      />
    </div>
  );
}
