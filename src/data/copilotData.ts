import type { Question, ResultData } from '../types/copilot';

export const questionnaireData: Record<string, Question[]> = {
  'ai应用': [
    {
      question: '你更看重快速入门还是长期发展？',
      options: [
        { text: '快速做出东西', icon: 'fas fa-bolt' },
        { text: '系统学习打基础', icon: 'fas fa-book' }
      ]
    },
    {
      question: '你的 Python 基础如何？',
      options: [
        { text: '会基础语法', icon: 'fab fa-python' },
        { text: '不太熟悉', icon: 'fas fa-star' }
      ]
    },
    {
      question: '这个项目最终用来做什么？',
      options: [
        { text: '知识库/问答系统', icon: 'fas fa-book-open' },
        { text: '自动化助手/Agent', icon: 'fas fa-robot' }
      ]
    },
    {
      question: '你每周能投入多少学习时间？',
      options: [
        { text: '5小时以内', icon: 'fas fa-clock' },
        { text: '10小时以上', icon: 'fas fa-fire' }
      ]
    }
  ],
  '企业官网': [
    {
      question: '官网的主要功能是什么？',
      options: [
        { text: '展示型企业站', icon: 'fas fa-building' },
        { text: '需要后台管理', icon: 'fas fa-cogs' }
      ]
    },
    {
      question: '团队有前端开发经验吗？',
      options: [
        { text: '有 Vue/React 经验', icon: 'fas fa-code' },
        { text: '都是后端/新手', icon: 'fas fa-graduation-cap' }
      ]
    },
    {
      question: '对 SEO 要求高吗？',
      options: [
        { text: '需要搜索引擎优化', icon: 'fas fa-search' },
        { text: '不需要，主要展示', icon: 'fas fa-clipboard' }
      ]
    },
    {
      question: '预计多久上线？',
      options: [
        { text: '尽快（1周内）', icon: 'fas fa-rocket' },
        { text: '不着急，慢慢做', icon: 'fas fa-turtle' }
      ]
    }
  ],
  '前端学习': [
    {
      question: '你的学习目标是？',
      options: [
        { text: '找一份工作', icon: 'fas fa-briefcase' },
        { text: '提升技能/兴趣', icon: 'fas fa-chart-line' }
      ]
    },
    {
      question: '你更喜欢哪种学习方式？',
      options: [
        { text: '做项目实战', icon: 'fas fa-fist-raised' },
        { text: '系统看视频/文档', icon: 'fas fa-tv' }
      ]
    },
    {
      question: '你每天能投入多少时间？',
      options: [
        { text: '2小时以内', icon: 'fas fa-clock' },
        { text: '4小时以上', icon: 'fas fa-fire' }
      ]
    },
    {
      question: '你更倾向于？',
      options: [
        { text: 'React (需求多)', icon: 'fab fa-react' },
        { text: 'Vue (易上手)', icon: 'fab fa-vuejs' }
      ]
    }
  ],
  'default': [
    {
      question: '你更看重什么？',
      options: [
        { text: '市场需求/好就业', icon: 'fas fa-briefcase' },
        { text: '个人兴趣/喜欢', icon: 'fas fa-heart' }
      ]
    },
    {
      question: '你的基础水平？',
      options: [
        { text: '有经验', icon: 'fas fa-code' },
        { text: '零基础', icon: 'fas fa-graduation-cap' }
      ]
    },
    {
      question: '你期望多久见效？',
      options: [
        { text: '快速做出项目', icon: 'fas fa-bolt' },
        { text: '系统学习', icon: 'fas fa-book' }
      ]
    }
  ]
};

