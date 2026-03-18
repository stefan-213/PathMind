# PathMind - AI 技术选型与学习路径规划平台

## 项目简介

PathMind 是一个帮助开发者进行**技术选型和学习路径规划**的 AI 工具。通过问答形式了解用户需求，生成定制化的技术方案和学习计划。

---

## 已实现功能

### 1. 首页 (HomePage)

**功能描述**：展示产品核心价值，引导用户开始使用

**已实现**：
- 产品定位 banner（"帮你做技术选择的 AI 工具"）
- 三大核心步骤展示
  - 步骤 1：输入目标
  - 步骤 2：问答了解
  - 步骤 3：生成计划
- 六大功能卡片展示
- 统计数据展示（用户数、技术栈数、学习路径数）
- 立即体验 / 查看图谱 按钮跳转

**相关文件**：
- `src/pages/Home/HomePage.tsx`
- `src/pages/Home/HomePage.css`

---

### 2. AI Copilot (CopilotPage)

**功能描述**：核心功能页面，通过问答生成技术方案和学习计划

**已实现**：

#### 2.1 目标输入
- 输入框输入学习/开发目标
- 快捷选项标签（快速选择）：
  - AI 应用
  - 企业官网
  - 电商小程序
  - 前端学习
  - 转型后端

#### 2.2 问卷调查
- 根据目标类型动态加载不同问卷
- 每个问题 2-4 个选项（带图标）
- 支持的目标类型：
  - AI 应用
  - 企业官网
  - 前端学习
  - 默认问卷

#### 2.3 结果展示
- 推荐方案标题和描述
- 主路径（核心技术栈顺序）
- 分支选择（推荐 vs 备选）
- 对比表格（难度、学习周期、市场需求、适合场景）
- 四周学习计划（按周/按日分解）
- 一键跳转按钮：
  - 我的任务
  - 知识图谱
  - 模板项目

**相关文件**：
- `src/pages/Copilot/CopilotPage.tsx`
- `src/pages/Copilot/CopilotPage.css`
- `src/data/copilotData.ts`

---

### 3. 知识图谱 (GraphPage)

**功能描述**：可视化技术节点关系，支持 AI 推荐学习路径

**已实现**：

#### 3.1 图谱展示
- D3.js 力导向图可视化
- 支持拖拽、缩放
- 节点显示技术名称和图标

#### 3.2 分类筛选
- 全部技术
- 前端（React, Vue, Next.js, Vite, Tailwind）
- 后端（Node.js, Python, FastAPI, Express）
- AI（LangChain, RAG, Agent, Embedding）
- DevOps（Docker, Git）
- 基础（HTML, CSS, JavaScript, TypeScript）

#### 3.3 节点详情
- 点击节点显示详情面板
- 显示信息：
  - 难度等级
  - 热度指数
  - 适用场景
  - 技术描述
  - 相关标签

#### 3.4 AI 推荐路径
- 输入目标（如 "AI 应用"）
- 自动计算从起点到目标的核心路径
- 高亮显示路径节点

#### 3.5 控制功能
- 物理效果开关
- 缩放控制

**相关文件**：
- `src/pages/Graph/GraphPage.tsx`
- `src/pages/Graph/GraphPage.css`
- `src/data/graphData.ts`

---

### 4. 任务中心 (TasksPage)

**功能描述**：展示和管理学习任务进度

**已实现**：
- 进度百分比显示
- 当前学习目标展示
- 按周分组的任务列表
- 任务勾选完成状态
- 重新开始功能
- 查看知识图谱入口

**数据模型**：
```typescript
interface Task {
  id: string;
  week: string;
  day: string;
  title: string;
  status: 'pending' | 'completed';
  createdAt: string;
  completedAt?: string;
}

interface UserProgress {
  completedTasks: number;
  totalTasks: number;
  percentage: number;
}
```

**相关文件**：
- `src/pages/Tasks/TasksPage.tsx`
- `src/pages/Tasks/TasksPage.css`

---

### 5. 方案详情 (ProposalPage)

**功能描述**：展示技术方案详细信息

**已实现**：
- 技术方案标题和描述
- 推荐技术栈展示（图标 + 名称 + 角色）
- 技术对比表格
- 分阶段学习路径
- 快速开始指南
- 相关技术标签

**相关文件**：
- `src/pages/Proposal/ProposalPage.tsx`
- `src/pages/Proposal/ProposalPage.css`

