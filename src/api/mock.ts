/**
 * Mock 数据服务
 * 模拟后端 API 响应，用于开发调试
 * 后端完成后可轻松替换为真实接口
 */
import type {
  User,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  UserGoal,
  UserTask,
  UserProgress,
  Technology,
  GeneratedProposal,
  QuestionAnswer,
  AIChatMessage
} from '../types/api';

// 模拟延迟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 生成 UUID
const generateId = () => crypto.randomUUID();

// ==================== Mock 用户数据 ====================
const mockUser: User = {
  id: 'user-001',
  email: 'demo@pathmind.com',
  username: 'Demo 用户',
  avatar: '',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
};

// ==================== Mock 学习目标 ====================
const mockGoals: UserGoal[] = [
  {
    id: 'goal-001',
    userId: 'user-001',
    goal: '我想做 AI 应用',
    recommendTitle: 'RAG 知识库系统',
    answers: [
      { questionId: 'q1', question: '你更看重快速入门还是长期发展？', selectedOption: '快速做出东西' }
    ],
    status: 'active',
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z'
  }
];

// ==================== Mock 任务数据 ====================
const mockTasks: UserTask[] = [
  {
    id: 'task-001',
    userId: 'user-001',
    goalId: 'goal-001',
    week: '第1周',
    day: 'Day1-2',
    title: 'Python 基础语法',
    description: '学习变量、数据类型、控制流等基础语法',
    status: 'completed',
    order: 1,
    createdAt: '2024-01-15T00:00:00Z',
    completedAt: '2024-01-16T00:00:00Z'
  },
  {
    id: 'task-002',
    userId: 'user-001',
    goalId: 'goal-001',
    week: '第1周',
    day: 'Day3-4',
    title: '了解 LLM API 调用',
    description: '学习 OpenAI API 基本调用方式',
    status: 'completed',
    order: 2,
    createdAt: '2024-01-15T00:00:00Z',
    completedAt: '2024-01-17T00:00:00Z'
  },
  {
    id: 'task-003',
    userId: 'user-001',
    goalId: 'goal-001',
    week: '第1周',
    day: 'Day5-7',
    title: 'LangChain 入门',
    description: '学习 LangChain 基本概念和用法',
    status: 'pending',
    order: 3,
    createdAt: '2024-01-15T00:00:00Z'
  }
];

// ==================== Mock 进度数据 ====================
const mockProgress: UserProgress = {
  id: 'progress-001',
  userId: 'user-001',
  goalId: 'goal-001',
  completedTasks: 2,
  totalTasks: 28,
  percentage: 7,
  lastActiveDate: '2024-01-17T00:00:00Z',
  streak: 3
};

// ==================== Mock 技术方案 ====================
const mockProposal: GeneratedProposal = {
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
};

// ==================== Mock AI 对话 ====================
const mockChatHistory: AIChatMessage[] = [];

// ==================== Auth Mock API ====================
export const mockAuth = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    await delay(500);
    if (data.email && data.password) {
      return {
        user: mockUser,
        token: 'mock-token-' + generateId()
      };
    }
    throw new Error('用户名或密码错误');
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    await delay(500);
    return {
      user: { ...mockUser, email: data.email, username: data.username },
      token: 'mock-token-' + generateId()
    };
  },

  logout: async (): Promise<void> => {
    await delay(200);
  },

  getCurrentUser: async (): Promise<User> => {
    await delay(300);
    return mockUser;
  }
};

// ==================== Goals Mock API ====================
export const mockGoalsApi = {
  getGoals: async (params?: { status?: string }): Promise<UserGoal[]> => {
    await delay(300);
    if (params?.status) {
      return mockGoals.filter(g => g.status === params.status);
    }
    return mockGoals;
  },

  getGoalById: async (id: string): Promise<UserGoal | undefined> => {
    await delay(200);
    return mockGoals.find(g => g.id === id);
  },

  createGoal: async (goal: string): Promise<UserGoal> => {
    await delay(500);
    const newGoal: UserGoal = {
      id: generateId(),
      userId: mockUser.id,
      goal,
      recommendTitle: '',
      answers: [],
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    mockGoals.push(newGoal);
    return newGoal;
  },

  updateGoal: async (id: string, data: Partial<UserGoal>): Promise<UserGoal> => {
    await delay(300);
    const index = mockGoals.findIndex(g => g.id === id);
    if (index === -1) throw new Error('目标不存在');
    mockGoals[index] = { ...mockGoals[index], ...data, updatedAt: new Date().toISOString() };
    return mockGoals[index];
  },

  deleteGoal: async (id: string): Promise<void> => {
    await delay(300);
    const index = mockGoals.findIndex(g => g.id === id);
    if (index !== -1) mockGoals.splice(index, 1);
  }
};

// ==================== Tasks Mock API ====================
export const mockTasksApi = {
  getTasks: async (params?: { goalId?: string; status?: string }): Promise<UserTask[]> => {
    await delay(300);
    let tasks = [...mockTasks];
    if (params?.goalId) {
      tasks = tasks.filter(t => t.goalId === params.goalId);
    }
    if (params?.status) {
      tasks = tasks.filter(t => t.status === params.status);
    }
    return tasks;
  },

  getTasksByGoal: async (goalId: string): Promise<UserTask[]> => {
    await delay(300);
    return mockTasks.filter(t => t.goalId === goalId);
  },

  completeTask: async (id: string): Promise<UserTask> => {
    await delay(200);
    const index = mockTasks.findIndex(t => t.id === id);
    if (index === -1) throw new Error('任务不存在');
    mockTasks[index] = {
      ...mockTasks[index],
      status: 'completed',
      completedAt: new Date().toISOString()
    };
    return mockTasks[index];
  },

  uncompleteTask: async (id: string): Promise<UserTask> => {
    await delay(200);
    const index = mockTasks.findIndex(t => t.id === id);
    if (index === -1) throw new Error('任务不存在');
    mockTasks[index] = {
      ...mockTasks[index],
      status: 'pending',
      completedAt: undefined
    };
    return mockTasks[index];
  },

  getProgress: async (): Promise<UserProgress> => {
    await delay(200);
    const completed = mockTasks.filter(t => t.status === 'completed').length;
    return {
      ...mockProgress,
      completedTasks: completed,
      percentage: Math.round((completed / mockProgress.totalTasks) * 100)
    };
  }
};

// ==================== AI Mock API ====================
export const mockAI = {
  generateProposal: async (goal: string, answers: QuestionAnswer[]): Promise<GeneratedProposal> => {
    await delay(1500); // 模拟 AI 生成时间
    return {
      ...mockProposal,
      title: mockProposal.title,
      desc: mockProposal.desc
    };
  },

  chat: async (goalId: string, message: string): Promise<AIChatMessage> => {
    await delay(800);
    const reply: AIChatMessage = {
      id: generateId(),
      role: 'assistant',
      content: `这是模拟的 AI 回复：${message}`,
      createdAt: new Date().toISOString()
    };
    mockChatHistory.push(reply);
    return reply;
  },

  getChatHistory: async (goalId: string): Promise<AIChatMessage[]> => {
    await delay(200);
    return mockChatHistory;
  }
};
