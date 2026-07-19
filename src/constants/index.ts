/**
 * PathMind 全局常量
 * 收编所有魔法字符串，禁止在业务代码中硬编码
 */

// ============================================================
// Agent IDs
// ============================================================
export const AGENT_IDS = {
  /** AI Copilot / 会话助手 */
  COPILOT: '100003',
  /** 图谱生成器 */
  GRAPH_GENERATOR: '100004',
} as const;

// ============================================================
// Storage Keys
// ============================================================
export const STORAGE_KEYS = {
  /** 认证 token */
  TOKEN: 'token',
  /** Auth store 持久化 key */
  AUTH_STORAGE: 'auth-storage',
  /** 右侧悬浮导航展开状态 */
  NAV_EXPANDED: 'pathmind-nav-expanded',
  /** Copilot 跳转 Graph 时的图谱生成参数 */
  CONSULT_CHART: 'pathmind_consult_chart',
  /** 日程任务数据（降级/缓存用） */
  PLAN_DATA: 'pathmind_plan_data',
  /** 当前学习计划标题 */
  PLAN_TITLE: 'pathmind_plan_title',
  /** 图表生成中标记（跨页面传递 loading 状态） */
  GENERATING_PLAN: 'pathmind_generating_plan',
  /** Graph 会话图表缓存 */
  SESSION_CHARTS: 'pathmind_session_charts',
} as const;

