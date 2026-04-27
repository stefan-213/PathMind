# PathMind - AI 技术选型与学习路径规划平台

## 项目简介

PathMind 是一个帮助开发者进行**技术选型和学习路径规划**的 AI 工具。通过对话形式了解用户需求，生成定制化的技术方案和学习计划。

---

## 路由结构

| 路径        | 页面         | 说明       | 权限                     |
| ----------- | ------------ | ---------- | ------------------------ |
| `/`         | HomePage     | 首页       | 公开                     |
| `/login`    | LoginPage    | 登录       | 公开（已登录重定向首页） |
| `/register` | RegisterPage | 注册       | 公开（已登录重定向首页） |
| `/consult`  | ConsultPage  | AI Copilot | 需要登录                 |
| `/graph`    | GraphPage    | 知识图表   | 需要登录                 |
| `/tasks`    | TasksPage    | 任务中心   | 需要登录                 |
| `/profile`  | ProfilePage  | 个人中心   | 需要登录                 |

---

## 已实现功能

### 1. 首页 (HomePage)

**功能描述**：展示产品核心价值，引导用户开始使用

**已实现**：

- 产品定位 banner（"帮你实现目标的 AI 工具"）
- 简单三步骤展示
- 六大功能卡片展示
- 常见问题 FAQ 折叠面板
- 最终 CTA 引导转化
- 产品截图展示

**相关文件**：[HomePage.tsx](src/pages/Home/HomePage.tsx)

---

### 2. AI Copilot (ConsultPage)

**功能描述**：多轮对话式 AI 顾问，生成专属技术路线图和执行计划

**已实现**：

#### 2.1 真实 API 对接

- 调用 `/api/agent/list` -> `/api/agent/createSession` -> `/api/agent/consultation`
- 支持会话持久化（服务器端会话管理）

#### 2.2 对话式问卷流程

- 多轮对话收集用户信息（目标、经验、时间、规模）
- 快捷选项标签快速选择
- AI 思考过程可展开查看
- Enter 发送，Shift+Enter 换行

#### 2.3 多会话管理

- 侧边栏展示历史对话列表
- 支持新建、切换、删除会话
- 会话数据服务器持久化

#### 2.4 方案生成与交互

- 根据用户画像动态生成技术栈建议
- 生成学习路线图数据
- 支持查看知识图表、重新生成方案
- 方案数据自动传递到 GraphPage

**相关文件**：

- [ConsultPage.tsx](src/pages/Consult/ConsultPage.tsx)
- [conversation.ts](src/api/conversation.ts)
- [useApi.ts](src/api/useApi.ts)

---

### 3. 知识图表 (GraphPage)

**功能描述**：可视化技术节点关系，支持 AI 生成图表

**已实现**：

#### 3.1 图表展示

- 集成 draw.io / mxGraph 图表渲染
- 支持拖拽、缩放操作
- 通过 `mockGraphXml` 提供默认图谱

#### 3.2 AI 图谱助手

- AISidePanel 侧边对话面板
- 支持通过对话生成自定义图表
- 可输入需求，AI 返回图表数据

#### 3.3 节点详情

- 点击节点显示详情面板
- 显示节点名称、分类、描述、标签
- 提供"开始学习"快捷入口

**相关文件**：

- [GraphPage.tsx](src/pages/Graph/GraphPage.tsx)
- [GraphCanvas.tsx](src/pages/Graph/GraphCanvas.tsx)
- [AISidePanel.tsx](src/pages/Graph/AISidePanel.tsx)
- [mock.ts](src/api/mock.ts)

---

### 4. 任务中心 (TasksPage)

**功能描述**：展示和管理学习任务进度

**已实现**：

- 进度百分比显示
- 当前学习目标展示
- 按阶段分组的任务列表
- 任务勾选完成状态
- 重新开始功能（清除数据）
- 查看知识图表入口

**相关文件**：

- [TasksPage.tsx](src/pages/Tasks/TasksPage.tsx)
- [storage.ts](src/utils/storage.ts)

---

### 5. 用户认证 (Auth)

**功能描述**：用户注册和登录

#### 5.1 登录页面 (LoginPage)

- 用户名/密码登录
- 记住我功能
- 密码显示/隐藏切换
- 表单验证

#### 5.2 注册页面 (RegisterPage)

- 用户名、邮箱、密码、手机号（选填）
- 密码强度实时检测
- 确认密码校验
- 用户协议同意勾选
- 表单完整验证

#### 5.3 状态管理

- 使用 Zustand authStore 管理认证状态
- 持久化存储（localStorage）
- 受保护路由自动重定向

**相关文件**：

- [LoginPage.tsx](src/pages/Auth/LoginPage.tsx)
- [RegisterPage.tsx](src/pages/Auth/RegisterPage.tsx)
- [authStore.ts](src/stores/authStore.ts)
- [auth.ts](src/api/auth.ts)

---

### 6. 个人中心 (ProfilePage)

**功能描述**：用户个人信息和学习数据管理

