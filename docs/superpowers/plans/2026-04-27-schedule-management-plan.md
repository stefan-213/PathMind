# 日程表管理功能实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将日程表从前端解析 charts 接口数据改为直接调用后端 API 管理，并与个人中心绑定

**Architecture:**
- GraphPage: 用户点击"满意"后调用 createBatch API 创建日程表
- TasksPage: 挂载时调用 list + get 接口获取并展示日程表内容
- ProfilePage: 新增日程表列表展示区域，支持删除

**Tech Stack:** React, TypeScript, Zustand, React Router

---

## 文件结构

```
src/
├── api/tasks.ts                    # 日程表 API（已存在）
├── stores/scheduleStore.ts        # 新建：日程表状态管理
├── pages/Graph/AISidePanel.tsx     # 修改：满意按钮添加创建日程逻辑
├── pages/Tasks/TasksPage.tsx      # 修改：改为从 API 加载日程
├── pages/Profile/ProfilePage.tsx  # 修改：新增日程表展示和删除
└── types/api.ts                   # 已有时程表类型定义
```

---

## Task 1: 创建 scheduleStore 状态管理

**Files:**
- Create: `src/stores/scheduleStore.ts`

- [ ] **Step 1: 创建 store 文件**

```typescript
// src/stores/scheduleStore.ts
import { create } from 'zustand';
import type { Schedule } from '../types/api';

interface ScheduleStore {
  schedules: Schedule[];
  currentSchedule: Schedule | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setSchedules: (schedules: Schedule[]) => void;
  setCurrentSchedule: (schedule: Schedule | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addSchedule: (schedule: Schedule) => void;
  removeSchedule: (scheduleId: string) => void;
  clearSchedules: () => void;
}

export const useScheduleStore = create<ScheduleStore>((set) => ({
  schedules: [],
  currentSchedule: null,
  isLoading: false,
  error: null,

  setSchedules: (schedules) => set({ schedules }),
  setCurrentSchedule: (schedule) => set({ currentSchedule: schedule }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  addSchedule: (schedule) =>
    set((state) => ({ schedules: [...state.schedules, schedule] })),
  removeSchedule: (scheduleId) =>
    set((state) => ({
      schedules: state.schedules.filter((s) => s.scheduleId !== scheduleId),
    })),
  clearSchedules: () => set({ schedules: [], currentSchedule: null }),
}));
```

- [ ] **Step 2: 提交**

```bash
git add src/stores/scheduleStore.ts
git commit -m "feat: 添加日程表状态管理 store"
```

---

## Task 2: 修改 AISidePanel.tsx 实现创建日程表逻辑

**Files:**
- Modify: `src/pages/Graph/AISidePanel.tsx`

- [ ] **Step 1: 添加 import 和 API 调用**

在文件顶部添加：
```typescript
import { useNavigate } from 'react-router-dom';
import { createTask, getScheduleList, getScheduleContent } from '../../api/tasks';
import { useScheduleStore } from '../../stores/scheduleStore';
```

- [ ] **Step 2: 添加 navigate 和 store**

在组件内添加：
```typescript
const navigate = useNavigate();
const { addSchedule } = useScheduleStore();
```

- [ ] **Step 3: 修改满意按钮点击处理**

将 `setSatisfactionState('satisfied')` 改为：

```typescript
const handleSatisfied = async () => {
  setSatisfactionState('satisfied');

  // 从 localStorage 获取计划数据并创建日程表
  const planDataStr = localStorage.getItem('pathmind_plan_data');
  if (planDataStr) {
    try {
      const planData = JSON.parse(planDataStr);
      // 转换为 CreateScheduleRequest 格式
      const scheduleItems = planData.map((item: any) => ({
        title: item.title || '',
        time: item.time || '',
        content: item.content || '',
        tasks: item.details ? item.details.split(/[；]/).map((task: string, idx: number) => ({
          day: `第${idx + 1}天`,
          task: task.trim(),
          taskGoal: '',
          status: 0,
        })) : [],
      }));

      await createTask({ data: scheduleItems });

      // 清空 localStorage
      localStorage.removeItem('pathmind_plan_data');
      localStorage.removeItem('pathmind_consult_chart');
    } catch (err) {
      console.error('创建日程表失败:', err);
    }
  }

  // 跳转到 Tasks 页面
  navigate('/tasks');
};
```

- [ ] **Step 4: 绑定满意按钮点击事件**

将 `onClick={() => setSatisfactionState('satisfied')}` 改为 `onClick={handleSatisfied}`

- [ ] **Step 5: 提交**

