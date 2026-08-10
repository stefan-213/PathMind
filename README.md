# PathMind

PathMind 是一个面向开发者和学习者的 AI 技术选型与学习路径规划平台。用户可以通过 Copilot 描述目标，获得技术方案对比、学习路线图、任务日程，并在知识图谱、任务中心和个人中心中持续跟踪学习进度。

## 项目概览

- AI Copilot: 多轮对话收集目标、经验、时间和规模信息，生成方案对比与图谱入口。
- 知识图谱: 基于 draw.io XML 渲染学习路线图，支持历史会话图谱切换、AI 修改图谱和生成任务日程。
- 任务中心: 展示按阶段拆分的学习任务，支持勾选完成、折叠阶段和进入任务详情。
- 任务详情: 围绕单个任务提供学习助手，优先调用后端日程对话接口，失败时使用本地兜底回复。
- 知识库: 管理知识库和文档，支持创建、重命名、删除、上传文件和拖拽上传。
- 个人中心: 展示账户信息、学习统计、进行中的计划、成就和历史目标。
- 认证系统: 登录、注册、退出、路由保护和 token 持久化。

## 技术栈

| 分类 | 技术 |
| --- | --- |
| 构建工具 | Vite 8 |
| 前端框架 | React 19 |
| 路由 | React Router DOM 7 |
| 类型系统 | TypeScript 5 严格模式 |
| 样式 | Sass / SCSS |
| 状态管理 | Zustand 5 |
| HTTP 请求 | Axios |
| 图谱渲染 | mxGraph / draw.io XML |
| 内容渲染 | react-markdown |

## 快速开始

```bash
npm install
npm run dev
```

默认开发服务器由 Vite 启动。后端接口地址通过环境变量配置：

```bash
VITE_API_BASE_URL=http://localhost:8080
```

如果不设置 `VITE_API_BASE_URL`，Axios 会使用相对路径请求接口。

## 常用命令

```bash
npm run dev      # 启动开发服务器
npm run build    # TypeScript 构建检查并打包生产资源
npm run lint     # ESLint 检查
npm run preview  # 预览生产构建
```

## 路由说明

| 路径 | 页面 | 说明 | 权限 |
| --- | --- | --- | --- |
| `/` | HomePage | 产品首页 | 公开 |
| `/login` | LoginPage | 登录 | 公开，已登录会重定向 |
| `/register` | RegisterPage | 注册 | 公开，已登录会重定向 |
| `/consult` | ConsultPage | AI Copilot 对话规划 | 需登录 |
| `/graph` | GraphPage | 知识图谱与路线图 | 需登录 |
| `/tasks` | TasksPage | 学习任务中心 | 需登录 |
| `/task-detail` | TaskDetailPage | 单个任务学习助手 | 需登录 |
| `/knowledge-base` | KnowledgeBasePage | 知识库与文档管理 | 需登录 |
| `/profile` | ProfilePage | 个人中心 | 需登录 |

路由定义位于 `src/routes/routes.tsx`，公共路由和受保护路由由 `src/components/ProtectedRoute.tsx` 处理。

## 项目结构

```text
src/
  api/                 # API 请求封装
    axios.ts           # Axios 实例、拦截器、通用 get/post/put/delete
    auth.ts            # 登录、注册、退出和用户信息接口
    conversation.ts    # Copilot 会话、历史记录和图谱生成接口
    graph.ts           # 图谱生成、保存和 AI 修改接口
    knowledgeBase.ts   # 知识库和文档接口
    profile.ts         # 个人中心接口
    tasks.ts           # 日程任务接口
    useApi.ts          # API 模块统一导出
  components/
    common/            # Button、Card、Badge、Input、Textarea、EmptyState、Spin、ResourceSidebar
    layout/            # Header、Footer
    ProtectedRoute.tsx # 路由权限控制
    ScrollToTop.tsx    # 路由切换滚动复位
  pages/
    Auth/              # 登录和注册
    Consult/           # AI Copilot
    Graph/             # 知识图谱和 AI 图谱侧栏
    Home/              # 首页
    KnowledgeBase/     # 知识库管理
    Profile/           # 个人中心
    Tasks/             # 任务中心和任务详情
  routes/              # 路由入口和根布局
  stores/              # Zustand stores
  styles/              # 变量、mixin、动画和全局样式
  types/               # API、图谱、Copilot 等类型
  utils/               # localStorage、ID、draw.io XML 和会话数据工具
```

## 数据流

1. `App.tsx` 启动时调用 `useAuthStore.checkAuth()`，根据本地 token 拉取当前用户。
2. 登录成功后，`authStore` 保存 token 到 `localStorage`，Axios 非白名单请求会自动带上 `Authorization`。
3. Copilot 页面通过 `/api/agent/getSessionList`、`/api/agent/createSession`、`/api/agent/goal` 管理会话和方案对话。
4. Copilot 选中方案后写入 `pathmind_consult_chart`，Graph 页面读取该数据并调用图谱接口生成 draw.io XML。
5. Graph 页面会把图谱返回的日程数据同步到 `pathmind_plan_data` 和 `pathmind_plan_title`。
6. Tasks 页面优先按当前会话从后端加载日程，后端无数据时回退到 `localStorage`。
7. TaskDetail 页面优先调用 `/api/agent/scheduleChat`，失败后使用本地规则生成学习建议。

