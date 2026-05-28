/**
 * 个人中心页面
 */
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Header, Footer } from '../../components/layout';
import { Card, Badge } from '../../components/common';
import { getUserProfile, getUserTasks, getUserProgress } from '../../utils/storage';
import type { Task, UserProfile, UserProgress } from '../../types/copilot';
import { getScheduleList, deleteSchedule } from '../../api/tasks';
import { useScheduleStore } from '../../stores/scheduleStore';
import './ProfilePage.scss';

export function ProfilePage() {
  const { user, updateUser, changePassword } = useAuthStore();
  const { schedules, setSchedules, removeSchedule } = useScheduleStore();

  // 用户任务数据
  const [profile] = useState<UserProfile | null>(() => getUserProfile());
  const [tasks] = useState<Task[]>(() => getUserTasks());
  const [progress] = useState<UserProgress>(() => getUserProgress());

  // 编辑模式
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: user?.username ?? '',
    email: user?.email ?? '',
    phone: user?.phone || '',
  });

  // 修改密码
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');

  const loadSchedules = useCallback(async () => {
    try {
      const list = await getScheduleList();
      setSchedules(list.data ?? []);
    } catch (err) {
      console.error('加载日程表列表失败:', err);
    }
  }, [setSchedules]);

  const getCurrentUserForm = () => ({
    username: user?.username ?? '',
    email: user?.email ?? '',
    phone: user?.phone || '',
  });

  // 加载日程表列表
  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  // 判断任务是否全部完成
  const isAllTasksCompleted = tasks.length > 0 && tasks.every(t => t.status === 'completed');
  const taskStatus = isAllTasksCompleted ? '已完成' : '进行中';

  const handleEdit = () => {
    setEditForm(getCurrentUserForm());
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditForm(getCurrentUserForm());
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      await updateUser(editForm);
      setIsEditing(false);
    } catch (err) {
      console.error('更新失败:', err);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordError('');

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('新密码至少需要 6 位');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('两次输入的密码不一致');
      return;
    }

    try {
      await changePassword(passwordForm.oldPassword, passwordForm.newPassword);
      setShowPasswordModal(false);
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      alert('密码修改成功！');
    } catch (err) {
      setPasswordError((err as Error).message || '修改密码失败');
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm('确定要删除这个日程表吗？')) return;

    try {
      await deleteSchedule(scheduleId);
      removeSchedule(scheduleId);
      alert('删除成功');
    } catch (err) {
      console.error('删除日程表失败:', err);
      alert('删除失败');
    }
  };

  if (!user) {
    return (
      <div className="profile-page">
        <Header />
        <main className="main">
          <div className="profile-loading">加载中...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <Header />

      <main className="main">
        <div className="profile-container">
          {/* 用户信息卡片 */}
          <Card className="profile-card">
            <div className="profile-header">
              <div className="profile-avatar">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.username} />
                ) : (
                  <div className="avatar-placeholder">
                    <i className="fas fa-user"></i>
                  </div>
                )}
              </div>
              <div className="profile-info">
                <h2>{user.username}</h2>
                <Badge variant="default">{user.role === 'admin' ? '管理员' : '普通用户'}</Badge>
              </div>
              {!isEditing && (
                <button className="btn btn-secondary" onClick={handleEdit}>
                  <i className="fas fa-edit"></i> 编辑资料
                </button>
              )}
            </div>

            <div className="profile-body">
              {/* 用户名 */}
              <div className="profile-field">
                <label className="profile-label">
                  <i className="fas fa-user"></i> 用户名
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    className="profile-input"
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  />
                ) : (
                  <span className="profile-value">{user.username}</span>
                )}
              </div>

              {/* 邮箱 */}
              <div className="profile-field">
                <label className="profile-label">
                  <i className="fas fa-envelope"></i> 邮箱
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    className="profile-input"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  />
                ) : (
                  <span className="profile-value">{user.email}</span>
                )}
              </div>

              {/* 手机号 */}
              <div className="profile-field">
                <label className="profile-label">
                  <i className="fas fa-phone"></i> 手机号
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    className="profile-input"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="未设置"
                  />
                ) : (
                  <span className="profile-value">{user.phone || '未设置'}</span>
                )}
              </div>

              {/* 注册时间 */}
              <div className="profile-field">
                <label className="profile-label">
                  <i className="fas fa-calendar-alt"></i> 注册时间
                </label>
                <span className="profile-value">
                  {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                </span>
              </div>
            </div>

            {/* 编辑操作按钮 */}
            {isEditing && (
              <div className="profile-actions">
                <button className="btn btn-secondary" onClick={handleCancel}>
                  取消
                </button>
                <button className="btn btn-primary" onClick={handleSave}>
                  保存修改
                </button>
              </div>
            )}
          </Card>

          {/* 安全设置卡片 */}
          <Card className="security-card">
            <div className="card-title">
              <i className="fas fa-shield-alt"></i> 安全设置
            </div>
            <div className="security-item">
              <div className="security-info">
                <span className="security-label">登录密码</span>
                <span className="security-desc">定期更换密码可以保护账户安全</span>
              </div>
              <button
                className="btn btn-outline"
                onClick={() => setShowPasswordModal(true)}
              >
                修改密码
              </button>
            </div>
          </Card>

          {/* 学习统计卡片 */}
          <Card className="stats-card">
            <div className="card-title">
              <i className="fas fa-chart-line"></i> 学习统计
            </div>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-icon">
                  <i className="fas fa-check-circle"></i>
                </div>
                <div className="stat-content">
                  <div className="stat-value">{progress.completedTasks}</div>
                  <div className="stat-label">完成任务</div>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon">
                  <i className="fas fa-list"></i>
                </div>
                <div className="stat-content">
                  <div className="stat-value">{progress.totalTasks}</div>
                  <div className="stat-label">总任务数</div>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon">
                  <i className="fas fa-percentage"></i>
                </div>
                <div className="stat-content">
                  <div className="stat-value">{progress.percentage}%</div>
                  <div className="stat-label">完成进度</div>
                </div>
              </div>
            </div>
          </Card>

          {/* 任务记录 */}
          <Card className="task-records-card">
            <div className="card-title">
              <i className="fas fa-tasks"></i> 任务记录
            </div>
            {profile && tasks.length > 0 ? (
              <div className="task-record">
                <div className="task-record-header">
                  <div className="task-record-title">
                    <i className="fas fa-bullseye"></i>
                    <span>{profile.goal}</span>
                  </div>
                  <Badge variant={isAllTasksCompleted ? 'success' : 'accent'}>
                    {taskStatus}
                  </Badge>
                </div>
                <div className="task-record-progress">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${progress.percentage}%` }}
                    ></div>
                  </div>
                  <span className="progress-text">
                    {progress.completedTasks} / {progress.totalTasks}
                  </span>
                </div>
                <div className="task-record-action">
                  <Link to="/tasks" className="btn btn-secondary">
                    <i className="fas fa-eye"></i> 查看详情
                  </Link>
                </div>
              </div>
            ) : (
              <div className="task-record-empty">
                <p>暂无任务记录</p>
                <Link to="/consult" className="btn btn-primary">
                  <i className="fas fa-plus"></i> 制定计划
                </Link>
              </div>
            )}
          </Card>

          {/* 日程表列表 */}
          {schedules.length > 0 && (
            <Card className="schedules-list-card">
              <div className="card-title">
                <i className="fas fa-calendar-alt"></i> 我的日程表
              </div>
              <div className="schedules-list">
                {schedules.map((schedule) => (
                  <div key={schedule.scheduleId} className="schedule-item">
                    <div className="schedule-info">
                      <i className="fas fa-calendar"></i>
                      <span className="schedule-title">{schedule.title}</span>
                      <span className="schedule-time">{schedule.time}</span>
                    </div>
                    <div className="schedule-actions">
                      <Link to="/tasks" className="btn btn-secondary btn-sm">
                        查看
                      </Link>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteSchedule(schedule.scheduleId)}
                      >
                        <i className="fas fa-trash"></i> 删除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </main>

      {/* 修改密码弹窗 */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>修改密码</h3>
              <button className="modal-close" onClick={() => setShowPasswordModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>当前密码</label>
                <input
                  type="password"
                  className="form-input"
                  value={passwordForm.oldPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, oldPassword: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>新密码</label>
                <input
                  type="password"
                  className="form-input"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>确认新密码</label>
                <input
                  type="password"
                  className="form-input"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                  }
                />
              </div>
              {passwordError && (
                <div className="form-error">
                  <i className="fas fa-exclamation-circle"></i> {passwordError}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowPasswordModal(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handlePasswordChange}>
                确认修改
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
