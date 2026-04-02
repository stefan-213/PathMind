# AI 智能图表生成与实时对话系统

## 一、需求分析

### 1.1 项目背景

当前系统已有基于 D3.js 的知识图谱展示功能，用户可以查看技术节点之间的关系。但缺乏 **AI 驱动的智能图表生成能力**，用户无法通过自然语言描述让 AI 自动生成各种可视化内容。

### 1.2 核心需求

| 需求类型 | 描述 |
|---------|------|
| 图表生成 | 用户通过自然语言描述需求，AI 分析意图并生成对应的图表数据 |
| 智能适配 | AI 根据内容自动决定图表类型（路线图/流程图/框架图等），返回统一格式数据 |
| 可视化渲染 | 前端接收 AI 返回的数据，无条件渲染到网页中 |
| 实时对话 | 右侧 AI 对话面板，支持实时交互修改图表 |
| 图表更新 | AI 根据对话内容动态更新图表，前端只负责渲染 |

### 1.3 核心原则

```
关键理解：前端是"哑终端"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AI 返回什么格式 → 后端决定
返回什么图表类型 → AI 决定
前端职责 → 接收数据 → 渲染图表
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 1.4 用户故事

```
作为一名用户：
我想要通过自然语言描述（如"帮我画一个 React 技术路线图"）
以便 AI 自动生成并渲染可视化图表

我还想：
在生成图表后，通过右侧 AI 对话框提出修改意见
AI 理解我的意图并更新图表，前端自动重新渲染
```

### 1.5 功能模块划分

```
┌─────────────────────────────────────────────────────────────┐
│                      GraphPage 页面                          │
├───────────────────────────────┬─────────────────────────────┤
│                               │                             │
│     左侧：图表渲染区域          │     右侧：AI 对话面板        │
│     - 接收并渲染任何图表类型     │     - 消息列表              │
│     - D3.js SVG 渲染           │     - 输入框                │
│     - 节点/边交互               │     - 发送按钮               │
│     - 缩放/拖拽                │                             │
│                               │                             │
└───────────────────────────────┴─────────────────────────────┘
```

### 1.6 数据流

```
┌─────────────────────────────────────────────────────────────┐
│                         用户输入                           │
│                    "帮我画一个 React 路线图"                  │
└─────────────────────────────┬─────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                     AI 大模型分析                           │
│            决定图表类型：roadmap / flowchart 等              │
└─────────────────────────────┬─────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   后端返回统一格式数据                        │
│           AI 决定返回什么类型，前端就渲染什么类型              │
└─────────────────────────────┬─────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    前端接收并渲染                            │
│              无条件渲染 AI 返回的图表数据                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 二、实现步骤

### 2.1 统一图表数据模型

无论 AI 返回什么类型的图表，前端使用统一的数据结构：

```typescript
// src/types/graph.ts

/**
 * 统一图表数据模型
 * AI 返回任意图表类型，前端统一使用此结构渲染
 */
export interface GraphData {
  type: string;           // 图表类型（由 AI 决定：roadmap/flowchart/framework/tree 等）
  title: string;          // 图表标题
  nodes: GraphNode[];     // 节点列表
  edges: GraphEdge[];     // 边列表
  layout: 'force' | 'tree' | 'timeline' | 'grid';  // 布局类型
  metadata?: Record<string, any>;  // AI 返回的额外元数据
}

export interface GraphNode {
  id: string;
  label: string;          // 节点显示文字
  description?: string;   // 节点描述
  category?: string;      // 节点分类（用于着色）
  color?: string;         // 节点颜色（AI 指定）
  icon?: string;          // 节点图标
  level?: number;        // 层级（用于树形/时间轴布局）
  position?: 'left' | 'center' | 'right';  // 位置（用于路线图）
}

export interface GraphEdge {
  source: string;        // 源节点 ID
  target: string;        // 目标节点 ID
  label?: string;        // 边标签
  type?: 'solid' | 'dashed' | 'dotted';  // 线条类型
}
```

### 2.2 架构设计

