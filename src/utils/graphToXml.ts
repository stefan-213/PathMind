/**
 * GraphData 到 draw.io XML 格式的转换工具
 */
import type { GraphData, GraphNode, GraphEdge } from '../types/graph';

/**
 * 将 GraphData 转换为 draw.io XML 格式
 */
export function graphToDrawioXml(data: GraphData): string {
  const { nodes, edges } = data;

  // 计算节点位置（基于层级布局）
  const nodePositions = calculateNodePositions(nodes, edges);

  // 生成节点 XML（ID 从 2 开始，0 和 1 保留给根节点）
  const nodeCells = nodes.map((node, index) => {
    const pos = nodePositions.get(node.id) || { x: 100, y: 100 };
    const style = buildNodeStyle(node);
    return `      <mxCell id="${index + 2}" value="${escapeXml(node.label)}" style="${style}" vertex="1">
        <mxGeometry x="${pos.x}" y="${pos.y}" width="120" height="50" as="geometry" />
      </mxCell>`;
  }).join('\n');

  // 生成边 XML（source/target 引用节点的实际索引 ID）
  const nodeIdMap = new Map(nodes.map((node, index) => [node.id, index + 2]));
  const edgeCells = edges.map((edge, index) => {
    const style = buildEdgeStyle(edge);
    const label = edge.label ? `&lt;div&gt;${escapeXml(edge.label)}&lt;/div&gt;` : '';
    const sourceId = nodeIdMap.get(edge.source) ?? 2;
    const targetId = nodeIdMap.get(edge.target) ?? 2;
    return `      <mxCell id="${nodes.length + index + 2}" value="${label}" style="${style}" edge="1" source="${sourceId}" target="${targetId}">
        <mxGeometry relative="1" as="geometry" />
      </mxCell>`;
  }).join('\n');

  // 组装完整 XML
  // 根节点 id="0" 和 id="1" 是 draw.io 要求的保留节点
  const xml = `<mxfile host="app.diagrams.net">
  <diagram name="Page-1">
    <mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1200" pageHeight="800">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
${nodeCells}
${edgeCells}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;

  return xml;
}

/**
 * 计算节点位置（基于层级布局）
 */
function calculateNodePositions(nodes: GraphNode[], edges: GraphEdge[]): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const levels = new Map<string, number>();

  // 计算每个节点的层级（从根节点开始）
  const rootNodes = nodes.filter((n) => !edges.some((e) => e.target === n.id));
  rootNodes.forEach((n) => levels.set(n.id, 0));

  // BFS 计算层级
  let changed = true;
  while (changed) {
    changed = false;
    for (const edge of edges) {
      const sourceLevel = levels.get(edge.source) ?? -1;
      const targetLevel = levels.get(edge.target) ?? -1;
      if (sourceLevel >= 0 && targetLevel < sourceLevel + 1) {
        levels.set(edge.target, sourceLevel + 1);
        changed = true;
      }
    }
  }

  // 按层级分组
  const levelGroups = new Map<number, GraphNode[]>();
  for (const node of nodes) {
    const level = levels.get(node.id) ?? 0;
    if (!levelGroups.has(level)) {
      levelGroups.set(level, []);
    }
    levelGroups.get(level)!.push(node);
  }

  // 分配位置
  for (const [level, nodesAtLevel] of levelGroups) {
    const y = 100 + level * 120;
    nodesAtLevel.forEach((node, index) => {
      positions.set(node.id, {
        x: 100 + index * 180,
        y,
      });
    });
  }

  return positions;
}

/**
 * 构建节点样式
 */
function buildNodeStyle(node: GraphNode): string {
  const parts: string[] = [
    'rounded=1',
    'whiteSpace=wrap',
    'html=1',
    'fontSize=13',
    'fontStyle=1',
  ];

  // 颜色
  const fillColor = node.color || '#667eea';
  parts.push(`fillColor=${fillColor}`);
  parts.push('strokeColor=#5569d4');
  parts.push('strokeWidth=2');

  // 文字颜色
  const fontColor = node.textColor || '#ffffff';
  parts.push(`fontColor=${fontColor}`);

  // 阴影
  parts.push('shadow=1');
  parts.push('dropShadow=1');

  return parts.join(';');
}

/**
 * 构建边样式
 */
function buildEdgeStyle(edge: GraphEdge): string {
  const parts: string[] = [
    'rounded=1',
    'orthogonal=1',
    'endArrow=classic',
    'endFill=1',
    'startSize=8',
    'endSize=8',
  ];

  // 线条类型
  if (edge.type === 'dashed') {
    parts.push('dashed=1');
  } else if (edge.type === 'dotted') {
    parts.push('dashed=1');
    parts.push('dashPattern=1');
  }

  // 字体颜色
  parts.push('fontColor=#6b7280');
  parts.push('fontSize=11');

  return parts.join(';');
}

/**
 * XML 特殊字符转义
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}