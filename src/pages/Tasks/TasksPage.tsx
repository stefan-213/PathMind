import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header, Footer } from '../../components/layout';
import { Card, CardContent, Badge, EmptyState } from '../../components/common';
import { getUserProfile, getUserTasks, getUserProgress, saveUserTasks, clearUserData } from '../../utils/storage';
import type { Task, UserProfile, UserProgress } from '../../types/copilot';
import './TasksPage.css';

type TasksByWeek = Record<string, Task[]>;

export function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [progress, setProgress] = useState<UserProgress>({ completedTasks: 0, totalTasks: 0, percentage: 0 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const userTasks = getUserTasks();
    const userProfile = getUserProfile();
    const userProgress = getUserProgress();

    setTasks(userTasks);
    setProfile(userProfile);
    setProgress(userProgress);
  };

  const toggleTask = (taskId: string) => {
    const updatedTasks = tasks.map((task): Task => {
      if (task.id === taskId) {
        const newStatus: 'pending' | 'completed' = task.status === 'completed' ? 'pending' : 'completed';
        return {
          ...task,
          status: newStatus,
          completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined
        };
      }
      return task;
    });
    saveUserTasks(updatedTasks);
    setTasks(updatedTasks);
    setProgress(getUserProgress());
  };

  const handleClearAll = () => {
    if (confirm('确定要清除所有数据重新开始吗？')) {
      clearUserData();
      loadData();
    }
  };

  const tasksByWeek: TasksByWeek = tasks.reduce((acc, task) => {
    if (!acc[task.week]) {
      acc[task.week] = [];
    }
    acc[task.week].push(task);
    return acc;
  }, {} as TasksByWeek);

  if (!profile || tasks.length === 0) {
    return (
      <div className="tasks-page">
        <Header />
        <main className="main">
          <EmptyState
            icon={<i className="fas fa-clipboard-list"></i>}
            title="还没有任务"
            description="先去 AI Copilot 制定你的学习计划吧"
            action={
              <Link to="/copilot" className="btn btn-primary">
                制定计划 <i className="fas fa-arrow-right"></i>
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
        {/* Progress Card */}
        <Card className="progress-card">
          <div className="progress-header">
            <div className="progress-title">学习进度</div>
            <Badge variant="accent">{progress.percentage}% 完成</Badge>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress.percentage}%` }}></div>
          </div>
          <div className="progress-stats">
            <span>已完成 {progress.completedTasks} 项</span>
            <span>共 {progress.totalTasks} 项</span>
          </div>
        </Card>

        {/* Goal Card */}
        <Card className="goal-card">
          <div className="goal-label">当前目标</div>
          <div className="goal-text">{profile.goal}</div>
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
                  className={`task-card ${task.status === 'completed' ? 'completed' : ''}`}
                  onClick={() => toggleTask(task.id)}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="task-check">
                    {task.status === 'completed' ? <i className="fas fa-check"></i> : ''}
                  </div>
                  <div className="task-content">
                    <div className="task-week">{task.day}</div>
                    <div className="task-title">{task.title}</div>
                  </div>
                  <div className="task-action">
                    {task.status === 'completed' ? <i className="fas fa-check-circle"></i> : <i className="far fa-circle"></i>}
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
          <Link to={`/graph?goal=${encodeURIComponent(profile.goal)}`} className="btn btn-primary">
            查看知识图谱
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
