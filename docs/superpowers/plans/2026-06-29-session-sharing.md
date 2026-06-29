# 三页面会话共享优化实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增 `sessionStore` 统一管理跨页面会话上下文，ConsultPage 跳转前写入 sessionId，Graph/Tasks 直接读取，消除重复 API 调用。

**Architecture:** 新建 Zustand store `sessionStore`，包含 `currentSessionId`、`currentAgentId`、`consultContext`。ConsultPage 跳转前调用 `setCurrentSession`，Graph/Tasks 优先读 store、无则降级读 localStorage。

**Tech Stack:** Zustand 5, React Router DOM 7, TypeScript 5

---

## 文件变更概览

| 操作 | 文件 |
|------|------|
| 新建 | `src/stores/sessionStore.ts` |
| 修改 | `src/stores/index.ts` |
| 修改 | `src/pages/Consult/ConsultPage.tsx` |
| 修改 | `src/pages/Graph/GraphPage.tsx` |
| 修改 | `src/pages/Tasks/TasksPage.tsx` |

---

## Task 1: 新建 sessionStore

**Files:**
- Create: `src/stores/sessionStore.ts`

- [ ] **Step 1: 编写 sessionStore 实现**

```typescript
/**
 * 跨页面会话状态管理
 * 用于 ConsultPage 向 Graph/Tasks 传递当前会话上下文
 */
import { create } from 'zustand';

export interface ConsultContext {
  optionId?: string;
  goal?: string;
  base?: string;
}

interface SessionState {
  /** 当前会话 ID */
  currentSessionId: string | null;
  /** 当前 Agent ID */
  currentAgentId: string;
  /** 从 Consult 跳转时携带的上下文 */
  consultContext: ConsultContext | null;

  setCurrentSession: (
    sessionId: string,
    agentId?: string,
    context?: ConsultContext
  ) => void;
  clearCurrentSession: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  currentSessionId: null,
  currentAgentId: '100003',
  consultContext: null,

  setCurrentSession: (sessionId, agentId = '100003', context = null) =>
    set({
      currentSessionId: sessionId,
      currentAgentId: agentId,
      consultContext: context,
    }),

  clearCurrentSession: () =>
    set({
      currentSessionId: null,
      consultContext: null,
    }),
}));
```

- [ ] **Step 2: Commit**

```bash
git add src/stores/sessionStore.ts
git commit -m "feat: 新增 sessionStore 管理跨页面会话上下文"
```

---

## Task 2: 导出 sessionStore

**Files:**
- Modify: `src/stores/index.ts`

- [ ] **Step 1: 添加导出**

在 `src/stores/index.ts` 文件末尾添加：

```typescript
export { useSessionStore } from './sessionStore';
```

- [ ] **Step 2: Commit**

```bash
git add src/stores/index.ts
git commit -m "feat: 导出 sessionStore"
```

---

## Task 3: ConsultPage 跳转前写入 sessionStore

**Files:**
- Modify: `src/pages/Consult/ConsultPage.tsx`

找到 `openGraphFromConsultData` 函数（约第 806-823 行），在 `localStorage.setItem` 之前添加 `useSessionStore.getState().setCurrentSession` 调用。

- [ ] **Step 1: 读取当前 ConsultPage.tsx 的 import 区**

确认文件顶部已有或添加 import：

```typescript
import { useSessionStore } from '../../stores/sessionStore';
```

- [ ] **Step 2: 修改 openGraphFromConsultData 函数**

将：
```typescript
const openGraphFromConsultData = useCallback((payload: OpenGraphPayload) => {
  if (!currentSession?.agentId || !currentSession?.sessionId) return;

  const sessionData = {
    agentId: currentSession.agentId,
    sessionId: currentSession.sessionId,
    optionId: payload.optionId,
    consultationMsg: payload.goal && payload.base
      ? {
          goal: payload.goal,
          base: payload.base,
        }
      : undefined,
  };

  localStorage.setItem('pathmind_consult_chart', JSON.stringify(sessionData));
  navigate('/graph');
}, [currentSession, navigate]);
```

改为：
```typescript
const openGraphFromConsultData = useCallback((payload: OpenGraphPayload) => {
  if (!currentSession?.agentId || !currentSession?.sessionId) return;

  // 写入 sessionStore，Graph/Tasks 直接读取
  useSessionStore.getState().setCurrentSession(
    currentSession.sessionId,
    currentSession.agentId,
    payload.optionId
      ? { optionId: payload.optionId }
      : payload.goal && payload.base
        ? { goal: payload.goal, base: payload.base }
        : undefined
  );

  const sessionData = {
    agentId: currentSession.agentId,
    sessionId: currentSession.sessionId,
    optionId: payload.optionId,
    consultationMsg: payload.goal && payload.base
      ? {
          goal: payload.goal,
          base: payload.base,
        }
      : undefined,
  };

  localStorage.setItem('pathmind_consult_chart', JSON.stringify(sessionData));
  navigate('/graph');
}, [currentSession, navigate]);
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/Consult/ConsultPage.tsx
git commit -m "feat(ConsultPage): 跳转前写入 sessionStore"
```

---

## Task 4: GraphPage 优先读 sessionStore

**Files:**
- Modify: `src/pages/Graph/GraphPage.tsx`

- [ ] **Step 1: 添加 import**

在 `src/pages/Graph/GraphPage.tsx` 顶部 import 区添加：

```typescript
import { useSessionStore } from '../../stores/sessionStore';
```

- [ ] **Step 2: 在组件内读取 sessionStore**

在 GraphPage 组件函数体内（useState 声明之后），添加：

```typescript
const { currentSessionId: storeSessionId, consultContext: storeContext } = useSessionStore();
```