## API 约定

Axios 封装位于 `src/api/axios.ts`：

- `VITE_API_BASE_URL` 会自动标准化，支持相对路径、绝对路径和 host 字符串。
- 后端 `{ code, info, data }` 会被转换为前端统一的 `{ success, data, error }`。
- `401` 会清理 token 并跳转到 `/login`。
- 请求期间会通过 body cursor 提供全局等待反馈。

主要接口模块：

- `auth.ts`: `/api/auth/login`、`/api/auth/register`、`/api/user/info`、`/api/user/quitLogin`
- `conversation.ts`: `/api/agent/list`、`/api/agent/createSession`、`/api/agent/getSessionList`、`/api/agent/goal`、`/api/agent/charts`
- `graph.ts`: `/api/agent/charts`、`/api/agent/saveXmlFile`、`/api/agent/updataGroup`
- `tasks.ts`: `/api/agent/createSchedule`、`/api/agent/getSchedule`、`/api/agent/scheduleChat`
- `knowledgeBase.ts`: `/api/knowledge/base/*`、`/api/knowledge/document/*`
- `profile.ts`: `/api/profile/plans`、`/api/profile/achievements`、`/api/profile/stats`

## 状态管理

| Store | 作用 |
| --- | --- |
| `authStore` | 用户、token、登录态、认证 loading/error，使用 Zustand persist |
| `chatStore` | 图谱 AI 面板消息、当前 session、满意度状态 |
| `graphStore` | 通用图谱数据和 loading 状态 |
| `scheduleStore` | 日程任务列表、当前日程、任务完成状态和本地回退 |
| `profileStore` | 计划、成就、统计数据和拆分 loading 状态 |
| `navStore` | 右侧悬浮导航展开状态，持久化到 `localStorage` |

## 通用组件

新增 UI 前优先复用 `src/components/common`：

- `Button`: 支持 `primary`、`secondary`、`primary-blue`、`text`、`cta-white` 变体。
- `Card`: 支持 `default`、`bordered`、`elevated` 变体和多种 padding。
- `Badge`: 支持默认、主色、强调色、成功、警告、错误状态。
- `Input` / `Textarea`: 支持 label、error 和常用原生属性。
- `EmptyState`: 统一空状态展示，可传入 action。
- `Spin`: 小、中、大三种 loading。
- `ResourceSidebar`: 可折叠资源侧栏，用于 Copilot、Graph、Tasks 和 KnowledgeBase。

## 样式约定

项目使用 SCSS 和全局设计令牌，核心风格是浅色现代 SaaS、卡片化、轻阴影、主蓝色和强调橙色。

常用设计令牌在 `src/styles/_variables.scss` 和 `src/index.scss` 中维护：

- 主色: `$primary-blue`、`$blue-hover`
- 强调色: `$accent-orange`、`$orange-hover`
- 文本: `$text-title`、`$text-body`、`$text-caption`
- 背景: `$bg-white`、`$bg-soft`
- 边框和阴影: `$border-light`、`$shadow-card`、`$shadow-hover`
- 圆角和间距: `$radius-card`、`$radius-xl`、`$space-xs` 到 `$space-3xl`

页面样式放在页面同目录 `.scss` 文件中，组件样式放在组件同目录 `.scss` 文件中。需要变量或 mixin 时使用 Sass module：

```scss
@use "../../styles/variables" as *;
@use "../../styles/mixins" as *;
```

## 本地存储键

| Key | 用途 |
| --- | --- |
| `token` | 登录 token |
| `auth-storage` | Zustand persist 的认证状态 |
| `pathmind-nav-expanded` | 悬浮导航展开状态 |
| `pathmind_consult_chart` | Copilot 跳转 Graph 的图谱生成参数 |
| `pathmind_plan_data` | Graph 生成的任务日程本地回退数据 |
| `pathmind_plan_title` | 当前学习计划标题 |
| `pathmind_consult_data_{sessionId}` | Copilot 会话的补充上下文 |

## 开发约定

- 组件使用 `.tsx`，样式使用 `.scss`。
- 类型定义优先放在 `src/types`，API 调用放在 `src/api`，通用工具放在 `src/utils`。
- 不确定的外部数据使用 `unknown`，并通过类型保护收窄。
- 新增页面按 `src/pages/Feature/FeaturePage.tsx`、`FeaturePage.scss`、`index.ts` 组织，并在 `src/routes/routes.tsx` 注册。
- 新增通用组件按 `src/components/common/ComponentName/` 组织，并在 `src/components/common/index.ts` 导出。
- 不引入 Tailwind、CSS Modules、styled-components、Less、新 UI 框架、新图标库或新状态管理库，除非有明确需求。

## 验证建议

修改代码后建议运行：

```bash
npm run lint
npm run build
```

当前 `package.json` 未提供 `type-check` 或 `test` 脚本，构建命令已包含 TypeScript 构建检查。

---

文档版本: 1.4

最后更新: 2026-06-04
