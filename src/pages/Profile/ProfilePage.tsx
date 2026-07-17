/**
 * 个人中心页面
 * 两栏布局：左侧基础信息+学习统计，右侧进行中的计划+成就+历史目标
 */
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { changePassword as changePasswordApi } from '../../api/auth';
import { useProfileStore, useProfileLoading } from '../../stores/profileStore';
import { Header, Footer } from '../../components/layout';
import { Card, Badge, Spin } from '../../components/common';
import { useFormValidation, useToast } from '../../hooks';
import type { Achievement, UserPlan } from '../../types/api';
import './ProfilePage.scss';

type ModalState =
  | { type: 'achievement'; data: Achievement }
  | { type: 'goal'; data: UserPlan }
  | null;

/** 邮箱格式校验 */
const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// ==================== 验证规则 ====================
const editRules = {
  username: [
    { test: (v: unknown) => !!String(v).trim(), message: '用户名不能为空' },
  ],
  email: [
    { test: (v: unknown) => !!String(v).trim(), message: '邮箱不能为空' },
    { test: (v: unknown) => isValidEmail(String(v)), message: '邮箱格式不正确' },
  ],
};

const passwordRules = {
  oldPassword: [
    { test: (v: unknown) => !!v, message: '请输入当前密码' },
  ],
  newPassword: [
    { test: (v: unknown) => !!v, message: '请输入新密码' },
    { test: (v: unknown) => String(v).length >= 6, message: '新密码至少需要 6 位' },
  ],
  confirmPassword: [
    { test: (v: unknown) => !!v, message: '请确认新密码' },
  ],
};