```bash
git add src/pages/Graph/AISidePanel.tsx
git commit -m "feat: GraphPage 满意按钮添加创建日程表逻辑"
```

---

## Task 3: 修改 TasksPage.tsx 实现从 API 加载日程

**Files:**
- Modify: `src/pages/Tasks/TasksPage.tsx`

- [ ] **Step 1: 更新 import**

```typescript
import { getScheduleList, getScheduleContent } from '../../api/tasks';
import { useScheduleStore } from '../../stores/scheduleStore';
import type { Schedule } from '../../types/api';
```

- [ ] **Step 2: 添加 store 状态和加载逻辑**

在组件内：
```typescript
const { schedules, currentSchedule, setSchedules, setCurrentSchedule, setLoading, isLoading } = useScheduleStore();

useEffect(() => {
  loadSchedules();
}, []);

const loadSchedules = async () => {
  setLoading(true);
  try {
    // 获取日程表列表
    const listRes = await getScheduleList();
    setSchedules(listRes);

    if (listRes && listRes.length > 0) {
      // 获取第一个日程表的内容
      const firstSchedule = listRes[0];
      const contentRes = await getScheduleContent(firstSchedule.scheduleId);
      if (contentRes && contentRes.length > 0) {
        setCurrentSchedule(contentRes[0]);
      }
    }
  } catch (err) {
    console.error('加载日程表失败:', err);
  } finally {
    setLoading(false);
  }
};
```

- [ ] **Step 3: 移除本地存储解析逻辑**

删除 `loadData` 函数中解析 `pathmind_plan_data` 的代码块（行 28-79），保留 else 分支直接调用 API

- [ ] **Step 4: 使用 currentSchedule 渲染任务列表**

将原来的 `tasks` 状态改为使用 `currentSchedule.subScheduleList`：
```typescript
const tasks = currentSchedule?.subScheduleList || [];
```

- [ ] **Step 5: 添加切换日程表的 UI（如有多个）**

在页面顶部添加日程表选择器：
```typescript
{schedules.length > 1 && (
  <div className="schedule-selector">
    <select
      value={currentSchedule?.scheduleId || ''}
      onChange={(e) => {
        const selected = schedules.find(s => s.scheduleId === e.target.value);
        if (selected) {
          getScheduleContent(selected.scheduleId).then(res => {
            if (res && res.length > 0) setCurrentSchedule(res[0]);
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
```

- [ ] **Step 6: 提交**

```bash
git add src/pages/Tasks/TasksPage.tsx
git commit -m "feat: TasksPage 改为从 API 加载日程表"
```

---

## Task 4: 修改 ProfilePage.tsx 添加日程表展示和删除

**Files:**
- Modify: `src/pages/Profile/ProfilePage.tsx`

- [ ] **Step 1: 添加 import**

```typescript
import { getScheduleList, deleteSchedule } from '../../api/tasks';
import { useScheduleStore } from '../../stores/scheduleStore';
import type { Schedule } from '../../types/api';
```

- [ ] **Step 2: 添加状态**

```typescript
const { schedules, setSchedules, removeSchedule } = useScheduleStore();
```

- [ ] **Step 3: 在 useEffect 中加载日程表列表**

在现有的 `useEffect` 中添加：
```typescript
useEffect(() => {
  const userProfile = getUserProfile();
  const userTasks = getUserTasks();
  const userProgress = getUserProgress();
  setProfile(userProfile);
  setTasks(userTasks);
  setProgress(userProgress);

  // 加载日程表列表
  loadSchedules();
}, []);

const loadSchedules = async () => {
  try {
    const list = await getScheduleList();
    setSchedules(list);
  } catch (err) {
    console.error('加载日程表列表失败:', err);
  }
};
```

- [ ] **Step 4: 添加删除处理函数**

```typescript
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
```

- [ ] **Step 5: 在任务记录卡片后添加日程表列表卡片**

在 `task-records-card` 之后添加：

```tsx
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
```

- [ ] **Step 6: 提交**

```bash
git add src/pages/Profile/ProfilePage.tsx
git commit -m "feat: ProfilePage 添加日程表展示和删除功能"
```

---

## 验证检查清单

- [ ] GraphPage 点击满意后调用 createBatch API 成功
- [ ] TasksPage 挂载时自动加载日程表列表和内容
- [ ] ProfilePage 显示所有日程表标题
- [ ] ProfilePage 删除按钮正常工作
- [ ] 页面间跳转正常

---

**Plan 完毕，保存至 `docs/superpowers/plans/2026-04-27-schedule-management-plan.md`**