```
┌──────────────────────────────────────────────────────────────┐
│                        前端 (React)                          │
├──────────────────────────────────────────────────────────────┤
│  GraphPage                                                    │
│  ├── GraphCanvas  ← 通用渲染器，接收任意 GraphData             │
│  ├── AISidePanel  ← 对话面板                                 │
│  └── LayoutRenderer ← 根据 layout 自动选择布局算法            │
│                                                                │
│  stores/                                                      │
│  ├── graphStore  ← 存储当前图表数据（无差别）                  │
│  └── chatStore   ← 存储对话历史                              │
│                                                                │
│  api/                                                          │
│  └── ai.ts     ← chatWithAI (对话，AI 返回图表数据)           │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│                     后端 (Spring Boot)                       │
├──────────────────────────────────────────────────────────────┤
│  AIController                                                 │
│  └── POST /api/agent/chatStream                              │
│       │                                                       │
│       │ AI 分析用户意图                                        │
│       │ 如果需要图表 → 返回 GraphData JSON                     │
│       │ 普通对话 → 返回普通文本                                 │
│       ↓                                                       │
│  返回统一格式给前端                                              │
└──────────────────────────────────────────────────────────────┘
```

### 2.3 前端实现步骤

#### 步骤 1：创建图表数据 Store

```typescript
// src/stores/graphStore.ts
import { create } from 'zustand';
import type { GraphData } from '../types/graph';

interface GraphState {
  // 当前图表数据（AI 返回什么就存什么）
  graphData: GraphData | null;
  isLoading: boolean;

  setGraphData: (data: GraphData | null) => void;
  clearGraph: () => void;
  setLoading: (loading: boolean) => void;
}

export const useGraphStore = create<GraphState>((set) => ({
  graphData: null,
  isLoading: false,

  setGraphData: (data) => set({ graphData: data }),

  clearGraph: () => set({ graphData: null }),

  setLoading: (isLoading) => set({ isLoading }),
}));
```

#### 步骤 2：创建对话 Store

```typescript
// src/stores/chatStore.ts
import { create } from 'zustand';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  hasGraph?: boolean;      // 标记此消息是否包含图表数据
  timestamp: number;
}

interface ChatState {
  messages: ChatMessage[];
  sessionId: string | null;
  isLoading: boolean;

  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  setMessages: (messages: ChatMessage[]) => void;
  setSessionId: (sessionId: string) => void;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  sessionId: null,
  isLoading: false,

  addMessage: (message) => set((state) => ({
    messages: [...state.messages, {
      ...message,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    }]
  })),

  setMessages: (messages) => set({ messages }),
  setSessionId: (sessionId) => set({ sessionId }),
  setLoading: (isLoading) => set({ isLoading }),
  clearMessages: () => set({ messages: [], sessionId: null }),
}));
```

#### 步骤 3：扩展 AI API

```typescript
// src/api/ai.ts

export interface AIChatRequest {
  agentId: string;
  sessionId: string;
  message: string;
}

export interface AIChatResponse {
  message: string;
  graphData?: GraphData;  // AI 可选返回图表数据
}

/**
 * AI 对话
 * AI 可能返回纯文本，也可能返回图表数据
 */
export const chatWithAI = (data: AIChatRequest) => {
  return post<AIChatResponse>('/api/agent/chatStream', data);
};

/**
 * 创建会话
 */
export const createSession = (agentId: string) => {
  return post<{ sessionId: string }>('/api/agent/createSession', { agentId });
};
```

#### 步骤 4：重构 GraphPage

```typescript
// src/pages/Graph/GraphPage.tsx
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header, Footer } from '../../components/layout';
import { AISidePanel } from './AISidePanel';
import { GraphCanvas } from './GraphCanvas';
import { useGraphStore } from '../../stores/graphStore';
import { useChatStore } from '../../stores/chatStore';
import { createSession } from '../../api/ai';
import './GraphPage.scss';

export function GraphPage() {
  const [searchParams] = useSearchParams();
  const goalParam = searchParams.get('goal') || '';

  const { graphData, setGraphData } = useGraphStore();
  const { messages, addMessage, setLoading, sessionId, setSessionId } = useChatStore();
  const [isPanelOpen, setIsPanelOpen] = useState(true);

  const profile = getUserProfile();
  const goal = goalParam || profile?.goal || '';

  // 初始化会话
  useEffect(() => {
    const initSession = async () => {
      try {
        const res = await createSession('100001');
        setSessionId(res.data?.sessionId);
      } catch (e) {
        console.error('创建会话失败', e);
      }
    };
    initSession();
  }, []);

  // 处理 AI 返回的消息
  const handleAIMessage = (content: string, graphDataFromAI?: GraphData) => {
    // AI 返回图表数据 → 更新图表
    if (graphDataFromAI) {
      setGraphData(graphDataFromAI);
    }
  };

  return (
    <div className="graph-page">
      <Header />

      <div className="graph-main">
        {/* 左侧：通用图表渲染区域 */}
        <div className={`graph-canvas-area ${isPanelOpen ? 'with-panel' : ''}`}>
          <GraphCanvas data={graphData} />
        </div>

        {/* 右侧：AI 对话面板 */}
        {isPanelOpen && (
          <AISidePanel
            onGraphUpdate={setGraphData}
          />
        )}

        <button
          className="panel-toggle"
          onClick={() => setIsPanelOpen(!isPanelOpen)}
        >
          <i className={`fas fa-chevron-${isPanelOpen ? 'right' : 'left'}`}></i>
        </button>
      </div>

      <Footer />
    </div>
  );
}
```