export const resultsData: Record<string, ResultData> = {
  'ai应用': {
    title: 'RAG 知识库系统',
    desc: '适合快速入门，市场需求大，容易做出效果',
    path: ['Python 基础', 'LangChain', 'RAG', '向量数据库'],
    branch: [
      { text: 'RAG (推荐)', recommended: true },
      { text: 'Agent' }
    ],
    comparison: [
      { dim: '难度', a: '⭐⭐ 入门简单', b: '⭐⭐⭐⭐ 较复杂' },
      { dim: '学习周期', a: '2-4周', b: '1-2个月' },
      { dim: '市场需求', a: '🔥 很高', b: '🔥 高' },
      { dim: '适合场景', a: '知识库问答', b: '自动化工作流' }
    ],
    schedule: [
      { week: '第1周', items: ['Day1-2: Python 基础语法', 'Day3-4: 了解 LLM API 调用', 'Day5-7: LangChain 入门'] },
      { week: '第2周', items: ['Day1-2: RAG 原理与架构', 'Day3-4: 向量数据库使用', 'Day5-7: 实战：本地知识库'] },
      { week: '第3周', items: ['Day1-2: 优化检索效果', 'Day3-4: 添加对话历史', 'Day5-7: 部署与分享'] },
      { week: '第4周', items: ['Day1-2: 项目优化', 'Day3-4: 简历包装', 'Day5-7: 准备面试'] }
    ]
  },
  '企业官网': {
    title: 'Next.js + Tailwind',
    desc: '快速开发，SEO 友好，适合企业展示站',
    path: ['HTML/CSS', 'JavaScript', 'Next.js', 'Tailwind'],
    branch: [
      { text: 'Next.js (推荐)', recommended: true },
      { text: 'WordPress' }
    ],
    comparison: [
      { dim: '开发效率', a: '⭐⭐⭐⭐ 高', b: '⭐⭐⭐ 中' },
      { dim: 'SEO', a: '⭐⭐⭐⭐⭐ 优秀', b: '⭐⭐⭐ 良好' },
      { dim: '定制化', a: '⭐⭐⭐⭐⭐ 灵活', b: '⭐⭐ 受限' },
      { dim: '维护成本', a: '⭐⭐⭐ 中', b: '⭐⭐⭐⭐ 低' }
    ],
    schedule: [
      { week: '第1周', items: ['Day1-2: HTML/CSS 基础', 'Day3-4: JavaScript 入门', 'Day5-7: Next.js 框架'] },
      { week: '第2周', items: ['Day1-2: Tailwind CSS 学习', 'Day3-4: 组件开发', 'Day5-7: 首页搭建'] },
      { week: '第3周', items: ['Day1-2: 内页开发', 'Day3-4: 响应式适配', 'Day5-7: 内容填充'] },
      { week: '第4周', items: ['Day1-2: SEO 优化', 'Day3-4: 部署上线', 'Day5-7: 测试与调整'] }
    ]
  },
  '前端学习': {
    title: 'React 技术栈',
    desc: '市场需求大，就业机会多，生态完善',
    path: ['HTML', 'CSS', 'JavaScript', 'React'],
    branch: [
      { text: 'React (推荐)', recommended: true },
      { text: 'Vue' }
    ],
    comparison: [
      { dim: '市场需求', a: '⭐⭐⭐⭐⭐ 极高', b: '⭐⭐⭐⭐ 高' },
      { dim: '上手难度', a: '⭐⭐⭐ 中等', b: '⭐⭐ 简单' },
      { dim: '生态丰富', a: '⭐⭐⭐⭐⭐ 最丰富', b: '⭐⭐⭐⭐ 丰富' },
      { dim: '薪资水平', a: '⭐⭐⭐⭐⭐ 较高', b: '⭐⭐⭐⭐ 高' }
    ],
    schedule: [
      { week: '第1周', items: ['Day1-2: HTML 标签与语义', 'Day3-4: CSS 布局(Flex/Grid)', 'Day5-7: 仿写静态页面'] },
      { week: '第2周', items: ['Day1-2: JavaScript 基础', 'Day3-4: DOM 操作', 'Day5-7: 事件与异步'] },
      { week: '第3周', items: ['Day1-2: React 入门', 'Day3-4: 组件化开发', 'Day5-7: State 与 Props'] },
      { week: '第4周', items: ['Day1-2: Hooks 详解', 'Day3-4: 实战项目', 'Day5-7: 项目优化与部署'] }
    ]
  }
};

export const quickTags = [
  { text: 'AI 应用', goal: '我想做一个 AI 应用', icon: 'fas fa-robot' },
  { text: '企业官网', goal: '做个企业官网', icon: 'fas fa-building' },
  { text: '电商小程序', goal: '开发一个电商小程序', icon: 'fas fa-shopping-cart' },
  { text: '前端学习', goal: '学习前端开发', icon: 'fas fa-code' },
  { text: '转型后端', goal: '转型做后端开发', icon: 'fas fa-server' }
];
