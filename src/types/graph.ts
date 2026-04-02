/**
 * 统一图表数据模型
 * AI 返回任意图表类型，前端统一使用此结构渲染
 */

export interface GraphData {
  /** 图表类型：roadmap/flowchart/framework/tree 等（由 AI 决定） */
  type: string;
  /** 图表标题 */
  title: string;
  /** 节点列表 */
  nodes: GraphNode[];
  /** 边列表 */
  edges: GraphEdge[];
  /** 布局类型（由 AI 决定：force/tree/timeline/grid） */
  layout: 'force' | 'tree' | 'timeline' | 'grid';
  /** AI 返回的额外元数据 */
  metadata?: Record<string, unknown>;
}

export interface GraphNode {
  /** 节点 ID */
  id: string;
  /** 显示文字 */
  label: string;
  /** 节点描述 */
  description?: string;
  /** 节点分类（用于着色） */
  category?: string;
  /** 背景色（AI 指定） */
  color?: string;
  /** 文字颜色 */
  textColor?: string;
  /** 节点大小 */
  size?: number;
  /** 图标 */
  icon?: string;
  /** 层级（用于 timeline/tree 布局） */
  level?: number;
  /** 标签列表 */
  tags?: string[];
}

export interface GraphEdge {
  /** 源节点 ID */
  source: string;
  /** 目标节点 ID */
  target: string;
  /** 边标签 */
  label?: string;
  /** 线条类型 */
  type?: 'solid' | 'dashed' | 'dotted';
}