**已实现**：

- 用户信息展示与编辑（头像、用户名、邮箱、手机号）
- 安全设置（修改密码弹窗）
- 学习统计数据（完成任务数、总任务数、完成进度）
- 任务记录查看
- 快速跳转到制定计划

**相关文件**：

- [ProfilePage.tsx](src/pages/Profile/ProfilePage.tsx)

---

## API 接口

### 认证相关

| 方法 | 路径                | 说明             |
| ---- | ------------------- | ---------------- |
| POST | /api/auth/login     | 用户登录         |
| POST | /api/auth/register  | 用户注册         |
| POST | /api/auth/update    | 更新用户信息     |
| POST | /api/user/quitLogin | 退出登录         |
| GET  | /api/user/info      | 获取当前用户信息 |

### AI 智能体相关

| 方法 | 路径                      | 说明           |
| ---- | ------------------------- | -------------- |
| GET  | /api/agent/list           | 获取智能体列表 |
| POST | /api/agent/createSession  | 创建对话会话   |
| POST | /api/agent/deleteSession  | 删除对话会话   |
| POST | /api/agent/getSessionList | 获取会话列表   |
| POST | /api/agent/consultation   | 用户咨询       |
| POST | /api/agent/transcript     | 获取会话记录   |
| POST | /api/agent/charts         | 生成图表 XML   |

### 任务相关

| 方法   | 路径           | 说明         |
| ------ | -------------- | ------------ |
| GET    | /api/tasks     | 获取用户任务 |
| GET    | /api/tasks/:id | 获取单个任务 |
| POST   | /api/tasks     | 批量创建任务 |
| PUT    | /api/tasks/:id | 更新任务     |
| DELETE | /api/tasks/:id | 删除任务     |
| GET    | /api/progress  | 获取学习进度 |

---

## 技术栈

| 分类      | 技术                            |
| --------- | ------------------------------- |
| 前端框架  | React 19.2 + React Router DOM 7 |
| 构建工具  | Vite 8 + React Compiler         |
| 类型系统  | TypeScript（严格模式）          |
| 状态管理  | Zustand 5（持久化）             |
| HTTP 请求 | Axios                           |
| 图表渲染  | mxGraph / draw.io               |
| 样式      | SCSS + 设计变量                 |

### 主要依赖

```json
{
  "react": "^19.2.4",
  "react-dom": "^19.2.4",
  "react-router-dom": "^7.13.1",
  "zustand": "^5.0.0",
  "axios": "^1.13.6",
  "d3": "^7.9.0",
  "mxgraph": "^4.2.2",
  "react-drawio": "^1.0.7",
  "react-markdown": "^10.1.0"
}
```

---

## 开发命令

```bash
npm run dev      # 启动开发服务器
npm run build    # TypeScript 检查 + 生产构建
npm run lint     # ESLint 检查
npm run preview  # 预览生产环境
```

---

## 项目结构

```
src/
├── api/                 # API 服务层
│   ├── axios.ts         # Axios 实例和拦截器
│   ├── auth.ts          # 认证 API
│   ├── conversation.ts  # 对话 API
│   ├── graph.ts         # 图表 API
│   ├── tasks.ts         # 任务 API
│   ├── mock.ts          # 模拟数据
│   └── useApi.ts        # API 统一导出
├── components/          # 公共组件
│   ├── common/          # 通用组件（Button, Card, Input...）
│   ├── layout/          # 布局组件（Header, Footer）
│   └── ProtectedRoute.tsx # 路由保护组件
├── pages/               # 页面组件
│   ├── Auth/            # 登录/注册
│   ├── Consult/         # AI Copilot
│   ├── Graph/           # 知识图表
│   ├── Home/            # 首页
│   ├── Profile/         # 个人中心
│   └── Tasks/           # 任务中心
├── routes/              # 路由配置
│   ├── routes.tsx       # 路由定义
│   └── RootLayout.tsx   # 根布局
├── stores/              # Zustand 状态管理
│   ├── authStore.ts     # 认证状态
│   ├── chatStore.ts     # AI 对话状态
│   └── tasksStore.ts    # 任务状态
├── styles/              # 全局样式
│   ├── _variables.scss  # 设计变量
│   ├── _mixins.scss     # 样式混入
│   └── global.scss      # 全局样式
├── types/               # TypeScript 类型定义
│   ├── api.ts           # API 类型
│   ├── copilot.ts       # Copilot 类型
│   └── graph.ts         # 图谱类型
└── utils/               # 工具函数
    └── storage.ts       # localStorage 封装
```

---

## 待实现功能

> 以下功能为后续开发计划

### 1. AI 生成功能增强

- 方案智能优化
- 更丰富的技术对比分析
- 图表数据与后端对接

### 2. 社区功能

- 学习打卡
- 方案分享
- 技术收藏

### 3. 后端扩展

- 真实数据库对接
- 用户学习数据同步

---

_文档版本：1.3_
_最后更新：2026-04-27_
