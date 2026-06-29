# 三页面会话共享优化设计方案

## 背景

当前 ConsultPage、GraphPage、TasksPage 三个页面通过 localStorage 中转共享会话上下文，存在以下问题：
- 无类型安全（localStorage 字符串解析）
- 无原子性保证
- Graph/Tasks 重复调用 `getChatSessions` 获取会话列表
- 无统一的跨页面会话状态管理

## 目标

最小改动统一会话状态管理，让 Graph/Tasks 能直接获取 ConsultPage 的当前会话 ID，无需重复 API 调用。

## 设计方案

### 1. 新增 `sessionStore`

新建 `src/stores/sessionStore.ts`，专门管理跨页面会话上下文：

```typescript
// src/stores/sessionStore.ts
import { create } from 'zustand';

interface SessionState {
  /** 当前会话 ID */
  currentSessionId: string | null;
  /** 当前 Agent ID */
  currentAgentId: string;
  /** 从 Consult 跳转时携带的额外参数（可选） */
  consultContext: {
    optionId?: string;
    goal?: string;
    base?: string;
  } | null;

  setCurrentSession: (sessionId: string, agentId?: string, context?: SessionState['consultContext']) => void;
  clearCurrentSession: () => void;
}
```

### 2. ConsultPage 改动

跳转 Graph 前写入 sessionStore：

```typescript
// ConsultPage.tsx，跳转前
import { useSessionStore } from '../../stores/sessionStore';

const openGraphFromConsultData = useCallback((payload: OpenGraphPayload) => {
  useSessionStore.getState().setCurrentSession(
    currentSession.sessionId,
    currentSession.agentId,
    payload.optionId ? { optionId: payload.optionId } : { goal: payload.goal, base: payload.base }
  );
  navigate('/graph');
}, [currentSession, navigate]);
```

### 3. GraphPage 改动

优先从 sessionStore 读取 sessionId，降级读取 localStorage：

```typescript
// GraphPage.tsx
import { useSessionStore } from '../../stores/sessionStore';

export const GraphPage = () => {
  const { currentSessionId, consultContext } = useSessionStore();

  useEffect(() => {
    const sessionId = currentSessionId || localStorage.getItem('pathmind_consult_chart');
    // 使用 sessionId 调用 API
  }, [currentSessionId]);
};
```

### 4. TasksPage 改动

同上，优先读 sessionStore：

```typescript
// TasksPage.tsx
import { useSessionStore } from '../../stores/sessionStore';

export const TasksPage = () => {
  const { currentSessionId } = useSessionStore();

  useEffect(() => {
    if (currentSessionId) {
      fetchSchedules(currentSessionId);
    } else {
      // 降级读 localStorage
    }
  }, [currentSessionId]);
};
```

### 5. 降级策略

当用户直接访问 `/graph` 或 `/tasks`（非 Consult 跳转）时：
- 优先读 `sessionStore.currentSessionId`
- 无则读取 `localStorage.getItem('pathmind_consult_chart')` 解析 sessionId
- 无则调用 `getChatSessions` 获取会话列表

## 数据流

```
ConsultPage                         sessionStore                    Graph/Tasks
     │                                    │                               │
     │  选择方案，跳转前                   │                               │
     │  setCurrentSession(                │                               │
     │    sessionId,                      │                               │
     │    agentId,                        │                               │
     │    { optionId }                    │                               │
     │  )                                 │                               │
     │────────────────────────────────>│                               │
     │                                    │                               │
     │  navigate('/graph')               │  getCurrentSession()          │
     │                                    │<──────────────────────────────│
     │                                    │  返回 sessionId + context      │
     │                                    │                               │
     │                         [直接访问 /graph 时]                       │
     │                         降级读 pathmind_consult_chart              │
     └────────────────────────────────────┴───────────────────────────────┘
```

## 不改动的内容

- `chatStore` 保持现状，不扩展（消息管理职责不变）
- `scheduleStore` 保持现状
- `graphStore` 保持现状
- ConsultPage 内部会话状态管理方式不变
- localStorage 作为降级保留，不删除

## 实施步骤

1. 新建 `src/stores/sessionStore.ts`
2. ConsultPage 跳转前调用 `setCurrentSession`
3. GraphPage 优先从 sessionStore 读取，降级读 localStorage
4. TasksPage 同上
5. 清理 ConsultPage 中已无用的 localStorage 写入逻辑（如有）

## 验证方式

- 直接访问 `/graph` 或 `/tasks`：降级走 localStorage，功能不变
- 从 Consult 跳转 `/graph`：Graph 能正确获取 sessionId
- 从 Consult 跳转 `/tasks`：Tasks 能正确获取 sessionId
- 运行 `npm run build` 无报错