---

## 待实现功能（后端开发计划）

> 🚧 以下功能为计划开发的后端功能，标注 🚧 的为高优先级

### 6. 用户认证系统

#### 6.1 用户注册/登录 🚧
- **API 端点**：
  - `POST /api/auth/register` - 用户注册
  - `POST /api/auth/login` - 用户登录
  - `POST /api/auth/logout` - 退出登录
  - `GET /api/auth/me` - 获取当前用户信息

- **数据模型**：
```typescript
interface User {
  id: string;
  email: string;
  username: string;
  password: string; // 加密存储
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}
```

#### 6.2 第三方登录（可选）
- GitHub 登录
- Google 登录

---

### 7. 用户数据持久化 🚧

#### 7.1 保存学习目标
- **API 端点**：
  - `POST /api/goals` - 创建学习目标
  - `GET /api/goals` - 获取用户所有目标
  - `GET /api/goals/:id` - 获取目标详情
  - `PUT /api/goals/:id` - 更新目标
  - `DELETE /api/goals/:id` - 删除目标

- **数据模型**：
```typescript
interface UserGoal {
  id: string;
  userId: string;
  goal: string; // 用户输入的目标文本
  recommendTitle: string; // AI 推荐的技术方案标题
  answers: QuestionAnswer[]; // 问卷答案
  status: 'active' | 'completed' | 'archived';
  createdAt: string;
  updatedAt: string;
}

interface QuestionAnswer {
  questionId: string;
  question: string;
  selectedOption: string;
}
```

#### 7.2 保存学习任务
- **API 端点**：
  - `POST /api/tasks` - 从 AI 生成任务并保存
  - `GET /api/tasks` - 获取用户任务列表
  - `GET /api/tasks/:id` - 获取任务详情
  - `PUT /api/tasks/:id` - 更新任务状态
  - `PUT /api/tasks/:id/complete` - 标记任务完成
  - `DELETE /api/tasks/:id` - 删除任务

- **数据模型**：
```typescript
interface UserTask {
  id: string;
  userId: string;
  goalId: string; // 关联的学习目标
  week: string; // 第几周
  day: string; // 第几天
  title: string;
  description?: string;
  status: 'pending' | 'completed';
  order: number;
  createdAt: string;
  completedAt?: string;
}
```

#### 7.3 保存学习进度
- **API 端点**：
  - `GET /api/progress` - 获取用户进度
  - `GET /api/progress/:goalId` - 获取特定目标的进度

- **数据模型**：
```typescript
interface UserProgress {
  id: string;
  userId: string;
  goalId: string;
  completedTasks: number;
  totalTasks: number;
  percentage: number;
  lastActiveDate: string;
  streak: number; // 连续学习天数
}
```

---

### 8. AI 对话功能 🚧

#### 8.1 AI 生成技术方案
- **API 端点**：
  - `POST /api/ai/generate-proposal` - 根据目标和问卷生成技术方案
  - `POST /api/ai/regenerate` - 重新生成方案

- **请求参数**：
```typescript
interface GenerateProposalRequest {
  goal: string;
  answers: QuestionAnswer[];
  userId?: string;
}
```

- **返回数据**：
```typescript
interface GenerateProposalResponse {
  title: string;
  description: string;
  mainPath: string[]; // 主路径技术栈
  branches: { text: string; recommended: boolean }[];
  comparison: { dimension: string; recommended: string; alternative: string }[];
  schedule: { week: string; items: string[] }[];
}
```

#### 8.2 AI 生成学习任务
- **API 端点**：
  - `POST /api/ai/generate-tasks` - 根据方案生成具体任务

#### 8.3 AI 问答助手
- **API 端点**：
  - `POST /api/ai/chat` - 与 AI 助手对话
  - `GET /api/ai/chat/history` - 获取对话历史

---

### 9. 知识图谱管理 🚧

#### 9.1 技术节点 CRUD
- **API 端点**：
  - `GET /api/technologies` - 获取所有技术节点
  - `GET /api/technologies/:id` - 获取技术详情
  - `POST /api/technologies` - 添加新技术（管理员）
  - `PUT /api/technologies/:id` - 更新技术信息（管理员）
  - `DELETE /api/technologies/:id` - 删除技术（管理员）