// ==================== 组件 ====================
export function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const profileLoading = useProfileLoading();
  const {
    plans,
    achievements: achievementsData,
    stats,
    error: profileError,
    fetchPlans,
    fetchAchievements,
    fetchStats,
    deleteGoal: deleteGoalApi,
    clearError,
  } = useProfileStore();

  // 页面加载时获取数据
  useEffect(() => {
    fetchPlans();
    fetchAchievements();
    fetchStats();
  }, [fetchPlans, fetchAchievements, fetchStats]);

  // 编辑资料
  const [isEditing, setIsEditing] = useState(false);
  const {
    register: registerEdit,
    validate: validateEdit,
    touchAll: touchAllEdit,
    reset: resetEdit,
  } = useFormValidation({
    rules: editRules,
    initialValues: {
      username: user?.username ?? '',
      email: user?.email ?? '',
    },
  });
  const [editPhone, setEditPhone] = useState(user?.phone || '');

  // 修改密码
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const {
    register: registerPassword,
    validate: validatePassword,
    touchAll: touchAllPassword,
    reset: resetPassword,
  } = useFormValidation({
    rules: passwordRules,
    initialValues: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // 计划数据
  const activePlans = useMemo(() => plans.filter((p) => p.status === 'active'), [plans]);
  const completedPlans = useMemo(() => plans.filter((p) => p.status === 'completed'), [plans]);
  const goals = useMemo(() => completedPlans, [completedPlans]);

  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);

  // 数据加载后自动选中第一个进行中的计划
  useEffect(() => {
    if (selectedPlanId === null && activePlans.length > 0) {
      setSelectedPlanId(activePlans[0].id);
    }
  }, [activePlans, selectedPlanId]);

  // 弹窗
  const [modal, setModal] = useState<ModalState>(null);

  // 临时消息提示
  const { toast, showToast } = useToast();

  // ESC 关闭弹窗
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setModal(null);
        setShowPasswordModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 编辑资料
  const handleEdit = () => {
    resetEdit();
    setEditPhone(user?.phone || '');
    setIsEditing(true);
  };

  const handleCancel = () => {
    resetEdit();
    setEditPhone(user?.phone || '');
    setIsEditing(false);
  };

  const handleSave = async () => {
    touchAllEdit();
    if (!await validateEdit()) return;
    try {
      await updateUser({
        username: registerEdit('username').value,
        email: registerEdit('email').value,
        phone: user?.phone || '',
      });
      setIsEditing(false);
    } catch (err) {
      console.error('更新失败:', err);
    }
  };

  // 关闭修改密码弹窗并清除状态
  const handleClosePasswordModal = () => {
    setShowPasswordModal(false);
    setConfirmPasswordError('');
    resetPassword();
  };

  // 修改密码
  const handlePasswordChange = async () => {
    touchAllPassword();

    // 手动检查密码确认
    if (registerPassword('newPassword').value !== registerPassword('confirmPassword').value) {
      setConfirmPasswordError('两次输入的密码不一致');
      return;
    }

    if (!await validatePassword()) return;

    try {
      const result = await changePasswordApi(
        registerPassword('oldPassword').value,
        registerPassword('newPassword').value
      );
      if (!result.success) {
        setConfirmPasswordError(result.error || '修改密码失败');
        return;
      }
      handleClosePasswordModal();
      showToast({ type: 'success', message: '密码修改成功！' });
    } catch (err) {
      setConfirmPasswordError((err as Error).message || '修改密码失败');
    }
  };

  // 批次切换
  const handleSwitchBatch = (planId: number) => {
    setSelectedPlanId(planId);
  };

  // 成就详情
  const handleShowAchievement = (achievement: Achievement) => {
    if (!achievement.unlocked) return;
    setModal({ type: 'achievement', data: achievement });
  };

  // 目标详情
  const handleShowGoal = (goal: UserPlan) => {
    setModal({ type: 'goal', data: goal });
  };

  // 删除目标（先调用 API，成功后执行淡出动画）
  const handleDeleteGoal = async (id: number) => {
    if (!window.confirm('确定要删除该学习目标吗？')) return;
    try {
      await deleteGoalApi(id);
      // API 成功后，store 已移除该目标，组件会自动更新
    } catch (err) {
      // 删除失败，error 已在 store 中设置，无需额外处理
      console.error('删除目标失败:', err);
    }
  };

  // 统计卡片点击跳转
  const handleStatClick = (targetId: string) => {
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // 头像点击占位
  const handleAvatarClick = () => {
    showToast({ type: 'info', message: '头像上传功能开发中' });
  };

  // 计算值
  const selectedPlan = useMemo(
    () => activePlans.find((p) => p.id === selectedPlanId) || null,
    [activePlans, selectedPlanId]
  );

  const unlockedAchievements = useMemo(
    () => achievementsData.filter((a) => a.unlocked).length,
    [achievementsData]
  );

  const nextAchievement = useMemo(
    () => achievementsData.find((a) => !a.unlocked) || null,
    [achievementsData]
  );

  const selectedPlanProgress = useMemo(() => {
    if (!selectedPlan || selectedPlan.totalTasks === 0) return 0;
    return Math.round((selectedPlan.completedTasks / selectedPlan.totalTasks) * 100);
  }, [selectedPlan]);

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
          {/* 页面标题 */}
          <div className="page-header">
            <h1>个人中心</h1>
            <p>管理你的账户信息，追踪学习成果</p>
          </div>

          {/* 全局 loading / error */}
          {profileLoading && (
            <div className="profile-loading">
              <Spin size="default" tip="加载中..." />
            </div>
          )}
          {profileError && (
            <div className="profile-error-bar">
              <i className="fas fa-exclamation-circle"></i> {profileError}
              <button
                className="btn-text"
                onClick={() => {
                  clearError();
                  fetchPlans();
                  fetchAchievements();
                  fetchStats();
                }}
              >
                重试
              </button>
            </div>
          )}

          {/* 临时消息提示 */}
          {toast && (
            <div className={`profile-toast profile-toast-${toast.type}`}>
              <i className={`fas ${toast.type === 'success' ? 'fa-check-circle' : toast.type === 'error' ? 'fa-times-circle' : 'fa-info-circle'}`}></i>
              {toast.message}
            </div>
          )}

          {/* 两栏布局 */}
          <div className="two-columns">
            {/* 左侧栏 */}
            <div className="left-sidebar">
              {/* 基础信息 */}
              <Card className="info-card">
                <div className="profile-section-title">
                  <div className="profile-section-title-left">
                    <i className="fas fa-user-circle"></i> 基础信息
                  </div>
                </div>

                {!isEditing ? (
                  <div className="profile-view">
                    <div className="avatar-section">
                      <div className="avatar" onClick={handleAvatarClick}>
                        <i className="fas fa-user-astronaut"></i>
                        <div className="avatar-overlay">
                          <i className="fas fa-camera"></i>
                        </div>
                      </div>
                      <h3>{user.username}</h3>
                      <Badge variant="default">
                        {user.role === 'admin' ? '管理员' : '普通用户'}
                      </Badge>
                      <div className="email">{user.email}</div>
                      <button className="btn-outline-sm" onClick={handleEdit}>
                        <i className="far fa-edit"></i> 编辑资料
                      </button>
                    </div>
                    <div className="info-row">
                      <div className="info-icon">
                        <i className="far fa-calendar-alt"></i>
                      </div>
                      <div className="info-content">
                        <div className="info-label">注册时间</div>
                        <div className="info-value">
                          {user.createdAt
                            ? new Date(user.createdAt).toLocaleDateString('zh-CN')
                            : '未知'}
                        </div>
                      </div>
                    </div>
                    <div className="info-row">
                      <div className="info-icon">
                        <i className="fas fa-lock"></i>
                      </div>
                      <div className="info-content">
                        <div className="info-label">登录密码</div>
                        <div className="info-value">********</div>
                      </div>
                      <button className="btn-outline-sm" onClick={() => setShowPasswordModal(true)}>
                        修改
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="profile-edit">
                    <div className="avatar-section">
                      <div className="avatar" onClick={handleAvatarClick}>
                        <i className="fas fa-user-astronaut"></i>
                      </div>
                    </div>
                    <div className="info-row">
                      <div className="info-icon">
                        <i className="fas fa-user"></i>
                      </div>
                      <div className="info-content-editing">
                        <div className="info-label">用户名</div>
                        <input
                          type="text"
                          {...registerEdit('username')}
                        />
                        {registerEdit('username').error && (
                          <div className="field-error">{registerEdit('username').error}</div>
                        )}
                      </div>
                    </div>
                    <div className="info-row">
                      <div className="info-icon">
                        <i className="fas fa-envelope"></i>
                      </div>
                      <div className="info-content-editing">
                        <div className="info-label">邮箱</div>
                        <input
                          type="email"
                          {...registerEdit('email')}
                        />
                        {registerEdit('email').error && (
                          <div className="field-error">{registerEdit('email').error}</div>
                        )}
                      </div>
                    </div>
                    <div className="info-row">
                      <div className="info-icon">
                        <i className="fas fa-phone"></i>
                      </div>
                      <div className="info-content-editing">
                        <div className="info-label">手机号</div>
                        <input
                          type="tel"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          placeholder="未设置"
                        />
                      </div>
                    </div>
                    <div className="edit-actions">
                      <button className="btn-secondary-sm" onClick={handleCancel}>
                        取消
                      </button>
                      <button className="btn-primary-sm" onClick={handleSave}>
                        保存
                      </button>
                    </div>
                  </div>
                )}
              </Card>

              {/* 学习统计 */}
              <Card className="info-card">
                <div className="profile-section-title">
                  <div className="profile-section-title-left">
                    <i className="fas fa-chart-line"></i> 学习统计
                  </div>
                </div>
                <div className="stats-grid">
                  <div className="stat-item" onClick={() => handleStatClick('activePlansCard')}>
                    <div className="stat-number">{stats?.completedTasks ?? 0}</div>
                    <div className="stat-label">完成任务</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">{stats?.studyDays ?? 0}</div>
                    <div className="stat-label">学习天数</div>
                  </div>
                  <div className="stat-item" onClick={() => handleStatClick('achievementsCard')}>
                    <div className="stat-number">{stats?.unlockedAchievements ?? 0}</div>
                    <div className="stat-label">获得成就</div>
                  </div>
                  <div className="stat-item" onClick={() => handleStatClick('goalsCard')}>
                    <div className="stat-number">{stats?.totalGoals ?? 0}</div>
                    <div className="stat-label">历史目标</div>
                  </div>
                </div>
              </Card>
            </div>

            {/* 右侧栏 */}
            <div className="right-content">
              {/* 进行中的计划 */}
              <div id="activePlansCard">
                <Card className="info-card">
                  <div className="profile-section-title">
                    <div className="profile-section-title-left">
                      <i className="fas fa-rocket"></i> 进行中的计划
                    </div>
                  </div>
                  {activePlans.length === 0 ? (
                    <div className="goal-empty">
                      <i className="fas fa-rocket"></i>
                      <p>暂无进行中的学习计划</p>
                      <Link to="/consult">开始新的学习</Link>
                    </div>
                  ) : (
                    <>
                      <div className="batch-tabs">
                        {activePlans.map((plan) => (
                          <div
                            key={plan.id}
                            className={`batch-tab ${plan.id === selectedPlanId ? 'active' : ''}`}
                            onClick={() => handleSwitchBatch(plan.id)}
                          >
                            {plan.name}
                          </div>
                        ))}
                      </div>
                      {selectedPlan && (
                        <div className="batch-detail">
                          <div className="batch-detail-header">
                            <div className="batch-detail-title">{selectedPlan.name}</div>
                            <div className="batch-detail-meta">
                              <span>
                                <i
                                  className="fas fa-circle"
                                  style={{ color: 'var(--accent)', fontSize: '0.5rem' }}
                                ></i>{' '}
                                进行中
                              </span>
                              <span>
                                <i className="fas fa-tasks"></i>{' '}
                                {selectedPlan.completedTasks}/{selectedPlan.totalTasks} 任务
                              </span>
                            </div>
                          </div>
                          <div className="batch-progress">
                            <div className="batch-progress-bar">
                              <div
                                className="batch-progress-fill"
                                style={{ width: `${selectedPlanProgress}%` }}
                              ></div>
                            </div>
                            <div className="batch-progress-text">{selectedPlanProgress}%</div>
                          </div>
                          <div className="timeline-wrapper batch-timeline">
                            {selectedPlan.weeks.map((week) => (
                              <div
                                key={week.weekNum}
                                className={`timeline-item ${week.active ? 'active' : ''}`}
                              >
                                <div className="timeline-marker"></div>
                                <div className="timeline-date">
                                  {week.active
                                    ? `第 ${week.weekNum} 周 · 进行中`
                                    : `第 ${week.weekNum} 周 · ${week.date}`}
                                </div>
                                <div className="timeline-title">{week.title}</div>
                                <div className="timeline-desc">
                                  {week.completed}/{week.total} 任务完成
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="batch-footer">
                            <Link to="/tasks" className="batch-action-btn">
                              <i className="fas fa-play"></i> 继续学习
                            </Link>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </Card>
              </div>

              {/* 成就展示 */}
              <div id="achievementsCard">
                <Card className="info-card">
                  <div className="profile-section-title">
                    <div className="profile-section-title-left">
                      <i className="fas fa-award"></i> 成就展示
                    </div>
                  </div>
                  <div className="achievement-progress">
                    <div className="progress-header">
                      <span>成就进度</span>
                      <span>
                        {unlockedAchievements} / {achievementsData.length}
                      </span>
                    </div>
                    <div className="profile-progress-bar">
                      <div
                        className="profile-progress-fill"
                        style={{
                          width: `${
                            achievementsData.length > 0
                              ? Math.round((unlockedAchievements / achievementsData.length) * 100)
                              : 0
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="achievement-list">
                    {achievementsData.map((ach) => (
                      <div
                        key={ach.id}
                        className={`achievement-badge ${ach.unlocked ? 'unlocked' : 'locked'}`}
                        onClick={() => handleShowAchievement(ach)}
                      >
                        <i className={`fas ${ach.unlocked ? ach.icon : 'fa-lock'}`}></i>
                        <span>{ach.name}</span>
                      </div>
                    ))}
                  </div>
                  <div className="achievement-hint">
                    {nextAchievement
                      ? `下一个成就「${nextAchievement.name}」等待解锁`
                      : '恭喜！你已解锁所有成就'}
                  </div>
                </Card>
              </div>

              {/* 历史学习目标 */}
              <div id="goalsCard">
                <Card className="info-card">
                  <div className="profile-section-title">
                    <div className="profile-section-title-left">
                      <i className="fas fa-flag-checkered"></i> 历史学习目标
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                      点击目标查看详情
                    </span>
                  </div>
                  {goals.length === 0 ? (
                    <div className="goal-empty">
                      <i className="far fa-folder-open"></i>
                      <p>暂无历史学习目标</p>
                      <Link to="/consult">制定学习计划</Link>
                    </div>
                  ) : (
                    goals.map((goal) => (
                      <div
                        key={goal.id}
                        className="goal-item"
                      >
                        <div className="goal-info" onClick={() => handleShowGoal(goal)}>
                          <div className="goal-name">{goal.name}</div>
                          <div className="goal-meta">
                            <span>
                              <i className="far fa-calendar-alt"></i> {goal.period}
                            </span>
                            <span>
                              <i className="fas fa-check-circle" style={{ color: 'var(--accent)' }}></i>{' '}
                              已完成
                            </span>
                            <span>
                              <i className="fas fa-tasks"></i> {goal.completedTasks}个任务
                            </span>
                          </div>
                        </div>
                        <div className="goal-actions">
                          <button
                            className="goal-action-btn delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteGoal(goal.id);
                            }}
                            title="删除目标"
                          >
                            <i className="fas fa-trash-alt"></i>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 成就/目标详情弹窗 */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modal.type === 'achievement' ? modal.data.name : '学习目标详情'}</h3>
              <button className="modal-close" onClick={() => setModal(null)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              {modal.type === 'achievement' && (
                <>
                  <div className="modal-icon">
                    <i className={`fas ${modal.data.icon}`}></i>
                  </div>
                  <div className="detail-title">{modal.data.name}</div>
                  <div className="detail-desc">
                    {modal.data.unlocked ? '已完成此成就' : '尚未解锁，继续加油！'}
                  </div>
                </>
              )}
              {modal.type === 'goal' && (
                <>
                  <div className="detail-title">{modal.data.name}</div>
                  <div className="detail-subtitle">
                    <i className="far fa-calendar-alt"></i> {modal.data.period}
                  </div>
                  <div className="detail-desc">{modal.data.desc}</div>
                  <div className="detail-progress-box">
                    <div className="detail-progress-header">
                      <span>学习进度</span>
                      <span>100%</span>
                    </div>
                    <div className="profile-progress-bar">
                      <div className="profile-progress-fill" style={{ width: '100%' }}></div>
                    </div>
                    <div className="detail-progress-tasks">
                      <i className="fas fa-tasks"></i> 完成任务: {modal.data.completedTasks}/
                      {modal.data.totalTasks}
                    </div>
                  </div>
                  <div className="detail-date">
                    <i className="far fa-calendar-alt"></i> 完成于 {modal.data.date}
                  </div>
                  <div className="detail-congrats">
                    <i className="fas fa-trophy"></i> 恭喜完成此学习目标！
                  </div>
                </>
              )}
            </div>
            <button className="modal-btn" onClick={() => setModal(null)}>
              关闭
            </button>
          </div>
        </div>
      )}

      {/* 修改密码弹窗 */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={handleClosePasswordModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>修改密码</h3>
              <button className="modal-close" onClick={handleClosePasswordModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>当前密码</label>
                <input
                  type="password"
                  className={`form-input ${registerPassword('oldPassword').error ? 'error' : ''}`}
                  {...registerPassword('oldPassword')}
                />
                {registerPassword('oldPassword').error && (
                  <div className="field-error">{registerPassword('oldPassword').error}</div>
                )}
              </div>
              <div className="form-group">
                <label>新密码</label>
                <input
                  type="password"
                  className={`form-input ${registerPassword('newPassword').error ? 'error' : ''}`}
                  {...registerPassword('newPassword')}
                />
                {registerPassword('newPassword').error && (
                  <div className="field-error">{registerPassword('newPassword').error}</div>
                )}
              </div>
              <div className="form-group">
                <label>确认新密码</label>
                <input
                  type="password"
                  className={`form-input ${registerPassword('confirmPassword').error || confirmPasswordError ? 'error' : ''}`}
                  {...registerPassword('confirmPassword')}
                />
                {registerPassword('confirmPassword').error && (
                  <div className="field-error">{registerPassword('confirmPassword').error}</div>
                )}
                {confirmPasswordError && !registerPassword('confirmPassword').error && (
                  <div className="field-error">{confirmPasswordError}</div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleClosePasswordModal}>
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
