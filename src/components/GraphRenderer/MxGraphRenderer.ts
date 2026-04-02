/**
 * mxGraph 渲染器实现
 * draw.io 开源库的核心，用于高性能图表渲染
 */
import mxGraphFactory from 'mxgraph';
import type { GraphRenderer, GraphRendererOptions } from './types';
import type { GraphData, GraphNode, GraphEdge } from '../../types/graph';

// mxgraph 依赖全局变量，必须在使用前设置
// 这些变量原本通过 <script> 标签加载时由 mxGraph 自动设置
(window as any).mxLoadResources = false;
(window as any).mxForceIncludes = true;
(window as any).mxBasePath = '/';

const mx = mxGraphFactory()();

const {
  mxGraph,
  mxUtils,
  mxEvent,
  mxRubberband,
  mxConstants,
  mxPerimeter,
  mxFastOrganicLayout,
  mxCompactTreeLayout,
  mxHierarchicalLayout,
} = mx;

// 默认颜色
const DEFAULT_COLORS = {
  primary: '#667eea',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  text: '#374151',
  border: '#e5e7eb',
};

export class MxGraphRenderer implements GraphRenderer {
  private graph: any;
  private container: HTMLElement;
  private options: GraphRendererOptions;
  private currentData: GraphData | null = null;

  constructor(options: GraphRendererOptions) {
    this.options = options;
    this.container = options.container;

    // 初始化 mxGraph
    this.graph = new mxGraph(this.container);

    // 设置样式
    this.setupStyles();

    // 启用交互
    this.setupInteractions();

    // 居中显示
    this.graph.center();
  }

  /**
   * 设置 mxGraph 样式
   */
  private setupStyles(): void {
    const style = this.graph.getStylesheet().getDefaultVertexStyle();

    // 顶点样式
    Object.assign(style, {
      [mxConstants.STYLE_SHAPE]: mxConstants.SHAPE_ROUNDED_RECTANGLE,
      [mxConstants.STYLE_ROUNDED]: true,
      [mxConstants.STYLE_ARCSIZE]: 10,
      [mxConstants.STYLE_FONTCOLOR]: DEFAULT_COLORS.text,
      [mxConstants.STYLE_FONTSIZE]: 13,
      [mxConstants.STYLE_FONTSTYLE]: mxConstants.FONT_BOLD,
      [mxConstants.STYLE_FILLCOLOR]: DEFAULT_COLORS.primary,
      [mxConstants.STYLE_STROKECOLOR]: '#5569d4',
      [mxConstants.STYLE_STROKEWIDTH]: 2,
      [mxConstants.STYLE_SHADOW]: true,
      [mxConstants.STYLE_DROP_SHADOW]: true,
      [mxConstants.STYLE_PERIMETER]: mxPerimeter.rectanglePerimeter,
      [mxConstants.STYLE_SPACING_TOP]: 12,
      [mxConstants.STYLE_SPACING_BOTTOM]: 12,
      [mxConstants.STYLE_SPACING_LEFT]: 16,
      [mxConstants.STYLE_SPACING_RIGHT]: 16,
      [mxConstants.STYLE_LABEL_BACKGROUNDCOLOR]: '#ffffff',
      [mxConstants.STYLE_LABEL_BORDERCOLOR]: mxConstants.NONE,
      [mxConstants.STYLE_ROUNDED]: true,
    });

    // 边样式
    const edgeStyle = this.graph.getStylesheet().getDefaultEdgeStyle();
    Object.assign(edgeStyle, {
      [mxConstants.STYLE_STROKECOLOR]: DEFAULT_COLORS.primary,
      [mxConstants.STYLE_STROKEWIDTH]: 2,
      [mxConstants.STYLE_EDGE]: mxConstants.EDGESTYLE_ORTHOGONAL,
      [mxConstants.STYLE_ROUNDED]: true,
      [mxConstants.STYLE_ENDARROW]: mxConstants.ARROW_CLASSIC,
      [mxConstants.STYLE_ENDSIZE]: 8,
      [mxConstants.STYLE_START_SIZE]: 8,
      [mxConstants.STYLE_FONTCOLOR]: '#6b7280',
      [mxConstants.STYLE_FONTSIZE]: 11,
    });

    // 应用默认样式
    this.graph.getStylesheet().putDefaultVertexStyle(style);
    this.graph.getStylesheet().putDefaultEdgeStyle(edgeStyle);
  }

  /**
   * 设置交互功能
   */
  private setupInteractions(): void {
    // 启用鼠标框选
    new mxRubberband(this.graph);

    // 启用节点拖拽
    this.graph.setCellsMovable(true);
    this.graph.setCellsResizable(true);
    this.graph.setResizeContainer(true);

    // 启用连线
    this.graph.setConnectable(true);
    this.graph.setAllowDanglingEdges(false);

    // 设置自动调整大小
    this.graph.setAutoSizeCells(true);

    // 节点点击事件
    this.graph.addListener(mxEvent.CLICK, (_sender: any, evt: any) => {
      const cell = evt.getProperty('cell');
      if (cell && cell.isVertex() && this.options.onNodeClick) {
        const nodeId = cell.getId();
        const node = this.currentData?.nodes.find((n) => n.id === nodeId);
        if (node) {
          this.options.onNodeClick(node);
        }
      }
    });

    // 禁用折叠
    this.graph.foldingEnabled = false;

    // 启用垂直布局
    this.graph.setCellsLocked(false);
  }

