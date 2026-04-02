/**
 * mxGraph 类型声明
 * mxGraph 是 draw.io 的核心开源库
 */

declare module 'mxgraph' {
  // mxGraph 核心类
  export class mxGraph {
    constructor(container: HTMLElement | null);
    getDefaultParent(): any;
    getModel(): any;
    getStylesheet(): any;
    getView(): any;
    center(): void;
    fit(): void;
    destroy(): void;
    clear(): void;

    // 插入顶点
    insertVertex(
      parent: any,
      id: string,
      value: any,
      x: number,
      y: number,
      width: number,
      height: number,
      style?: string
    ): any;

    // 插入边
    insertEdge(
      parent: any,
      id: string | null,
      value: any,
      source: any,
      target: any,
      style?: string
    ): any;

    // 删除单元格
    removeCells(cells: any[]): any[];

    // 获取子顶点
    getChildVertices(parent: any): any[];

    // 获取图像
    getImage(_owner: any, _scale: number): string;

    // 样式相关
    setCellsMovable(movable: boolean): void;
    setCellsResizable(resizable: boolean): void;
    setResizeContainer(resize: boolean): void;
    setConnectable(connectable: boolean): void;
    setAllowDanglingEdges(allow: boolean): void;
    setAutoSizeCells(autoSize: boolean): void;
    setCellsLocked(locked: boolean): void;

    // 事件
    addListener(eventName: string, listener: Function): void;

    // 缩放
    zoomIn(): void;
    zoomOut(): void;
    zoomTo(scale: number): void;
  }

  export class mxGraphModel {
    beginUpdate(): void;
    endUpdate(): void;
    getChildCount(parent: any): number;
  }

  export class mxGraphView {
    getScale(): number;
    setScale(scale: number): void;
  }

  export class mxStylesheet {
    getDefaultVertexStyle(): any;
    getDefaultEdgeStyle(): any;
    putDefaultVertexStyle(style: any): void;
    putDefaultEdgeStyle(style: any): void;
  }

  // 工具类
  export class mxUtils {
    static createDataUri(data: string): string;
    static makeColor(color: string, alpha?: number): string;
    static setCellStyles(stylesheet: any, key: string, value: string): void;
  }

  // 事件类
  export class mxEvent {
    static CLICK: string;
    static DOUBLE_CLICK: string;
    static CHANGE: string;
    static EDIT: string;
  }

  export class mxEventObject {
    getProperty(name: string): any;
  }

  // 框选
  export class mxRubberband {
    constructor(graph: mxGraph);
  }

  // 常量
  export class mxConstants {
    // 形状
    static SHAPE_ROUNDED_RECTANGLE: string;
    static SHAPE_RECTANGLE: string;
    static SHAPE_ELLIPSE: string;
    static SHAPE_RHOMBUS: string;

    // 样式键
    static STYLE_SHAPE: string;
    static STYLE_ROUNDED: string;
    static STYLE_ARCSIZE: string;
    static STYLE_FONTCOLOR: string;
    static STYLE_FONTSIZE: string;
    static STYLE_FONTSTYLE: string;
    static STYLE_FILLCOLOR: string;
    static STYLE_STROKECOLOR: string;
    static STYLE_STROKEWIDTH: string;
    static STYLE_SHADOW: string;
    static STYLE_DROP_SHADOW: string;
    static STYLE_PERIMETER: string;
    static STYLE_SPACING_TOP: string;
    static STYLE_SPACING_BOTTOM: string;
    static STYLE_SPACING_LEFT: string;
    static STYLE_SPACING_RIGHT: string;
    static STYLE_LABEL_BACKGROUNDCOLOR: string;
    static STYLE_LABEL_BORDERCOLOR: string;
    static STYLE_EDGE: string;
    static STYLE_ROUNDED: string;
    static STYLE_ENDARROW: string;
    static STYLE_ENDSIZE: string;
    static STYLE_START_SIZE: string;
    static STYLE_DASHED: string;
    static STYLE_DASH_PATTERN: string;

    // 字体样式
    static FONT_BOLD: number;
    static FONT_ITALIC: number;
    static FONT_UNDERLINE: number;

    // 边的样式
    static EDGESTYLE_ORTHOGONAL: string;
    static EDGESTYLE_ELBOW: string;
    static EDGESTYLE_SIDETOSIDE: string;
    static EDGESTYLE_TOPTOBOTTOM: string;

    // 箭头
    static ARROW_CLASSIC: string;
    static ARROW_BLOCK: string;
    static ARROW_OPEN: string;
    static ARROW_NONE: string;

    // 方向
    static DIRECTION_NORTH: string;
    static DIRECTION_SOUTH: string;
    static DIRECTION_EAST: string;
    static DIRECTION_WEST: string;

    // 其他
    static NONE: string;
    static TRUE: string;
    static FALSE: string;
  }

  // 周长函数
  export const mxPerimeter: {
    rectanglePerimeter: any;
    ellipsePerimeter: any;
    rhombusPerimeter: any;
  };

  // 布局类
  export class mxFastOrganicLayout {
    constructor(graph: mxGraph);
    execute(parent: any): void;
    forceConstant: number;
    restricted: boolean;
  }

  export class mxCompactTreeLayout {
    constructor(graph: mxGraph, horizontal?: boolean);
    execute(parent: any): void;
    levelDistance: number;
    nodeDistance: number;
  }

  export class mxHierarchicalLayout {
    constructor(graph: mxGraph, orientation?: string);
    execute(parent: any): void;
    levelDistance: number;
  }

  export class mxLayoutManager {
    constructor(graph: mxGraph);
  }

  // 主函数 - mxgraph 是一个工厂函数，调用它返回配置函数，再调用配置函数返回 mx 对象
  export default function mxgraph(): () => {
    mxGraph: typeof mxGraph;
    mxClient: {
      isBrowserSupported(): boolean;
      init(container: HTMLElement): void;
    };
    mxUtils: typeof mxUtils;
    mxEvent: typeof mxEvent;
    mxConstants: typeof mxConstants;
    mxPerimeter: typeof mxPerimeter;
    mxRubberband: typeof mxRubberband;
    mxFastOrganicLayout: typeof mxFastOrganicLayout;
    mxCompactTreeLayout: typeof mxCompactTreeLayout;
    mxHierarchicalLayout: typeof mxHierarchicalLayout;
    mxLayoutManager: typeof mxLayoutManager;
  };
}
