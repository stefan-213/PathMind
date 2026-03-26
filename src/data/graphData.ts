/**
 * 知识图谱数据
 * 基于不同的学习路径，展示技术知识点之间的关系
 */

export interface GraphNode {
  id: string;
  label: string;
  name: string; // 英文名
  category: 'frontend' | 'backend' | 'ai' | 'devops' | 'basic';
  icon: string;
  difficulty: string;
  heat: string;
  scene: string;
  desc: string;
  tags: string[];
  level?: number; // 0 = 核心, 1 = 进阶, 2 = 扩展
}

export interface GraphEdge {
  source: string;
  target: string;
  type?: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// 完整的图谱数据 - 包含所有节点
const allNodes: GraphNode[] = [
  // Basic
  { id: 'html', name: 'HTML', label: 'HTML', category: 'basic', icon: 'fas fa-file-code', difficulty: '简单', heat: '🔥 高', scene: 'Web开发', desc: '超文本标记语言，用于构建网页结构。', tags: ['标签', '语义化', 'SEO'], level: 0 },
  { id: 'css', name: 'CSS', label: 'CSS', category: 'basic', icon: 'fas fa-palette', difficulty: '简单', heat: '🔥 高', scene: 'Web开发', desc: '层叠样式表，用于控制网页外观和布局。', tags: ['布局', '动画', '响应式'], level: 0 },
  { id: 'javascript', name: 'JavaScript', label: 'JavaScript', category: 'basic', icon: 'fab fa-js', difficulty: '中等', heat: '🔥 极高', scene: '全栈开发', desc: '网页脚本语言，可运行于浏览器和服务器端。', tags: ['动态', '异步', 'ES6+'], level: 0 },
  { id: 'typescript', name: 'TypeScript', label: 'TypeScript', category: 'basic', icon: 'fas fa-gem', difficulty: '中等', heat: '🔥 高', scene: '企业级开发', desc: 'JavaScript 超集，提供静态类型系统。', tags: ['类型', 'IDE支持', '重构'], level: 1 },

  // Frontend
  { id: 'react', name: 'React', label: 'React', category: 'frontend', icon: 'fab fa-react', difficulty: '中等', heat: '🔥 极高', scene: 'UI开发', desc: 'Facebook 开发的用于构建用户界面的 JavaScript 库。', tags: ['组件化', '虚拟DOM', 'Hooks'], level: 0 },
  { id: 'vue', name: 'Vue', label: 'Vue', category: 'frontend', icon: 'fab fa-vuejs', difficulty: '简单', heat: '🔥 高', scene: 'UI开发', desc: '渐进式 JavaScript 框架，易于上手。', tags: ['响应式', '单文件组件', 'Vue3'], level: 0 },
  { id: 'nextjs', name: 'Next.js', label: 'Next.js', category: 'frontend', icon: 'fas fa-caret-up', difficulty: '中等', heat: '🔥 高', scene: '全栈开发', desc: '基于 React 的全栈框架，支持 SSR/SSG。', tags: ['SSR', '文件系统路由', 'API'], level: 1 },
  { id: 'vite', name: 'Vite', label: 'Vite', category: 'frontend', icon: 'fas fa-bolt', difficulty: '简单', heat: '🔥 高', scene: '开发工具', desc: '下一代前端构建工具，极速开发体验。', tags: ['热更新', 'ES Modules', '构建'], level: 1 },
  { id: 'tailwind', name: 'Tailwind', label: 'Tailwind', category: 'frontend', icon: 'fas fa-wind', difficulty: '简单', heat: '🔥 高', scene: 'UI开发', desc: '实用优先的 CSS 框架。', tags: ['原子化', '自定义', 'JIT'], level: 2 },

  // Backend
  { id: 'nodejs', name: 'Node.js', label: 'Node.js', category: 'backend', icon: 'fab fa-node-js', difficulty: '中等', heat: '🔥 高', scene: '后端开发', desc: '基于 Chrome V8 的 JavaScript 运行时。', tags: ['异步', '事件驱动', 'I/O'], level: 1 },
  { id: 'python', name: 'Python', label: 'Python', category: 'backend', icon: 'fab fa-python', difficulty: '简单', heat: '🔥 极高', scene: 'AI/后端', desc: '简洁优雅的编程语言，AI 领域首选。', tags: ['易学', '库丰富', 'AI'], level: 0 },
  { id: 'fastapi', name: 'FastAPI', label: 'FastAPI', category: 'backend', icon: 'fas fa-rocket', difficulty: '中等', heat: '🔥 高', scene: 'API开发', desc: '现代 Python Web 框架，高性能。', tags: ['异步', '类型提示', '自动化文档'], level: 1 },
  { id: 'express', name: 'Express', label: 'Express', category: 'backend', icon: 'fas fa-diamond', difficulty: '简单', heat: '🔥 高', scene: 'API开发', desc: 'Node.js 最小化 Web 框架。', tags: ['简洁', '中间件', '路由'], level: 2 },

  // AI
  { id: 'langchain', name: 'LangChain', label: 'LangChain', category: 'ai', icon: 'fas fa-link', difficulty: '高', heat: '🔥 极高', scene: 'AI应用', desc: '构建 AI 应用的框架，简化 LLM 集成。', tags: ['LLM', 'Agent', 'Chain'], level: 1 },
  { id: 'llamaindex', name: 'LlamaIndex', label: 'LlamaIndex', category: 'ai', icon: 'fas fa-book', difficulty: '中等', heat: '🔥 高', scene: '知识库', desc: '专为 RAG 设计的索引框架。', tags: ['RAG', '索引', '检索'], level: 1 },
  { id: 'rag', name: 'RAG', label: 'RAG', category: 'ai', icon: 'fas fa-search', difficulty: '中等', heat: '🔥 极高', scene: '知识库问答', desc: '检索增强生成，结合检索与生成。', tags: ['知识库', '向量检索', 'LLM'], level: 0 },
  { id: 'agent', name: 'Agent', label: 'Agent', category: 'ai', icon: 'fas fa-robot', difficulty: '高', heat: '🔥 高', scene: 'AI应用', desc: 'AI 代理，能自主决策和执行任务。', tags: ['自主决策', '工具调用', '多步骤'], level: 2 },
  { id: 'embedding', name: 'Embedding', label: 'Embedding', category: 'ai', icon: 'fas fa-chart-bar', difficulty: '高', heat: '🔥 高', scene: '向量表示', desc: '将文本转换为向量表示。', tags: ['向量', '语义', '相似度'], level: 1 },

  // DevOps
  { id: 'docker', name: 'Docker', label: 'Docker', category: 'devops', icon: 'fab fa-docker', difficulty: '中等', heat: '🔥 极高', scene: '容器化', desc: '容器化平台，应用打包和部署。', tags: ['容器', '镜像', '镜像仓库'], level: 2 },
  { id: 'git', name: 'Git', label: 'Git', category: 'devops', icon: 'fas fa-box', difficulty: '简单', heat: '🔥 极高', scene: '版本控制', desc: '分布式版本控制系统。', tags: ['分支', '合并', '协作'], level: 0 },
];

const allEdges: GraphEdge[] = [
  // Basic -> Frontend
  { source: 'html', target: 'css', type: '依赖' },
  { source: 'html', target: 'javascript', type: '依赖' },
  { source: 'css', target: 'javascript', type: '进阶' },
  { source: 'javascript', target: 'typescript', type: '进阶' },

  // Frontend relationships
  { source: 'javascript', target: 'react', type: '依赖' },
  { source: 'javascript', target: 'vue', type: '依赖' },
  { source: 'javascript', target: 'vite', type: '工具' },
  { source: 'react', target: 'nextjs', type: '进阶' },
  { source: 'react', target: 'tailwind', type: '组合' },
  { source: 'vue', target: 'vite', type: '工具' },
  { source: 'typescript', target: 'react', type: '组合' },
  { source: 'typescript', target: 'vue', type: '组合' },
  { source: 'typescript', target: 'nextjs', type: '组合' },

  // Backend relationships
  { source: 'javascript', target: 'nodejs', type: '后端' },
  { source: 'javascript', target: 'express', type: '工具' },
  { source: 'python', target: 'fastapi', type: '工具' },
  { source: 'nodejs', target: 'express', type: '进阶' },
  { source: 'python', target: 'nodejs', type: '替代' },

  // AI relationships
  { source: 'python', target: 'langchain', type: '工具' },
  { source: 'python', target: 'llamaindex', type: '工具' },
  { source: 'python', target: 'embedding', type: '进阶' },
  { source: 'langchain', target: 'rag', type: '实现' },
  { source: 'langchain', target: 'agent', type: '进阶' },
  { source: 'llamaindex', target: 'rag', type: '实现' },
  { source: 'rag', target: 'embedding', type: '依赖' },
  { source: 'agent', target: 'langchain', type: '依赖' },

  // DevOps
  { source: 'javascript', target: 'git', type: '工具' },
  { source: 'python', target: 'git', type: '工具' },
  { source: 'nodejs', target: 'docker', type: '部署' },
  { source: 'python', target: 'docker', type: '部署' },
  { source: 'docker', target: 'git', type: '组合' },
];

// 目标映射
const goalMapping: Record<string, { keywords: string[]; corePath: string[] }> = {
  'ai应用': {
    keywords: ['ai', '大模型', 'llm', 'gpt', '知识库', 'rag', 'agent'],
    corePath: ['python', 'langchain', 'rag', 'embedding', 'llamaindex', 'fastapi'],
  },
  '企业官网': {
    keywords: ['官网', '企业', '网站', '展示'],
    corePath: ['html', 'css', 'javascript', 'react', 'nextjs', 'tailwind', 'vite'],
  },
  '前端学习': {
    keywords: ['前端', '前端学习', 'react', 'vue', 'web开发'],
    corePath: ['html', 'css', 'javascript', 'typescript', 'react', 'vue', 'vite'],
  },
  '后端': {
    keywords: ['后端', '后端开发', 'api', '服务器'],
    corePath: ['python', 'nodejs', 'javascript', 'fastapi', 'express'],
  },
  '电商': {
    keywords: ['电商', '小程序', '商城', '购物'],
    corePath: ['javascript', 'react', 'nodejs', 'express', 'python'],
  },
};

// 获取过滤后的图谱数据
export function getFilteredGraphData(goal: string): { nodes: GraphNode[]; edges: GraphEdge[]; corePath: string[] } {
  if (!goal) {
    return { nodes: allNodes, edges: allEdges, corePath: [] };
  }

  const lowerGoal = goal.toLowerCase();
  let targetMapping = null;

  for (const [_key, mapping] of Object.entries(goalMapping)) {
    if (mapping.keywords.some(k => lowerGoal.includes(k))) {
      targetMapping = mapping;
      break;
    }
  }

  if (!targetMapping) {
    return { nodes: allNodes, edges: allEdges, corePath: [] };
  }

  const nodeIds = new Set(targetMapping.corePath);
  const filteredNodes = allNodes.filter(n => nodeIds.has(n.id));

  const filteredEdges = allEdges.filter(e => {
    return nodeIds.has(e.source) && nodeIds.has(e.target);
  });

  return {
    nodes: filteredNodes,
    edges: filteredEdges,
    corePath: targetMapping.corePath,
  };
}

// 获取图谱数据 (兼容旧接口)
export function getGraphData(goal: string): GraphData {
  const data = getFilteredGraphData(goal);
  return { nodes: data.nodes, edges: data.edges };
}

// 获取显示名称
export function getGoalName(goal: string): string {
  const lowerGoal = goal.toLowerCase();
  if (lowerGoal.includes('ai') || lowerGoal.includes('大模型')) return 'AI 应用开发';
  if (lowerGoal.includes('官网') || lowerGoal.includes('企业')) return '企业官网';
  if (lowerGoal.includes('前端') || lowerGoal.includes('学习')) return '前端学习';
  if (lowerGoal.includes('后端')) return '后端开发';
  if (lowerGoal.includes('电商') || lowerGoal.includes('小程序')) return '电商/小程序';
  return '全部技术';
}

// 分类名称
export function getCategoryName(cat: string): string {
  const names: Record<string, string> = {
    frontend: '前端',
    backend: '后端',
    ai: 'AI',
    devops: 'DevOps',
    basic: '基础',
  };
  return names[cat] || cat;
}

// 分类颜色映射
export const categoryColors: Record<string, string> = {
  frontend: '#3b82f6',
  backend: '#8b5cf6',
  ai: '#f59e0b',
  devops: '#ef4444',
  basic: '#64748b',
};

// 分类统计数据
export const categoryStats = {
  frontend: allNodes.filter(n => n.category === 'frontend').length,
  backend: allNodes.filter(n => n.category === 'backend').length,
  ai: allNodes.filter(n => n.category === 'ai').length,
  devops: allNodes.filter(n => n.category === 'devops').length,
  basic: allNodes.filter(n => n.category === 'basic').length,
};

// 获取所有节点
export function getAllNodes(): GraphNode[] {
  return allNodes;
}

// 获取所有边
export function getAllEdges(): GraphEdge[] {
  return allEdges;
}
