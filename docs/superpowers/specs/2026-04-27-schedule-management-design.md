# 日程表管理功能设计

## 概述

将日程表管理从前端解析 charts 接口数据的方式，改为直接调用后端日程表接口管理。日程表与用户个人中心绑定，支持在个人页面展示和删除。

## 用户流程

1. **创建日程**: 用户在 GraphPage 点击"满意"后，自动调用 `/api/schedule/createBatch` 创建日程表，获取 scheduleId，然后跳转到 TasksPage
2. **查看/编辑日程**: TasksPage 挂载时自动调用 `/api/schedule/list` 获取日程列表，并加载日程内容
3. **管理日程**: ProfilePage 显示用户所有日程表标题列表，支持删除

## API 接口

| 操作 | 方法 | 路径 | 描述 |
|------|------|------|------|
| 创建日程表 | POST | /api/schedule/createBatch | GraphPage 满意后调用 |
| 获取日程表列表 | GET | /api/schedule/list | TasksPage/ProfilePage 挂载时调用 |
| 获取日程表内容 | POST | /api/schedule/get | TasksPage 挂载时自动获取 |
| 更新日程表 | POST | /api/schedule/update | TasksPage 编辑保存 |
| 删除日程表 | POST | /api/schedule/delete | ProfilePage 删除按钮 |

## 页面改动

### GraphPage
- 点击"满意"按钮后：
  1. 调用 `createBatch` 接口创建日程表
  2. 获取返回的 scheduleId
  3. 跳转到 TasksPage（传递 scheduleId 或在 TasksPage 重新加载）

### TasksPage
- 挂载时调用 `list` 获取日程表列表
- 自动调用 `get` 获取日程表内容（可批量获取）
- 支持编辑后调用 `update` 保存
- 支持切换查看不同日程表

### ProfilePage
- 新增日程表展示区域
- 显示日程表标题列表
- 每个日程表标题旁有删除按钮
- 点击删除按钮调用 `delete` 接口

## 数据结构

```typescript
interface Schedule {
  id: number;
  scheduleId: string;
  userId: string;
  title: string;
  time: string;
  content: string;
  status: number;
  subScheduleList: SubSchedule[];
}

interface SubSchedule {
  id?: number;
  parentId?: number;
  day: string;
  task: string;
  taskGoal: string;
  description?: string | null;
  status: number;  // 0: pending, 1: completed
  completedAt?: string | null;
}
```

## 实现顺序

1. 更新 tasksStore 添加日程表状态管理
2. 添加日程表相关 API 接口调用
3. 修改 GraphPage 实现创建逻辑
4. 修改 TasksPage 实现加载和展示
5. 修改 ProfilePage 添加日程表展示和删除功能