#### 步骤 5：创建通用图表渲染组件

```typescript
// src/pages/Graph/GraphCanvas.tsx
import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { GraphData, GraphNode } from '../../types/graph';
import './GraphCanvas.scss';

interface GraphCanvasProps {
  data: GraphData | null;
  onNodeClick?: (node: GraphNode) => void;
}

export function GraphCanvas({ data, onNodeClick }: GraphCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !data) return;

    const svg = d3.select(svgRef.current);
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 清空
    svg.selectAll('*').remove();

    // 创建节点映射
    const nodeMap = new Map(data.nodes.map(n => [n.id, n]));

    // D3 数据转换
    const d3Nodes = data.nodes.map((n, i) => ({
      ...n,
      x: width / 2 + (Math.random() - 0.5) * 200,
      y: height / 2 + (Math.random() - 0.5) * 200,
    }));

    const d3Links = data.edges
      .filter(e => nodeMap.has(e.source) && nodeMap.has(e.target))
      .map(e => ({
        source: nodeMap.get(e.source)!,
        target: nodeMap.get(e.target)!,
        label: e.label,
      }));

    const g = svg.append('g');

    // 缩放
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on('zoom', (event) => g.attr('transform', event.transform));
    svg.call(zoom);

    // 根据 AI 返回的 layout 选择渲染方式
    let simulation;
    if (data.layout === 'tree') {
      // 树形布局
      simulation = createTreeLayout(g, d3Nodes, d3Links, width, height);
    } else if (data.layout === 'timeline') {
      // 时间轴布局
      simulation = createTimelineLayout(g, d3Nodes, d3Links, width, height);
    } else {
      // 默认力导向布局
      simulation = createForceLayout(g, d3Nodes, d3Links, width, height);
    }

    // 渲染边
    const link = g.append('g')
      .selectAll('line')
      .data(d3Links)
      .enter()
      .append('line')
      .attr('class', 'link')
      .attr('stroke', '#ddd')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', d => d.type === 'dashed' ? '5,5' : 'none');

    // 渲染节点
    const node = g.append('g')
      .selectAll('g')
      .data(d3Nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .call(d3.drag<SVGGElement, any>()
        .on('start', (event, d) => {
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (_, d) => {
          d.fx = null;
          d.fy = null;
        }));

    // 节点圆形
    node.append('circle')
      .attr('r', 30)
      .attr('fill', d => d.color || '#3B82F6');

    // 节点文字
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 45)
      .text(d => d.label);

    // 边标签
    link.filter(d => d.label)
      .append('text')
      .attr('class', 'edge-label')
      .text(d => d.label);

    node.on('click', (_, d) => onNodeClick?.(d));

    // 更新位置
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    return () => simulation.stop();
  }, [data, onNodeClick]);

  return (
    <div className="graph-canvas" ref={containerRef}>
      <svg ref={svgRef} className="graph-svg" />
      {!data && (
        <div className="empty-graph">
          <i className="fas fa-project-diagram"></i>
          <p>在右侧输入需求，让 AI 为你生成图表</p>
        </div>
      )}
    </div>
  );
}

// 力导向布局
function createForceLayout(g: any, nodes: any[], links: any[], width: number, height: number) {
  return d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id((d: any) => d.id).distance(120))
    .force('charge', d3.forceManyBody().strength(-500))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide().radius(50));
}

// 树形布局
function createTreeLayout(g: any, nodes: any[], links: any[], width: number, height: number) {
  const root = { x: width / 2, y: 50, children: [] };
  // 构建树结构...
  return d3.tree().size([width - 100, height - 100])(d3.hierarchy(root));
}

// 时间轴布局
function createTimelineLayout(g: any, nodes: any[], links: any[], width: number, height: number) {
  return d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id((d: any) => d.id).distance(150))
    .force('x', d3.forceX(width / 2).strength(0.1))
    .force('y', d3.forceY(height / 2));
}
```