- **数据模型**：
```typescript
interface Technology {
  id: string;
  name: string;
  label: string;
  englishName: string;
  category: 'frontend' | 'backend' | 'ai' | 'devops' | 'basic';
  icon: string;
  difficulty: '简单' | '中等' | '高';
  heat: string;
  scene: string;
  description: string;
  tags: string[];
  level: 0 | 1 | 2;
}
```

#### 9.2 技术关系管理
- **API 端点**：
  - `GET /api/technologies/relations` - 获取所有技术关系
  - `POST /api/technologies/relations` - 添加技术关系（管理员）
  - `DELETE /api/technologies/relations/:id` - 删除技术关系（管理员）

- **数据模型**：
```typescript
interface TechnologyRelation {
  id: string;
  sourceId: string;
  targetId: string;
  relationType: '依赖' | '进阶' | '替代' | '组合' | '工具';
}
```

#### 9.3 AI 智能路径推荐
- **API 端点**：
  - `POST /api/ai/recommend-path` - 根据目标推荐学习路径
  - `GET /api/ai/path/:from/:to` - 计算两技术间的路径

---

### 10. 收藏与历史

#### 10.1 收藏技术
- **API 端点**：
  - `POST /api/favorites` - 收藏技术
  - `GET /api/favorites` - 获取收藏列表
  - `DELETE /api/favorites/:id` - 取消收藏

#### 10.2 浏览历史
- **API 端点**：
  - `GET /api/history` - 获取浏览历史
  - `POST /api/history` - 添加浏览记录
  - `DELETE /api/history` - 清除历史

---

### 11. 社区功能（可选）

#### 11.1 学习打卡
- **API 端点**：
  - `POST /api/checkin` - 每日打卡
  - `GET /api/checkin/stats` - 获取打卡统计

#### 11.2 分享方案
- **API 端点**：
  - `POST /api/share` - 分享技术方案
  - `GET /api/share/:id` - 查看分享的方案
  - `GET /api/share/popular` - 获取热门分享

---

## 数据库设计建议

### 用户表 (users)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 学习目标表 (goals)
```sql
CREATE TABLE goals (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  goal_text TEXT NOT NULL,
  recommend_title VARCHAR(255),
  answers JSONB,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 学习任务表 (tasks)
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  goal_id UUID REFERENCES goals(id),
  week VARCHAR(20) NOT NULL,
  day VARCHAR(20) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  task_order INT,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);
```

### 技术节点表 (technologies)
```sql
CREATE TABLE technologies (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  label VARCHAR(100) NOT NULL,
  english_name VARCHAR(100),
  category VARCHAR(20) NOT NULL,
  icon VARCHAR(100),
  difficulty VARCHAR(20),
  heat VARCHAR(50),
  scene VARCHAR(100),
  description TEXT,
  tags JSONB,
  level INT DEFAULT 0
);
```

### 技术关系表 (technology_relations)
```sql
CREATE TABLE technology_relations (
  id UUID PRIMARY KEY,
  source_id VARCHAR(100) REFERENCES technologies(id),
  target_id VARCHAR(100) REFERENCES technologies(id),
  relation_type VARCHAR(20)
);
```

---

## 技术栈建议

### 后端
- **框架**：Node.js (Express/NestJS) 或 Python (FastAPI)
- **数据库**：PostgreSQL + Redis
- **AI**：OpenAI API / Claude API / 本地部署
- **认证**：JWT / NextAuth

### 部署
- **容器化**：Docker
- **云服务**：Vercel / AWS / 阿里云
- **CDN**：七牛云 / 阿里云 OSS

---

## 开发优先级

1. **P0（必须）**：用户认证、学习目标保存、任务管理
2. **P1（重要）**：AI 生成方案、知识图谱数据管理
3. **P2（增强）**：收藏、历史、打卡
4. **P3（可选）**：社区分享、第三方登录

---

## 接口调用流程

### 典型用户流程

```
1. 用户注册/登录
   POST /api/auth/register → POST /api/auth/login

2. 输入学习目标
   POST /api/goals { goal: "我想做 AI 应用" }

3. AI 生成方案
   POST /api/ai/generate-proposal
   → 返回技术对比、学习路径、四周计划

4. 保存任务到任务中心
   POST /api/tasks (批量创建)

5. 任务中心管理进度
   GET /api/tasks → PUT /api/tasks/:id/complete

6. 查看知识图谱
   GET /api/technologies → GET /api/ai/path/python/rag
```

---

*文档版本：1.0*
*最后更新：2026-03-18*
