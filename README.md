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

---

### 2. 知识图谱 (GraphPage)

**功能描述**：可视化技术节点关系，支持 AI 生成图表

**已实现**：

#### 2.1 图表展示
- 集成 draw.io 图表渲染
- 支持拖拽、缩放操作
- 通过 `mockGraphXml` 提供默认图谱

#### 2.2 AI 图谱生成
- AI Side Panel 侧边对话面板
- 支持通过对话生成自定义图表
- 可输入需求，AI 返回 XML 图表数据

#### 2.3 节点详情
- 点击节点显示详情面板
- 显示节点名称、分类、描述、标签
- 提供"开始学习"快捷入口

#### 2.4 控制功能
- 物理效果开关
- 缩放控制

**相关文件**：
- `src/pages/Graph/GraphPage.tsx`
- `src/pages/Graph/GraphCanvas.tsx`
- `src/pages/Graph/AISidePanel.tsx`
- `src/api/mock.ts`

---

### 3. 任务中心 (TasksPage)

**功能描述**：展示和管理学习任务进度

**已实现**：
- 进度百分比显示
- 当前学习目标展示
- 按周分组的任务列表
- 任务勾选完成状态
- 重新开始功能
- 查看知识图谱入口

**相关文件**：
- `src/pages/Tasks/TasksPage.tsx`

---

### 4. 方案详情 (ProposalPage)

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

---

### 5. AI 技术咨询 (ConsultPage)

**功能描述**：多轮对话式 AI 顾问，生成专属技术路线图和执行计划

**已实现**：

#### 5.1 智能对话流程
- 四步问卷收集：目标 → 经验水平 → 时间要求 → 应用场景
- 快捷选项标签快速选择
- 实时打字机效果

#### 5.2 多会话管理
- 侧边栏展示历史对话列表
- 支持新建、切换、删除会话
- 会话数据本地持久化（localStorage）

#### 5.3 方案生成
- 根据用户画像动态生成技术栈建议
- 生成 Mermaid 格式学习路线图
- 输出四周详细执行计划（按周/按任务分解）

#### 5.4 快捷交互
- Enter 发送，Shift+Enter 换行
- 支持查看路线图、详细计划模态框
- 一键跳转知识图谱

**技术栈识别**：
- AI 应用：Python + LangChain + Chroma/Faiss + FastAPI
- 企业 Web：React/Vue + TypeScript + Vite + Zustand
- 移动应用：React Native / Flutter + Expo
- 数据平台：Node.js + Express/Koa + PostgreSQL + React

**相关文件**：
- `src/pages/Consult/ConsultPage.tsx`
- `src/pages/Consult/ConsultPage.scss`

---

### 6. 用户认证 (Auth)

**功能描述**：用户注册和登录

**已实现**：

#### 6.1 注册页面 (RegisterPage)
- 用户名、邮箱、密码、手机号（选填）
- 密码强度实时检测
- 确认密码校验
- 用户协议同意勾选
- 表单完整验证

#### 6.2 登录页面 (LoginPage)
- 用户名/密码登录
- 记住我功能
- 忘记密码链接
- 密码显示/隐藏切换
- 表单验证

#### 6.3 状态管理
- 使用 Zustand authStore 管理认证状态
- 持久化存储

**相关文件**：
- `src/pages/Auth/LoginPage.tsx`
- `src/pages/Auth/RegisterPage.tsx`
- `src/stores/authStore.ts`

---

## 路由结构

| 路径 | 页面 | 说明 |
|------|------|------|
| `/` | HomePage | 首页 |
| `/graph` | GraphPage | 知识图谱 |
| `/tasks` | TasksPage | 任务中心 |
| `/proposal` | ProposalPage | 方案详情 |
| `/consult` | ConsultPage | AI 技术咨询 |
| `/login` | LoginPage | 登录 |
| `/register` | RegisterPage | 注册 |

---

## 技术栈

- **前端框架**：React 19.2 + React Router DOM 7
- **构建工具**：Vite 8 + React Compiler
- **类型系统**：TypeScript（严格模式）
- **状态管理**：Zustand 5（持久化）
- **HTTP 请求**：Axios
- **可视化**：D3 7（力导向图）、draw.io（图表渲染）
- **样式**：SCSS + 设计变量

---

## 开发命令

```bash
npm run dev      # 启动开发服务器
npm run build    # TypeScript 检查 + 生产构建
npm run lint     # ESLint 检查
npm run preview  # 预览生产环境
```

---

## 待实现功能

> 以下功能为后续开发计划

### 1. 用户数据持久化
- 后端 API 对接
- 数据库设计

### 2. AI 生成功能增强
- 真正的 AI 模型对接
- 方案智能优化

### 3. 收藏与历史
- 技术收藏功能
- 浏览历史记录

### 4. 社区功能
- 学习打卡
- 方案分享

---

*文档版本：1.1*
*最后更新：2026-04-10*
