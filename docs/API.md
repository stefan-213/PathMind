# PathMind API 接口文档

> 本文档涵盖 PathMind 项目所有后端 API 接口说明

---

## 目录

- [认证模块 (auth)](#认证模块-auth)
- [会话对话模块 (conversation)](#会话对话模块-conversation)
- [学习任务模块 (tasks)](#学习任务模块-tasks)
- [类型定义](#类型定义)

---

## 认证模块 (auth)

### 登录

```
POST /api/auth/login
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |

**响应数据：** `string` (token 字符串，可能是 "Bearer xxx" 格式)

---

### 注册

```
POST /api/auth/register
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |
| email | string | 是 | 邮箱 |
| phone | string | 否 | 手机号 |

**响应数据：**

```typescript
{
  user: User;
  token: string;
}
```

---

### 退出登录

```
POST /api/user/quitLogin
```

**响应数据：** `void`

---

### 获取当前用户信息

```
GET /api/user/info
```

**响应数据：** `User`

---

### 更新用户信息

```
POST /api/auth/update
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 否 | 用户名 |
| email | string | 否 | 邮箱 |
| phone | string | 否 | 手机号 |

**响应数据：** `User`

---

### 修改密码

```
POST /api/auth/change-password
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| oldPassword | string | 是 | 旧密码 |
| newPassword | string | 是 | 新密码 |

**响应数据：** `void`

---

## 会话对话模块 (conversation)

### 获取智能体列表

```
GET /api/agent/list
```

**响应数据：**

```typescript
{
  code: string;     // 状态码，"200" 表示成功
  info: string;     // 信息
  data: Array<{
    agentId: string;    // 智能体 ID
    agentName: string;  // 智能体名称
    agentDesc: string;  // 智能体描述
  }>;
}
```

---

### 创建 AI 对话会话

```
POST /api/agent/createSession
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| agentId | string | 是 | 智能体 ID（默认 100001） |

**响应数据：**

```typescript
{
  code: string;     // 状态码
  info: string;     // 信息
  data: {
    sessionId: string;  // 会话 ID
  };
}
```

---

### 流式对话（AI 助手）

```
POST /api/agent/chatStream
```

> **注意**：后端返回流式数据 (`text/event-stream`)

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| agentId | string | 是 | 智能体 ID |
| sessionId | string | 是 | 会话 ID |
| message | string | 是 | 用户消息 |

**响应数据：**

```typescript
{
  message: string;           // AI 回复消息
  graphData?: GraphData;     // 图表数据（可选）
}
```

---

### 普通对话（AI 助手）

```
POST /api/agent/chat
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| agentId | string | 是 | 智能体 ID |
| sessionId | string | 是 | 会话 ID |
| message | string | 是 | 用户消息 |

**响应数据：**

```typescript
{
  message: string;           // AI 回复消息
  graphData?: GraphData;     // 图表数据（可选）
}
```

---

### 用户咨询助手

```
POST /api/agent/consultation
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| agentId | string | 否 | 智能体 ID |
| sessionId | string | 否 | 会话 ID |
| message | string | 是 | 用户消息 |

**响应数据：**

```typescript
{
  message: string;           // AI 回复消息
}
```

---

### 图表助手（生成 XML）

```
POST /api/agent/charts
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| agentId | string | 否 | 智能体 ID |
| sessionId | string | 否 | 会话 ID |
| consultationMsg | object | 是 | 咨询信息 |
| consultationMsg.goal | string | 是 | 学习目标 |
| consultationMsg.base | string | 是 | 基础情况 |

**响应数据：**

```typescript
{
  message: string;           // AI 回复消息
}
```

---

### 创建会话（咨询流程）

```
POST /api/consult/sessions
```

**响应数据：**

```typescript
{
  id: string;                 // 会话 ID
  title: string;              // 会话标题
  createdAt: string;         // 创建时间
  messages: ConsultMessage[]; // 消息列表
  userProfile: ConsultUserProfile;  // 用户画像
  currentStep: string;        // 当前步骤
  finalXml: string;           // 最终图表 XML
  planDetails: PlanDetail[];  // 计划详情
}
```

---

### 获取会话列表

```
GET /api/consult/sessions
```

**响应数据：** `ConsultSession[]`

---

### 获取单个会话

```
GET /api/consult/sessions/:sessionId
```

**响应数据：** `ConsultSession`

---

### 删除会话

```
POST /api/consult/sessions/:sessionId/delete
```

**响应数据：** `void`

---

### 更新会话标题

```
POST /api/consult/sessions/:sessionId/title
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 是 | 新标题 |

**响应数据：** `ConsultSession`

---

### 发送对话消息（咨询流程 / 流式返回）

```
POST /api/consult/chat
```

> **注意**：后端返回流式数据 (`text/event-stream`)

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| sessionId | string | 是 | 会话 ID |
| message | string | 是 | 用户消息 |
| step | string | 是 | 当前步骤 |
| profile | object | 是 | 用户画像 |

**响应数据：**

```typescript
{
  message: string;             // AI 回复消息
  isHtml: boolean;            // 是否为 HTML 格式
  nextStep: string;           // 下一步骤
  updatedProfile: ConsultUserProfile;  // 更新后的用户画像
  finalXml?: string;           // 图表 XML（RESULT 步骤时返回）
  planDetails?: PlanDetail[]; // 计划详情（RESULT 步骤时返回）
}
```

---

### 获取对话历史

```
GET /api/consult/sessions/:sessionId/history
```

**响应数据：** `AIChatMessage[]`

---

### 生成图表

```
POST /api/consult/generate-chart
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| sessionId | string | 是 | 会话 ID |
| profile | object | 是 | 用户画像 |

**响应数据：**

```typescript
{
  finalXml: string;           // 图表 XML
  planDetails: PlanDetail[];  // 计划详情
}
```

---

### 重新生成图表

```
POST /api/consult/sessions/:sessionId/regenerate-chart
```

**响应数据：**

```typescript
{
  finalXml: string;           // 图表 XML
  planDetails: PlanDetail[];  // 计划详情
}
```

---

### 从图表生成计划表

```
POST /api/consult/sessions/:sessionId/generate-plan
```

**响应数据：**

```typescript
{
  planDetails: PlanDetail[];  // 计划详情
}
```

---

## 学习任务模块 (tasks)

### 获取用户任务

```
GET /api/tasks
```

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| goalId | string | 否 | 目标 ID |
| status | string | 否 | 任务状态，`pending` 或 `completed` |

**响应数据：** `PaginatedResponse<UserTask> | UserTask[]`

---

### 获取单个任务

```
GET /api/tasks/:id
```

**响应数据：** `UserTask`

---

### 批量创建任务

```
POST /api/tasks
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| goalId | string | 是 | 目标 ID |
| schedule | array | 是 | 学习计划 schedule: Array<{ week: string; items: string[] }> |

**响应数据：** `UserTask[]`

---

### 更新任务

```
PUT /api/tasks/:id
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | string | 否 | 任务状态，`completed` 或 `pending` |

**响应数据：** `UserTask`

---

### 删除任务

```
DELETE /api/tasks/:id
```

**响应数据：** `void`

---

### 获取学习进度

```
GET /api/progress
```

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| goalId | string | 否 | 目标 ID |

**响应数据：** `UserProgress`

---

## 类型定义

### User

```typescript
interface User {
  id: string;          // 用户 ID
  email: string;       // 邮箱
  username: string;     // 用户名
  phone?: string;      // 手机号
  avatar?: string;     // 头像 URL
  role: string;        // 角色
  status: string;       // 状态
  createdAt: string;    // 创建时间
  updatedAt: string;    // 更新时间
}
```

### UserTask

```typescript
interface UserTask {
  id: string;           // 任务 ID
  userId: string;        // 用户 ID
  goalId: string;       // 目标 ID
  week: string;          // 周期（如"第1周"）
  day: string;           // 天数（如"Day1"）
  title: string;         // 任务标题
  description?: string;  // 任务描述
  status: 'pending' | 'completed';  // 状态
  order: number;         // 排序
  createdAt: string;     // 创建时间
  completedAt?: string;  // 完成时间
}
```

### UserProgress

```typescript
interface UserProgress {
  id: string;           // 进度 ID
  userId: string;        // 用户 ID
  goalId: string;        // 目标 ID
  completedTasks: number; // 已完成任务数
  totalTasks: number;    // 总任务数
  percentage: number;     // 完成百分比
  lastActiveDate: string; // 最后活跃日期
  streak: number;         // 连续学习天数
}
```

### ConsultUserProfile

```typescript
interface ConsultUserProfile {
  goal: string;         // 学习目标
  experience: string;    // 技术经验
  timeframe: string;     // 学习时间周期
  scale: string;         // 项目规模
}
```

### PlanDetail

```typescript
interface PlanDetail {
  week: string;          // 周期（如"第1周"）
  items: string[];       // 学习内容列表
}
```

### ConsultSession

```typescript
interface ConsultSession {
  id: string;                    // 会话 ID
  title: string;                  // 会话标题
  createdAt: string;              // 创建时间
  messages: ConsultMessage[];     // 消息列表
  userProfile: ConsultUserProfile; // 用户画像
  currentStep: string;             // 当前步骤
  finalXml: string;               // 最终图表 XML
  planDetails: PlanDetail[];       // 计划详情
}
```

### ConsultMessage

```typescript
interface ConsultMessage {
  role: 'user' | 'assistant';  // 消息角色
  content: string;             // 消息内容
  isHtml?: boolean;            // 是否为 HTML
  timestamp: number;           // 时间戳
}
```

### AIChatMessage

```typescript
interface AIChatMessage {
  id: string;                  // 消息 ID
  role: 'user' | 'assistant';  // 消息角色
  content: string;             // 消息内容
  createdAt: string;           // 创建时间
}
```

### ApiResponse (通用响应)

```typescript
interface ApiResponse<T> {
  success: boolean;   // 是否成功
  data?: T;           // 响应数据
  error?: string;     // 错误信息
  message?: string;   // 提示信息
}
```

### PaginatedResponse (分页响应)

```typescript
interface PaginatedResponse<T> {
  items: T[];         // 数据列表
  total: number;      // 总数
  page: number;       // 当前页
  pageSize: number;   // 每页数量
  totalPages: number; // 总页数
}
```

---

## Mock 开关配置

在 `src/api/useApi.ts` 中可以独立控制各模块使用 Mock 或真实 API：

```typescript
const MOCK_AUTH = false;         // 登录/注册
const MOCK_TASKS = true;         // 学习任务
const MOCK_CONVERSATION = true;  // 会话对话
const MOCK_GRAPH = true;         // 图表操作
```

设为 `true` 使用 Mock API，设为 `false` 使用真实后端接口。