#### 步骤 6：创建 AI 对话面板

```typescript
// src/pages/Graph/AISidePanel.tsx
import { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { useGraphStore } from '../../stores/graphStore';
import { chatWithAI } from '../../api/ai';
import type { GraphData } from '../../types/graph';
import './AISidePanel.scss';

interface AISidePanelProps {
  onGraphUpdate: (data: GraphData) => void;
}

export function AISidePanel({ onGraphUpdate }: AISidePanelProps) {
  const { messages, addMessage, setLoading, sessionId } = useChatStore();
  const { setLoading: setGraphLoading } = useGraphStore();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !sessionId) return;

    const userMessage = input.trim();
    setInput('');
    addMessage({ role: 'user', content: userMessage });
    setLoading(true);
    setGraphLoading(true);

    try {
      const res = await chatWithAI({
        agentId: '100001',
        sessionId,
        message: userMessage
      });

      const response = res.data;
      const aiContent = response.message || '';
      const graphData = response.graphData;

      // 添加 AI 消息
      addMessage({
        role: 'assistant',
        content: aiContent,
        hasGraph: !!graphData
      });

      // 如果 AI 返回了图表数据，更新图表
      if (graphData) {
        onGraphUpdate(graphData);
      }
    } catch (err) {
      addMessage({
        role: 'assistant',
        content: '抱歉，发生了错误：' + (err as Error).message
      });
    } finally {
      setLoading(false);
      setGraphLoading(false);
    }
  };

  return (
    <div className="ai-side-panel">
      <div className="panel-header">
        <h3><i className="fas fa-comment-dots"></i> AI 助手</h3>
        <p className="panel-hint">描述你想要的技术图表，AI 会自动分析并生成</p>
      </div>

      <div className="messages-container">
        {messages.length === 0 && (
          <div className="empty-state">
            <i className="fas fa-lightbulb"></i>
            <p>例如："帮我画一个前端学习路线图"</p>
            <p>AI 会分析你的需求，自动选择合适的图表类型</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.role}`}>
            <div className="message-avatar">
              {msg.role === 'user' ? <i className="fas fa-user"></i> : <i className="fas fa-robot"></i>}
            </div>
            <div className="message-content">
              <div className="message-text">{msg.content}</div>
              {msg.hasGraph && (
                <div className="graph-indicator">
                  <i className="fas fa-chart-pie"></i> 已生成图表
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-area">
        <textarea
          className="message-input"
          placeholder="描述你想要的技术图表..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <button className="send-btn" onClick={handleSend} disabled={!input.trim()}>
          <i className="fas fa-paper-plane"></i>
        </button>
      </div>
    </div>
  );
}
```

### 2.4 后端接口设计

```java
// 后端 Java 代码示例

@RestController
@RequestMapping("/api/agent")
public class AIController {

    @Autowired
    private AIService aiService;

    /**
     * AI 对话接口
     * AI 分析用户意图，可能返回纯文本或图表数据
     */
    @PostMapping("/chatStream")
    public ApiResponse<AIChatResponse> chat(@RequestBody ChatRequest request) {
        // 调用 AI
        String aiResponse = aiService.chat(request.getMessage(), request.getSessionId());

        // 解析 AI 返回内容
        // 如果包含图表指令，提取图表数据
        AIChatResponse response = parseAIResponse(aiResponse);

        return ApiResponse.success(response);
    }
}

// AI 返回格式示例
class AIChatResponse {
    private String message;          // 对话文本
    private GraphData graphData;      // 图表数据（AI 可选返回）
}

// GraphData 结构
class GraphData {
    private String type;              // 图表类型
    private String title;            // 标题
    private List<GraphNode> nodes;   // 节点
    private List<GraphEdge> edges;   // 边
    private String layout;           // 布局
}
```

### 2.5 AI Prompt 设计

后端需要设计 Prompt 让 AI 返回统一格式：

```
你是一个专业的技术图表生成助手。

当用户请求生成图表时（如"画一个xxx路线图"、"帮我可视化xxx"），你应该：
1. 分析用户需求，决定图表类型
2. 生成对应的节点和边数据
3. 以以下 JSON 格式返回：

{
  "type": "roadmap",  // 或 flowchart, framework, tree 等
  "title": "图表标题",
  "nodes": [
    {"id": "1", "label": "节点1", "category": "前端", "color": "#3B82F6"}
  ],
  "edges": [
    {"source": "1", "target": "2", "label": "依赖"}
  ],
  "layout": "force"  // 或 tree, timeline, grid
}

