import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header, Footer } from '../../components/layout';
import { Card, Badge, EmptyState } from '../../components/common';
import { getScheduleList, getScheduleContent, updateSubTask } from '../../api/tasks';
import { useScheduleStore } from '../../stores/scheduleStore';
import type { SubSchedule } from '../../types/api';
import './TasksPage.scss';

type TasksByWeek = Record<string, SubSchedule[]>;

export function TasksPage() {
  const { schedules, currentSchedule, setSchedules, setCurrentSchedule, setLoading } = useScheduleStore();

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    setLoading(true);
    try {
      // 获取日程表列表
      const listRes = await getScheduleList();
      const listData = listRes.data;
      if (listData && listData.length > 0) {
        setSchedules(listData);

        // 获取第一个日程表的内容
        const firstSchedule = listData[0];
        const contentRes = await getScheduleContent(firstSchedule.scheduleId);
        const contentData = contentRes.data;
        if (contentData && contentData.length > 0) {
          setCurrentSchedule(contentData[0]);
        }
      }
    } catch (err) {
      console.error('加载日程表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const tasks = currentSchedule?.subScheduleList || [];

  const toggleTask = async (taskId: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newStatus = task.status === 1 ? 0 : 1;
    try {
      await updateSubTask({
        id: task.id!,
        parentId: task.parentId!,
        day: task.day,
        task: task.task,
        taskGoal: task.taskGoal,
        description: task.description,
        status: newStatus,
        completedAt: newStatus === 1 ? new Date().toISOString() : null
      });
      // Reload to get updated data
      if (currentSchedule) {
        const contentRes = await getScheduleContent(currentSchedule.scheduleId);
        const contentData = contentRes.data;
        if (contentData && contentData.length > 0) {
          setCurrentSchedule(contentData[0]);
        }
      }
    } catch (err) {
      console.error('更新任务状态失败:', err);
    }
  };

  const handleClearAll = () => {
    if (confirm('确定要清除所有数据重新开始吗？')) {
      localStorage.clear();
      window.location.reload();
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
                  getScheduleContent(selected.scheduleId).then(res => {
                    const data = res.data;
                    if (data && data.length > 0) setCurrentSchedule(data[0]);
                  });
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
                  key={task.id}
                  variant="bordered"
                  padding="md"
                  className={`task-card ${task.status === 1 ? 'completed' : ''}`}
                  onClick={() => toggleTask(task.id!)}
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