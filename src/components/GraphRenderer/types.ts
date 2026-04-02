/**
 * 图表渲染器接口
 * 定义统一的图表渲染 API，方便将来切换实现（如从 mxGraph 换到 iframe）
 */
import type { GraphData, GraphNode } from '../../types/graph';

export interface GraphRendererOptions {
  container: HTMLElement;
  onNodeClick?: (node: GraphNode) => void;
  onNodeDoubleClick?: (node: GraphNode) => void;
}

export interface GraphRenderer {
  /** 渲染图表数据 */
  render(data: GraphData): void;

  /** 清空图表 */
  clear(): void;

  /** 销毁渲染器 */
  destroy(): void;

  /** 导出为图片 */
  exportImage(): string;

  /** 缩放到适应屏幕 */
  fit(): void;

  /** 缩放到指定比例 */
  zoomTo(scale: number): void;

  /** 获取当前缩放比例 */
  getZoom(): number;
}