如果用户只是普通对话，不涉及图表，则只返回对话文本。
```

---

## 三、优化方案

### 3.1 渲染优化

| 优化项 | 方案 | 效果 |
|--------|------|------|
| 大图表 | 超过 100 节点时使用 Canvas 渲染 | 性能提升 10x |
| 增量更新 | AI 更新时只 diff 变化部分 | 减少重绘 |
| 防抖渲染 | 连续快速更新时合并渲染 | 避免卡顿 |

### 3.2 布局增强

```typescript
// 根据 AI 返回的 layout 选择渲染策略
const layoutStrategies = {
  force: createForceSimulation,   // 力导向 - 通用
  tree: createTreeLayout,         // 树形 - 层级结构
  timeline: createTimelineLayout, // 时间轴 - 阶段式
  grid: createGridLayout,          // 网格 - 分类展示
  circular: createCircularLayout,  // 环形 - 循环依赖
};
```

### 3.3 节点样式扩展

```typescript
// 支持 AI 指定更多样式
interface GraphNode {
  id: string;
  label: string;
  color?: string;        // 背景色
  textColor?: string;   // 文字色
  size?: number;         // 节点大小
  shape?: 'circle' | 'rect' | 'diamond';  // 形状
  icon?: string;         // 图标
  level?: number;        // 层级（用于 timeline/tree）
}
```

---

## 四、测试方案

### 4.1 单元测试

```typescript
// src/__tests__/graphStore.test.ts
test('应该存储任意格式的图表数据', () => {
  const { result } = renderHook(() => useGraphStore());

  const roadmapData = {
    type: 'roadmap',
    title: 'React 路线图',
    nodes: [...],
    edges: [...],
    layout: 'timeline',
  };

  act(() => result.current.setGraphData(roadmapData));
  expect(result.current.graphData.type).toBe('roadmap');

  // AI 返回不同类型，前端也能正常处理
  const flowchartData = {
    type: 'flowchart',
    title: '登录流程',
    nodes: [...],
    edges: [...],
    layout: 'force',
  };

  act(() => result.current.setGraphData(flowchartData));
  expect(result.current.graphData.type).toBe('flowchart');
});
```

### 4.2 集成测试

```typescript
// 测试 AI 返回图表数据后的渲染
test('AI 返回图表数据后应正确渲染', async () => {
  // Mock AI 返回
  mockChatWithAI.mockResolvedValue({
    data: {
      message: '已为你生成图表',
      graphData: {
        type: 'roadmap',
        title: '测试图表',
        nodes: [
          { id: '1', label: 'Node 1', color: '#3B82F6' },
          { id: '2', label: 'Node 2', color: '#10B981' },
        ],
        edges: [
          { source: '1', target: '2' },
        ],
        layout: 'force',
      }
    }
  });

  render(<GraphPage />);

  // 发送消息
  const input = screen.getByPlaceholderText('描述你想要的技术图表...');
  fireEvent.change(input, { target: { value: '画一个测试图' } });
  fireEvent.click(screen.getByRole('button', { name: /send/i }));

  // 等待图表渲染
  await waitFor(() => {
    expect(screen.getByText('Node 1')).toBeInTheDocument();
    expect(screen.getByText('Node 2')).toBeInTheDocument();
  });
});
```

---

## 五、总结

### 核心原则

```
1. 前端"哑终端"：只负责接收数据、渲染图表
2. AI 决定图表类型：后端 Prompt 引导 AI 返回统一格式
3. 统一数据模型：GraphData 接口定义所有图表类型
4. 自动适配：前端根据 layout 自动选择 D3 布局算法
```

### 数据流

```
用户输入 → AI 分析意图 → AI 决定图表类型
    ↓
后端返回 GraphData（统一格式）
    ↓
前端接收 → 解析 layout → 选择 D3 布局 → 渲染
```

### 实现优先级

| 阶段 | 内容 | 时间 |
|------|------|------|
| Phase 1 | GraphData 类型定义、Store 创建 | 1 天 |
| Phase 2 | GraphCanvas 通用渲染器 | 2 天 |
| Phase 3 | AISidePanel 对话面板 | 1 天 |
| Phase 4 | 后端接口 + AI Prompt 调优 | 2 天 |
| Phase 5 | 测试与优化 | 1 天 |