- [ ] **Step 3: 修改 charts useEffect，优先读 store**

找到 `useEffect` 监听 `fetchAndRenderGroupChart`（约第 693-805 行），在函数开头 `const chartDataStr = localStorage.getItem(...)` 之前添加：

```typescript
// 优先从 sessionStore 读取，降级读 localStorage
if (storeSessionId && !activeSessionId) {
  setActiveSessionId(storeSessionId);
}

if (storeContext && !hasRequestedChartRef.current) {
  hasRequestedChartRef.current = true;
  // 使用 storeContext 构造 chartData 逻辑
  // 与下方 localStorage 逻辑二选一执行
  const { loadGeneratedChart } = require('./graphChartLoader'); // 见 Step 3 注
  // 注：实际直接在 useEffect 内补充逻辑，不拆文件，见 Step 4
}
```

**注：不在此处拆文件，直接在 useEffect 内补充 store 读取逻辑，见 Step 4。**

- [ ] **Step 4: 在 useEffect 内添加 store 读取分支**

在 `useEffect` 的 `const chartDataStr = ...` 之前添加：

```typescript
// 优先从 sessionStore 读取
if (storeContext && !hasRequestedChartRef.current) {
  hasRequestedChartRef.current = true;

  const loadFromStoreContext = async () => {
    setIsChartLoading(true);
    setChartLoadingText('正在生成计划图表...');
    setChartLoadError(null);
    setGraphEmptyMessage(DEFAULT_GRAPH_EMPTY_MESSAGE);

    try {
      const chartRequestData = storeContext.optionId
        ? { type: 'option', optionId: storeContext.optionId }
        : storeContext.goal && storeContext.base
          ? { type: 'consultation', consultationMsg: { goal: storeContext.goal, base: storeContext.base } }
          : null;

      if (!chartRequestData) {
        throw new Error('consultContext 数据格式异常');
      }

      if (storeSessionId) {
        setActiveSessionId(storeSessionId);
      }

      if (chartRequestData.type === 'consultation') {
        const res = await charts({
          consultationMsg: chartRequestData.consultationMsg,
          agentId: '100004',
          sessionId: storeSessionId || undefined,
        });
        // 后续处理同下方 localStorage 逻辑...
        const contentData = getChartContent(res);
        const contentObj = parseChartContent(contentData);

        if (typeof contentObj?.xml === 'string') {
          const normalizedXml = normalizeDrawioXml(contentObj.xml);
          if (normalizedXml.ok) {
            setGraphXml(normalizedXml.xml);
            setIsChartLoading(false);
          }
        }

        if (Array.isArray(contentObj?.data)) {
          localStorage.setItem(PLAN_DATA_STORAGE_KEY, JSON.stringify(contentObj.data));
        }

        // 清理 sessionStore
        useSessionStore.getState().clearCurrentSession();
      } else {
        // optionId 类型，走 generatePlanByOption
        // 调用 generatePlanByOption(sessionId, optionId)
      }
    } catch (err) {
      console.error('Charts API error (store):', err);
      setChartLoadError('计划图表加载失败，请稍后重试');
      setIsChartLoading(false);
    }
  };

  loadFromStoreContext();
  return; // 跳过 localStorage 逻辑
}
```

**注：如果 `loadFromStoreContext` 内复用下方 localStorage 逻辑较多，可将共有逻辑提取为 `processChartResponse` 函数，但为最小改动，这里保持内联。**

- [ ] **Step 5: Commit**

```bash
git add src/pages/Graph/GraphPage.tsx
git commit -m "feat(GraphPage): 优先读 sessionStore，降级读 localStorage"
```

---

## Task 5: TasksPage 优先读 sessionStore

**Files:**
- Modify: `src/pages/Tasks/TasksPage.tsx`

- [ ] **Step 1: 添加 import**

在 `src/pages/Tasks/TasksPage.tsx` 顶部添加：

```typescript
import { useSessionStore } from '../../stores/sessionStore';
```

- [ ] **Step 2: 在组件内读取 sessionStore**

在 TasksPage 组件函数体内添加：

```typescript
const { currentSessionId: storeSessionId } = useSessionStore();
```

- [ ] **Step 3: 修改 loadSchedules useEffect，优先读 store**

找到 `loadSchedules` 函数或 `useEffect`（约第 307-335 行），在开始处添加 store 读取逻辑：

```typescript
// 优先从 sessionStore 读取 sessionId
const effectiveSessionId = storeSessionId || sessionId;

if (effectiveSessionId) {
  await fetchSchedules(effectiveSessionId);
} else {
  // 降级从 localStorage 读取
  const planDataStr = localStorage.getItem(PLAN_DATA_STORAGE_KEY);
  ...
}
```

原有逻辑不变，作为降级分支。

- [ ] **Step 4: Commit**

```bash
git add src/pages/Tasks/TasksPage.tsx
git commit -m "feat(TasksPage): 优先读 sessionStore 降级读 localStorage"
```

---

## Task 6: 验证构建

- [ ] **Step 1: 运行 lint 和 build**

```bash
npm run lint
npm run build
```

- [ ] **Step 2: 如有报错，修复合并冲突**

---

## 自检清单

- [ ] sessionStore 的 `setCurrentSession` 在 ConsultPage 跳转前被调用
- [ ] GraphPage 优先读 `useSessionStore().currentSessionId`，无则降级读 localStorage
- [ ] TasksPage 优先读 `useSessionStore().currentSessionId`，无则降级读 localStorage
- [ ] `sessionStore` 从 `src/stores/index.ts` 正确导出
- [ ] `npm run build` 无报错
- [ ] 直接访问 `/graph` 或 `/tasks` 时，降级逻辑正常工作