  /**
   * 渲染图表数据
   */
  render(data: GraphData): void {
    this.currentData = data;
    this.clear();

    const parent = this.graph.getDefaultParent();

    // 禁用动画
    this.graph.getModel().beginUpdate();

    try {
      const nodeMap = new Map<string, any>();

      // 1. 创建所有节点
      data.nodes.forEach((node, index) => {
        const style = this.getNodeStyle(node);
        const vertex = this.graph.insertVertex(
          parent,
          node.id,
          node.label,
          100 + (index % 5) * 150,
          100 + Math.floor(index / 5) * 100,
          120,
          50,
          style
        );

        // 存储额外数据
        vertex.setConnectable(true);
        nodeMap.set(node.id, vertex);
      });

      // 2. 创建所有边
      data.edges.forEach((edge) => {
        const source = nodeMap.get(edge.source);
        const target = nodeMap.get(edge.target);

        if (source && target) {
          const edgeStyle = this.getEdgeStyle(edge);
          this.graph.insertEdge(
            parent,
            null,
            edge.label || '',
            source,
            target,
            edgeStyle
          );
        }
      });

      // 3. 根据布局类型应用布局算法
      this.applyLayout(data.layout);
    } finally {
      this.graph.getModel().endUpdate();
    }

    // 4. 适应屏幕
    this.fit();
  }

  /**
   * 获取节点样式
   */
  private getNodeStyle(node: GraphNode): string {
    const color = node.color || DEFAULT_COLORS.primary;
    const strokeColor = this.darkenColor(color, 0.15);

    return `rounded=1;whiteSpace=wrap;html=1;fillColor=${this.colorToHex(color)};strokeColor=${this.colorToHex(strokeColor)};fontColor=${node.textColor || '#ffffff'};fontSize=13;bold=1;`;
  }

  /**
   * 获取边样式
   */
  private getEdgeStyle(edge: GraphEdge): string {
    let style = 'rounded=1;orthogonal=1;';

    if (edge.type === 'dashed') {
      style += 'dashed=1;';
    } else if (edge.type === 'dotted') {
      style += 'dashed=1;dashPattern=1;';
    }

    if (edge.label) {
      style += 'labelBackgroundColor=#ffffff;fontColor=#6b7280;fontSize=11;';
    }

    return style;
  }

  /**
   * 应用布局算法
   */
  private applyLayout(layoutType: string): void {
    const parent = this.graph.getDefaultParent();
    let layout: any;

    switch (layoutType) {
      case 'tree':
        layout = new mxCompactTreeLayout(this.graph, true);
        layout.levelDistance = 80;
        layout.nodeDistance = 50;
        break;

      case 'timeline':
        layout = new mxHierarchicalLayout(this.graph, mxConstants.DIRECTION_WEST);
        layout.levelDistance = 100;
        break;

      case 'grid':
        layout = new mxFastOrganicLayout(this.graph);
        layout.forceConstant = 150;
        break;

      case 'force':
      default:
        layout = new mxFastOrganicLayout(this.graph);
        layout.forceConstant = 200;
        layout.restricted = false;
        break;
    }

    if (layout) {
      layout.execute(parent);
    }
  }

  /**
   * 清空图表
   */
  clear(): void {
    if (this.graph.getModel().getChildCount(this.graph.getDefaultParent()) > 0) {
      this.graph.removeCells(this.graph.getChildVertices(this.graph.getDefaultParent()));
    }
  }

  /**
   * 销毁渲染器
   */
  destroy(): void {
    this.graph.destroy();
  }

  /**
   * 导出为图片
   */
  exportImage(): string {
    const scale = 2; // 2x 分辨率
    return mxUtils.createDataUri(
      this.graph.getImage(new mxGenericChangeOwner(this.graph), scale)
    );
  }

  /**
   * 适应屏幕
   */
  fit(): void {
    this.graph.fit();
    const scale = this.graph.getView().getScale();
    this.graph.getView().setScale(scale * 0.9); // 留点边距
  }

  /**
   * 缩放到指定比例
   */
  zoomTo(scale: number): void {
    this.graph.getView().setScale(scale);
  }

  /**
   * 获取当前缩放比例
   */
  getZoom(): number {
    return this.graph.getView().getScale();
  }

  /**
   * 将颜色转换为 Hex 格式
   */
  private colorToHex(color: string): string {
    if (color.startsWith('#')) {
      return color;
    }

    // 处理 rgb() 格式
    const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1], 10).toString(16).padStart(2, '0');
      const g = parseInt(rgbMatch[2], 10).toString(16).padStart(2, '0');
      const b = parseInt(rgbMatch[3], 10).toString(16).padStart(2, '0');
      return `#${r}${g}${b}`;
    }

    return color;
  }

  /**
   * 使颜色变深
   */
  private darkenColor(color: string, amount: number): string {
    const hex = this.colorToHex(color);
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, Math.floor((num >> 16) * (1 - amount)));
    const g = Math.max(0, Math.floor(((num >> 8) & 0x00ff) * (1 - amount)));
    const b = Math.max(0, Math.floor((num & 0x0000ff) * (1 - amount)));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }
}

// 占位类，用于 createDataUri
class mxGenericChangeOwner {
  constructor(_graph: any) {}
}
