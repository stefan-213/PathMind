// /**
//  * Mock 数据服务
//  * 模拟后端 API 响应，用于开发调试
//  * 后端完成后可轻松替换为真实接口
//  */
// import type {
//   User,
//   LoginRequest,
//   RegisterRequest,
//   AuthResponse,
//   UserGoal,
//   UserTask,
//   UserProgress,
//   GeneratedProposal,
//   QuestionAnswer,
//   AIChatMessage,
//   ApiResponse,
//   CreateTasksRequest
// } from '../types/api';
// import type { GraphData } from '../types/graph';
// import { createId } from '../utils/id';

// // 模拟延迟
// const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// // 生成 UUID
// const generateId = () => createId();

// // ==================== Mock 用户数据 ====================
// const mockUser: User = {
//   id: 'user-001',
//   email: 'demo@pathmind.com',
//   username: 'Demo 用户',
//   phone: '',
//   avatar: '',
//   role: 'user',
//   status: 'active',
//   createdAt: '2024-01-01T00:00:00Z',
//   updatedAt: '2024-01-01T00:00:00Z'
// };

// // ==================== Mock 学习目标 ====================
// const mockGoals: UserGoal[] = [
//   {
//     id: 'goal-001',
//     userId: 'user-001',
//     goal: '我想做 AI 应用',
//     recommendTitle: 'RAG 知识库系统',
//     answers: [
//       { questionId: 'q1', question: '你更看重快速入门还是长期发展？', selectedOption: '快速做出东西' }
//     ],
//     status: 'active',
//     createdAt: '2024-01-15T00:00:00Z',
//     updatedAt: '2024-01-15T00:00:00Z'
//   }
// ];

// // ==================== Mock 任务数据 ====================
// const mockTasks: UserTask[] = [
//   {
//     id: 'task-001',
//     userId: 'user-001',
//     goalId: 'goal-001',
//     week: '第1周',
//     day: 'Day1-2',
//     title: 'Python 基础语法',
//     description: '学习变量、数据类型、控制流等基础语法',
//     status: 'completed',
//     order: 1,
//     createdAt: '2024-01-15T00:00:00Z',
//     completedAt: '2024-01-16T00:00:00Z'
//   },
//   {
//     id: 'task-002',
//     userId: 'user-001',
//     goalId: 'goal-001',
//     week: '第1周',
//     day: 'Day3-4',
//     title: '了解 LLM API 调用',
//     description: '学习 OpenAI API 基本调用方式',
//     status: 'completed',
//     order: 2,
//     createdAt: '2024-01-15T00:00:00Z',
//     completedAt: '2024-01-17T00:00:00Z'
//   },
//   {
//     id: 'task-003',
//     userId: 'user-001',
//     goalId: 'goal-001',
//     week: '第1周',
//     day: 'Day5-7',
//     title: 'LangChain 入门',
//     description: '学习 LangChain 基本概念和用法',
//     status: 'pending',
//     order: 3,
//     createdAt: '2024-01-15T00:00:00Z'
//   }
// ];

// // ==================== Mock 进度数据 ====================
// const mockProgress: UserProgress = {
//   id: 'progress-001',
//   userId: 'user-001',
//   goalId: 'goal-001',
//   completedTasks: 2,
//   totalTasks: 28,
//   percentage: 7,
//   lastActiveDate: '2024-01-17T00:00:00Z',
//   streak: 3
// };

// // ==================== Mock 技术方案 ====================
// const mockProposal: GeneratedProposal = {
//   title: 'RAG 知识库系统',
//   description: '适合快速入门，市场需求大，容易做出效果',
//   mainPath: ['Python 基础', 'LangChain', 'RAG', '向量数据库'],
//   branches: [
//     { text: 'RAG (推荐)', recommended: true },
//     { text: 'Agent', recommended: false }
//   ],
//   comparison: [
//     { dim: '难度', a: '⭐⭐ 入门简单', b: '⭐⭐⭐⭐ 较复杂' },
//     { dim: '学习周期', a: '2-4周', b: '1-2个月' },
//     { dim: '市场需求', a: '🔥 很高', b: '🔥 高' },
//     { dim: '适合场景', a: '知识库问答', b: '自动化工作流' }
//   ],
//   schedule: [
//     { week: '第1周', items: ['Day1-2: Python 基础语法', 'Day3-4: 了解 LLM API 调用', 'Day5-7: LangChain 入门'] },
//     { week: '第2周', items: ['Day1-2: RAG 原理与架构', 'Day3-4: 向量数据库使用', 'Day5-7: 实战：本地知识库'] },
//     { week: '第3周', items: ['Day1-2: 优化检索效果', 'Day3-4: 添加对话历史', 'Day5-7: 部署与分享'] },
//     { week: '第4周', items: ['Day1-2: 项目优化', 'Day3-4: 简历包装', 'Day5-7: 准备面试'] }
//   ]
// };

// // ==================== Mock AI 对话 ====================
// const mockChatHistory: AIChatMessage[] = [];

// // ==================== Auth Mock API ====================
// export const mockAuth = {
//   login: async (data: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
//     await delay(500);
//     if (data.username && data.password) {
//       return {
//         success: true,
//         data: {
//           user: mockUser,
//           token: 'mock-token-' + generateId()
//         }
//       };
//     }
//     throw new Error('用户名或密码错误');
//   },

//   register: async (data: RegisterRequest): Promise<ApiResponse<AuthResponse>> => {
//     await delay(500);
//     return {
//       success: true,
//       data: {
//         user: { ...mockUser, email: data.email, username: data.username },
//         token: 'mock-token-' + generateId()
//       }
//     };
//   },

//   logout: async (): Promise<ApiResponse<void>> => {
//     await delay(200);
//     return { success: true };
//   },

//   getCurrentUser: async (): Promise<ApiResponse<User>> => {
//     await delay(300);
//     return { success: true, data: mockUser };
//   },

//   updateUser: async (data: Partial<User>): Promise<ApiResponse<User>> => {
//     await delay(300);
//     const updatedUser = { ...mockUser, ...data };
//     return { success: true, data: updatedUser };
//   },

//   changePassword: async (oldPassword: string, newPassword: string): Promise<ApiResponse<void>> => {
//     await delay(300);
//     if (!oldPassword) {
//       throw new Error('请输入当前密码');
//     }
//     if (newPassword.length < 6) {
//       throw new Error('新密码至少需要 6 位');
//     }
//     return { success: true };
//   }
// };

// // ==================== Goals Mock API ====================
// export const mockGoalsApi = {
//   getGoals: async (params?: { status?: string }): Promise<ApiResponse<UserGoal[]>> => {
//     await delay(300);
//     let goals = [...mockGoals];
//     if (params?.status) {
//       goals = goals.filter(g => g.status === params.status);
//     }
//     return { success: true, data: goals };
//   },

//   getGoalById: async (id: string): Promise<ApiResponse<UserGoal>> => {
//     await delay(200);
//     const goal = mockGoals.find(g => g.id === id);
//     if (!goal) {
//       throw new Error('目标不存在');
//     }
//     return { success: true, data: goal };
//   },

//   createGoal: async (data: { goal: string }): Promise<ApiResponse<UserGoal>> => {
//     await delay(500);
//     const newGoal: UserGoal = {
//       id: generateId(),
//       userId: mockUser.id,
//       goal: data.goal,
//       recommendTitle: '',
//       answers: [],
//       status: 'active',
//       createdAt: new Date().toISOString(),
//       updatedAt: new Date().toISOString()
//     };
//     mockGoals.push(newGoal);
//     return { success: true, data: newGoal };
//   },

//   updateGoal: async (id: string, data: Partial<UserGoal>): Promise<ApiResponse<UserGoal>> => {
//     await delay(300);
//     const index = mockGoals.findIndex(g => g.id === id);
//     if (index === -1) throw new Error('目标不存在');
//     mockGoals[index] = { ...mockGoals[index], ...data, updatedAt: new Date().toISOString() };
//     return { success: true, data: mockGoals[index] };
//   },

//   deleteGoal: async (id: string): Promise<ApiResponse<void>> => {
//     await delay(300);
//     const index = mockGoals.findIndex(g => g.id === id);
//     if (index !== -1) mockGoals.splice(index, 1);
//     return { success: true };
//   }
// };

// // ==================== Tasks Mock API ====================
// export const mockTasksApi = {
//   getTasks: async (params?: { goalId?: string; status?: string }): Promise<ApiResponse<UserTask[]>> => {
//     await delay(300);
//     let tasks = [...mockTasks];
//     if (params?.goalId) {
//       tasks = tasks.filter(t => t.goalId === params.goalId);
//     }
//     if (params?.status) {
//       tasks = tasks.filter(t => t.status === params.status);
//     }
//     return { success: true, data: tasks };
//   },

//   getTaskById: async (id: string): Promise<ApiResponse<UserTask>> => {
//     await delay(200);
//     const task = mockTasks.find(t => t.id === id);
//     if (!task) throw new Error('任务不存在');
//     return { success: true, data: task };
//   },

//   createTasks: async (data: CreateTasksRequest): Promise<ApiResponse<UserTask[]>> => {
//     await delay(300);
//     const newTasks: UserTask[] = [];
//     let order = 0;
//     data.schedule.forEach((weekItem) => {
//       weekItem.items.forEach((item, dayIndex) => {
//         newTasks.push({
//           id: generateId(),
//           userId: 'user-001',
//           goalId: data.goalId,
//           week: weekItem.week,
//           day: `Day${dayIndex + 1}`,
//           title: item,
//           description: `${weekItem.week}: ${item}`,
//           status: 'pending' as const,
//           order: order++,
//           createdAt: new Date().toISOString()
//         });
//       });
//     });
//     mockTasks.push(...newTasks);
//     return { success: true, data: newTasks };
//   },

//   updateTask: async (id: string, data: Partial<UserTask>): Promise<ApiResponse<UserTask>> => {
//     await delay(200);
//     const index = mockTasks.findIndex(t => t.id === id);
//     if (index === -1) throw new Error('任务不存在');
//     mockTasks[index] = {
//       ...mockTasks[index],
//       ...data,
//       status: data.status === 'completed' ? 'completed' : data.status || mockTasks[index].status,
//       completedAt: data.status === 'completed' ? new Date().toISOString() :
//                     data.status === 'pending' ? undefined : mockTasks[index].completedAt
//     };
//     return { success: true, data: mockTasks[index] };
//   },

//   deleteTask: async (id: string): Promise<ApiResponse<void>> => {
//     await delay(200);
//     const index = mockTasks.findIndex(t => t.id === id);
//     if (index !== -1) mockTasks.splice(index, 1);
//     return { success: true };
//   },

//   getProgress: async (params?: { goalId?: string }): Promise<ApiResponse<UserProgress>> => {
//     await delay(200);
//     let tasks = [...mockTasks];
//     if (params?.goalId) {
//       tasks = tasks.filter(t => t.goalId === params.goalId);
//     }
//     const completed = tasks.filter(t => t.status === 'completed').length;
//     return {
//       success: true,
//       data: {
//         ...mockProgress,
//         completedTasks: completed,
//         totalTasks: tasks.length,
//         percentage: tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0
//       }
//     };
//   }
// };

// // ==================== AI Mock API ====================

// // Mock draw.io XML 数据
// export const mockGraphXml = `<mxfile host="app.diagrams.net" modified="2026-04-20T00:00:00.000Z" agent="draw.io" version="22.1.0">
//   <diagram name="RAG技术学习流程" id="rag-tech-flow">
//     <mxGraphModel dx="1400" dy="900" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1400" pageHeight="1100" math="0" shadow="0">
//       <root>
//         <mxCell id="0"/>
//         <mxCell id="1" parent="0"/>
        
//         <!-- 标题 -->
//         <mxCell id="main-title" value="RAG 技术学习详细流程图" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=26;fontStyle=1;fontColor=#1a1a2e;" vertex="1" parent="1">
//           <mxGeometry x="400" y="20" width="500" height="50" as="geometry"/>
//         </mxCell>
        
//         <mxCell id="sub-title" value="Pipeline 视角 —— 从数据摄入到答案生成" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=14;fontStyle=2;fontColor=#666666;" vertex="1" parent="1">
//           <mxGeometry x="400" y="70" width="500" height="30" as="geometry"/>
//         </mxCell>
        
//         <!-- ========== 离线索引阶段 ========== -->
//         <mxCell id="offline-label" value="离线索引阶段 (Offline Indexing)" style="swimlane;whiteSpace=wrap;html=1;startSize=25;fillColor=#e3f2fd;strokeColor=#1565c0;fontStyle=1;fontSize=14;" vertex="1" parent="1">
//           <mxGeometry x="60" y="140" width="1280" height="220" as="geometry"/>
//         </mxCell>
        
//         <!-- 步骤1 -->
//         <mxCell id="step1" value="Step 1" style="ellipse;whiteSpace=wrap;html=1;fillColor=#1565c0;strokeColor=#1565c0;fontSize=11;fontStyle=1;fontColor=#ffffff;" vertex="1" parent="offline-label">
//           <mxGeometry x="30" y="50" width="50" height="30" as="geometry"/>
//         </mxCell>
//         <mxCell id="step1-box" value="文档加载&lt;br&gt;PDF/Word/TXT/网页" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#bbdefb;strokeColor=#1565c0;fontSize=11;" vertex="1" parent="offline-label">
//           <mxGeometry x="100" y="45" width="140" height="50" as="geometry"/>
//         </mxCell>
//         <mxCell id="step1-tag" value="学习周：第3周 Day1-2" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=9;fontColor=#1565c0;" vertex="1" parent="offline-label">
//           <mxGeometry x="100" y="100" width="140" height="15" as="geometry"/>
//         </mxCell>
        
//         <!-- 箭头 -->
//         <mxCell id="arrow1" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;endArrow=classic;" edge="1" parent="offline-label" source="step1-box" target="step2-box">
//           <mxGeometry relative="1" as="geometry"/>
//         </mxCell>
        
//         <!-- 步骤2 -->
//         <mxCell id="step2" value="Step 2" style="ellipse;whiteSpace=wrap;html=1;fillColor=#1565c0;strokeColor=#1565c0;fontSize=11;fontStyle=1;fontColor=#ffffff;" vertex="1" parent="offline-label">
//           <mxGeometry x="290" y="50" width="50" height="30" as="geometry"/>
//         </mxCell>
//         <mxCell id="step2-box" value="文本清洗与分块&lt;br&gt;Chunking策略" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#bbdefb;strokeColor=#1565c0;fontSize=11;" vertex="1" parent="offline-label">
//           <mxGeometry x="360" y="45" width="140" height="50" as="geometry"/>
//         </mxCell>
//         <mxCell id="step2-tag" value="学习周：第3周 Day3" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=9;fontColor=#1565c0;" vertex="1" parent="offline-label">
//           <mxGeometry x="360" y="100" width="140" height="15" as="geometry"/>
//         </mxCell>
        
//         <!-- 步骤2子项 -->
//         <mxCell id="step2-sub1" value="固定大小分块" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#e3f2fd;strokeColor=#90caf9;fontSize=9;" vertex="1" parent="offline-label">
//           <mxGeometry x="360" y="130" width="65" height="20" as="geometry"/>
//         </mxCell>
//         <mxCell id="step2-sub2" value="语义分块" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#e3f2fd;strokeColor=#90caf9;fontSize=9;" vertex="1" parent="offline-label">
//           <mxGeometry x="435" y="130" width="65" height="20" as="geometry"/>
//         </mxCell>
//         <mxCell id="step2-sub3" value="递归分块" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#e3f2fd;strokeColor=#90caf9;fontSize=9;" vertex="1" parent="offline-label">
//           <mxGeometry x="360" y="160" width="65" height="20" as="geometry"/>
//         </mxCell>
//         <mxCell id="step2-sub4" value="重叠窗口" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#e3f2fd;strokeColor=#90caf9;fontSize=9;" vertex="1" parent="offline-label">
//           <mxGeometry x="435" y="160" width="65" height="20" as="geometry"/>
//         </mxCell>
        
//         <mxCell id="arrow2" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;endArrow=classic;" edge="1" parent="offline-label" source="step2-box" target="step3-box">
//           <mxGeometry relative="1" as="geometry"/>
//         </mxCell>
        
//         <!-- 步骤3 -->
//         <mxCell id="step3" value="Step 3" style="ellipse;whiteSpace=wrap;html=1;fillColor=#1565c0;strokeColor=#1565c0;fontSize=11;fontStyle=1;fontColor=#ffffff;" vertex="1" parent="offline-label">
//           <mxGeometry x="560" y="50" width="50" height="30" as="geometry"/>
//         </mxCell>
//         <mxCell id="step3-box" value="向量化 Embedding&lt;br&gt;文本→向量" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#bbdefb;strokeColor=#1565c0;fontSize=11;" vertex="1" parent="offline-label">
//           <mxGeometry x="630" y="45" width="140" height="50" as="geometry"/>
//         </mxCell>
//         <mxCell id="step3-tag" value="学习周：第3周 Day1-2" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=9;fontColor=#1565c0;" vertex="1" parent="offline-label">
//           <mxGeometry x="630" y="100" width="140" height="15" as="geometry"/>
//         </mxCell>
//         <mxCell id="step3-sub1" value="BGE / text2vec / OpenAI" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#e3f2fd;strokeColor=#90caf9;fontSize=9;" vertex="1" parent="offline-label">
//           <mxGeometry x="630" y="130" width="140" height="20" as="geometry"/>
//         </mxCell>
        
//         <mxCell id="arrow3" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;endArrow=classic;" edge="1" parent="offline-label" source="step3-box" target="step4-box">
//           <mxGeometry relative="1" as="geometry"/>
//         </mxCell>
        
//         <!-- 步骤4 -->
//         <mxCell id="step4" value="Step 4" style="ellipse;whiteSpace=wrap;html=1;fillColor=#1565c0;strokeColor=#1565c0;fontSize=11;fontStyle=1;fontColor=#ffffff;" vertex="1" parent="offline-label">
//           <mxGeometry x="830" y="50" width="50" height="30" as="geometry"/>
//         </mxCell>
//         <mxCell id="step4-box" value="向量存储&lt;br&gt;Chroma / FAISS" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#bbdefb;strokeColor=#1565c0;fontSize=11;" vertex="1" parent="offline-label">
//           <mxGeometry x="900" y="45" width="140" height="50" as="geometry"/>
//         </mxCell>
//         <mxCell id="step4-tag" value="学习周：第3周 Day4-5" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=9;fontColor=#1565c0;" vertex="1" parent="offline-label">
//           <mxGeometry x="900" y="100" width="140" height="15" as="geometry"/>
//         </mxCell>
        
//         <mxCell id="arrow4" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;endArrow=classic;" edge="1" parent="offline-label" source="step4-box" target="step5-box">
//           <mxGeometry relative="1" as="geometry"/>
//         </mxCell>
        
//         <!-- 步骤5 -->
//         <mxCell id="step5" value="Step 5" style="ellipse;whiteSpace=wrap;html=1;fillColor=#1565c0;strokeColor=#1565c0;fontSize=11;fontStyle=1;fontColor=#ffffff;" vertex="1" parent="offline-label">
//           <mxGeometry x="1090" y="50" width="50" height="30" as="geometry"/>
//         </mxCell>
//         <mxCell id="step5-box" value="索引构建完成&lt;br&gt;等待查询" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#64b5f6;strokeColor=#1565c0;fontSize=11;fontStyle=1;" vertex="1" parent="offline-label">
//           <mxGeometry x="1160" y="45" width="100" height="50" as="geometry"/>
//         </mxCell>
        
//         <!-- 大箭头连接两个阶段 -->
//         <mxCell id="phase-arrow" value="" style="shape=flexArrow;endArrow=classic;html=1;rounded=0;fillColor=#4a148c;strokeColor=none;width=12;endSize=15;startSize=10;" edge="1" parent="1">
//           <mxGeometry width="50" height="50" relative="1" as="geometry">
//             <mxPoint x="700" y="370" as="sourcePoint"/>
//             <mxPoint x="700" y="420" as="targetPoint"/>
//           </mxGeometry>
//         </mxCell>
//         <mxCell id="phase-arrow-label" value="用户查询触发" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=12;fontStyle=1;fontColor=#4a148c;" vertex="1" parent="1">
//           <mxGeometry x="600" y="395" width="100" height="20" as="geometry"/>
//         </mxCell>
        
//         <!-- ========== 在线检索与生成阶段 ========== -->
//         <mxCell id="online-label" value="在线检索与生成阶段 (Online Retrieval &amp; Generation)" style="swimlane;whiteSpace=wrap;html=1;startSize=25;fillColor=#fff3e0;strokeColor=#e65100;fontStyle=1;fontSize=14;" vertex="1" parent="1">
//           <mxGeometry x="60" y="430" width="1280" height="280" as="geometry"/>
//         </mxCell>
        
//         <!-- 查询输入 -->
//         <mxCell id="query-step" value="Query" style="ellipse;whiteSpace=wrap;html=1;fillColor=#e65100;strokeColor=#e65100;fontSize=11;fontStyle=1;fontColor=#ffffff;" vertex="1" parent="online-label">
//           <mxGeometry x="30" y="60" width="60" height="30" as="geometry"/>
//         </mxCell>
//         <mxCell id="query-box" value="用户输入问题" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#ffe0b2;strokeColor=#e65100;fontSize=11;" vertex="1" parent="online-label">
//           <mxGeometry x="110" y="55" width="120" height="40" as="geometry"/>
//         </mxCell>
        
//         <mxCell id="q-arrow1" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;endArrow=classic;" edge="1" parent="online-label" source="query-box" target="rewrite-box">
//           <mxGeometry relative="1" as="geometry"/>
//         </mxCell>
        
//         <!-- 查询改写 -->
//         <mxCell id="rewrite-box" value="Query 改写/扩展" style="rhombus;whiteSpace=wrap;html=1;fillColor=#ffcc80;strokeColor=#e65100;fontSize=11;" vertex="1" parent="online-label">
//           <mxGeometry x="280" y="45" width="130" height="60" as="geometry"/>
//         </mxCell>
//         <mxCell id="rewrite-tag" value="学习周：第5周 Day2" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=9;fontColor=#e65100;" vertex="1" parent="online-label">
//           <mxGeometry x="280" y="110" width="130" height="15" as="geometry"/>
//         </mxCell>
        
//         <mxCell id="q-arrow2" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;endArrow=classic;" edge="1" parent="online-label" source="rewrite-box" target="retrieval-box">
//           <mxGeometry relative="1" as="geometry"/>
//         </mxCell>
        
//         <!-- 混合检索 -->
//         <mxCell id="retrieval-box" value="混合检索" style="swimlane;whiteSpace=wrap;html=1;startSize=20;fillColor=#ffe0b2;strokeColor=#e65100;fontSize=11;" vertex="1" parent="online-label">
//           <mxGeometry x="460" y="35" width="160" height="100" as="geometry"/>
//         </mxCell>
//         <mxCell id="dense-ret" value="稠密检索 (向量相似度)" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#fff3e0;strokeColor=#e65100;fontSize=9;" vertex="1" parent="retrieval-box">
//           <mxGeometry x="10" y="30" width="140" height="25" as="geometry"/>
//         </mxCell>
//         <mxCell id="sparse-ret" value="稀疏检索 (BM25)" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#fff3e0;strokeColor=#e65100;fontSize=9;" vertex="1" parent="retrieval-box">
//           <mxGeometry x="10" y="60" width="140" height="25" as="geometry"/>
//         </mxCell>
//         <mxCell id="retrieval-tag" value="学习周：第5周 Day3" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=9;fontColor=#e65100;" vertex="1" parent="online-label">
//           <mxGeometry x="460" y="140" width="160" height="15" as="geometry"/>
//         </mxCell>
        
//         <mxCell id="q-arrow3" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;endArrow=classic;" edge="1" parent="online-label" source="retrieval-box" target="rerank-box">
//           <mxGeometry relative="1" as="geometry"/>
//         </mxCell>
        
//         <!-- 重排序 -->
//         <mxCell id="rerank-box" value="Reranker 重排序" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#ffcc80;strokeColor=#e65100;fontSize=11;" vertex="1" parent="online-label">
//           <mxGeometry x="680" y="50" width="130" height="50" as="geometry"/>
//         </mxCell>
//         <mxCell id="rerank-tag" value="学习周：第5周 Day1" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=9;fontColor=#e65100;" vertex="1" parent="online-label">
//           <mxGeometry x="680" y="105" width="130" height="15" as="geometry"/>
//         </mxCell>
        
//         <mxCell id="q-arrow4" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;endArrow=classic;" edge="1" parent="online-label" source="rerank-box" target="context-box">
//           <mxGeometry relative="1" as="geometry"/>
//         </mxCell>
        
//         <!-- 上下文构建 -->
//         <mxCell id="context-box" value="上下文构建&lt;br&gt;Prompt模板填充" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#ffe0b2;strokeColor=#e65100;fontSize=11;" vertex="1" parent="online-label">
//           <mxGeometry x="870" y="45" width="140" height="55" as="geometry"/>
//         </mxCell>
//         <mxCell id="context-tag" value="学习周：第4周 Day3-4" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=9;fontColor=#e65100;" vertex="1" parent="online-label">
//           <mxGeometry x="870" y="105" width="140" height="15" as="geometry"/>
//         </mxCell>
        
//         <mxCell id="q-arrow5" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;endArrow=classic;" edge="1" parent="online-label" source="context-box" target="llm-box">
//           <mxGeometry relative="1" as="geometry"/>
//         </mxCell>
        
//         <!-- LLM生成 -->
//         <mxCell id="llm-box" value="LLM 生成答案" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#ff8a65;strokeColor=#e65100;fontSize=11;fontStyle=1;" vertex="1" parent="online-label">
//           <mxGeometry x="1070" y="45" width="120" height="55" as="geometry"/>
//         </mxCell>
//         <mxCell id="llm-tag" value="学习周：第4周 Day1-2,5" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=9;fontColor=#e65100;" vertex="1" parent="online-label">
//           <mxGeometry x="1070" y="105" width="120" height="15" as="geometry"/>
//         </mxCell>
        
//         <!-- 反馈闭环 -->
//         <mxCell id="feedback-arrow" value="" style="shape=flexArrow;endArrow=classic;html=1;rounded=0;fillColor=#d84315;strokeColor=none;width=8;endSize=10;" edge="1" parent="online-label">
//           <mxGeometry width="50" height="50" relative="1" as="geometry">
//             <mxPoint x="1130" y="180" as="sourcePoint"/>
//             <mxPoint x="400" y="180" as="targetPoint"/>
//           </mxGeometry>
//         </mxCell>
//         <mxCell id="feedback-label" value="评估反馈 (RAGAS) —— 优化检索参数" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=10;fontStyle=1;fontColor=#d84315;" vertex="1" parent="online-label">
//           <mxGeometry x="650" y="185" width="250" height="20" as="geometry"/>
//         </mxCell>
        
//         <!-- ========== 底部工具链 ========== -->
//         <mxCell id="toolchain-label" value="技术栈与工具链" style="swimlane;whiteSpace=wrap;html=1;startSize=25;fillColor=#f5f5f5;strokeColor=#9e9e9e;fontStyle=1;fontSize=13;" vertex="1" parent="1">
//           <mxGeometry x="60" y="750" width="1280" height="120" as="geometry"/>
//         </mxCell>
        
//         <mxCell id="tool1" value="LangChain" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#e8eaf6;strokeColor=#283593;fontSize=11;" vertex="1" parent="toolchain-label">
//           <mxGeometry x="40" y="45" width="110" height="40" as="geometry"/>
//         </mxCell>
//         <mxCell id="tool2" value="LlamaIndex" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#e8eaf6;strokeColor=#283593;fontSize=11;" vertex="1" parent="toolchain-label">
//           <mxGeometry x="170" y="45" width="110" height="40" as="geometry"/>
//         </mxCell>
//         <mxCell id="tool3" value="Chroma" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#e8eaf6;strokeColor=#283593;fontSize=11;" vertex="1" parent="toolchain-label">
//           <mxGeometry x="300" y="45" width="110" height="40" as="geometry"/>
//         </mxCell>
//         <mxCell id="tool4" value="FAISS" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#e8eaf6;strokeColor=#283593;fontSize=11;" vertex="1" parent="toolchain-label">
//           <mxGeometry x="430" y="45" width="110" height="40" as="geometry"/>
//         </mxCell>
//         <mxCell id="tool5" value="HuggingFace" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#e8eaf6;strokeColor=#283593;fontSize=11;" vertex="1" parent="toolchain-label">
//           <mxGeometry x="560" y="45" width="110" height="40" as="geometry"/>
//         </mxCell>
//         <mxCell id="tool6" value="OpenAI API" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#e8eaf6;strokeColor=#283593;fontSize=11;" vertex="1" parent="toolchain-label">
//           <mxGeometry x="690" y="45" width="110" height="40" as="geometry"/>
//         </mxCell>
//         <mxCell id="tool7" value="Streamlit/Gradio" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#e8eaf6;strokeColor=#283593;fontSize=11;" vertex="1" parent="toolchain-label">
//           <mxGeometry x="820" y="45" width="120" height="40" as="geometry"/>
//         </mxCell>
//         <mxCell id="tool8" value="RAGAS" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#e8eaf6;strokeColor=#283593;fontSize=11;" vertex="1" parent="toolchain-label">
//           <mxGeometry x="960" y="45" width="110" height="40" as="geometry"/>
//         </mxCell>
        
//       </root>
//     </mxGraphModel>
//   </diagram>
// </mxfile>`;

// // Mock 图表数据（保留用于 GraphData 格式）
// export const mockGraphRoadmap: GraphData = {
//   type: 'roadmap',
//   title: 'React 技术路线图',
//   layout: 'timeline',
//   nodes: [
//     { id: '1', label: 'HTML/CSS', description: '网页基础', category: 'basic', color: '#64748B', level: 0 },
//     { id: '2', label: 'JavaScript', description: '脚本语言', category: 'basic', color: '#F59E0B', level: 1 },
//     { id: '3', label: 'TypeScript', description: '类型系统', category: 'basic', color: '#3B82F6', level: 1 },
//     { id: '4', label: 'React 基础', description: '核心概念', category: 'frontend', color: '#10B981', level: 2 },
//     { id: '5', label: 'React 进阶', description: '高级特性', category: 'frontend', color: '#10B981', level: 3 },
//     { id: '6', label: '状态管理', description: 'Zustand/Redux', category: 'frontend', color: '#8B5CF6', level: 3 },
//     { id: '7', label: 'Next.js', description: '全栈框架', category: 'fullstack', color: '#EC4899', level: 4 },
//   ],
//   edges: [
//     { source: '1', target: '2' },
//     { source: '2', target: '3' },
//     { source: '3', target: '4' },
//     { source: '4', target: '5' },
//     { source: '5', target: '6' },
//     { source: '5', target: '7' },
//   ],
// };

// const mockGraphFlowchart: GraphData = {
//   type: 'flowchart',
//   title: '用户登录流程',
//   layout: 'force',
//   nodes: [
//     { id: '1', label: '打开页面', description: '访问登录页', color: '#3B82F6' },
//     { id: '2', label: '输入账号', description: '用户名/邮箱', color: '#10B981' },
//     { id: '3', label: '输入密码', description: '账户密码', color: '#10B981' },
//     { id: '4', label: '点击登录', description: '提交表单', color: '#F59E0B' },
//     { id: '5', label: '验证成功', description: '跳转首页', color: '#10B981' },
//     { id: '6', label: '登录失败', description: '显示错误', color: '#EF4444' },
//   ],
//   edges: [
//     { source: '1', target: '2' },
//     { source: '2', target: '3' },
//     { source: '3', target: '4' },
//     { source: '4', target: '5', label: '成功' },
//     { source: '4', target: '6', label: '失败' },
//   ],
// };

// const mockGraphFramework: GraphData = {
//   type: 'framework',
//   title: '技术架构图',
//   layout: 'grid',
//   nodes: [
//     { id: '1', label: '前端', description: '用户界面', color: '#3B82F6', size: 40 },
//     { id: '2', label: '后端', description: '业务逻辑', color: '#10B981', size: 40 },
//     { id: '3', label: '数据库', description: '数据存储', color: '#F59E0B', size: 40 },
//     { id: '4', label: '缓存', description: 'Redis', color: '#8B5CF6', size: 35 },
//     { id: '5', label: 'AI 服务', description: '大模型', color: '#EC4899', size: 35 },
//   ],
//   edges: [
//     { source: '1', target: '2' },
//     { source: '2', target: '3' },
//     { source: '2', target: '4' },
//     { source: '2', target: '5' },
//   ],
// };

// // 根据关键词选择 Mock 图表
// const selectMockGraph = (message: string): GraphData | null => {
//   const lowerMsg = message.toLowerCase();
//   if (lowerMsg.includes('路线图') || lowerMsg.includes('学习') || lowerMsg.includes('react') || lowerMsg.includes('前端')) {
//     return mockGraphRoadmap;
//   }
//   if (lowerMsg.includes('流程') || lowerMsg.includes('登录') || lowerMsg.includes('注册')) {
//     return mockGraphFlowchart;
//   }
//   if (lowerMsg.includes('架构') || lowerMsg.includes('系统')) {
//     return mockGraphFramework;
//   }
//   return mockGraphRoadmap; // 默认返回路线图
// };

// export const mockAI = {
//   generateProposal: async (_goal: string, _answers: QuestionAnswer[]): Promise<ApiResponse<GeneratedProposal>> => {
//     await delay(1500); // 模拟 AI 生成时间
//     return {
//       success: true,
//       data: {
//         ...mockProposal,
//         title: mockProposal.title,
//         description: mockProposal.description
//       }
//     };
//   },

//   chat: async (_goalId: string, message: string): Promise<ApiResponse<{ message: AIChatMessage }>> => {
//     await delay(800);
//     const reply: AIChatMessage = {
//       id: generateId(),
//       role: 'assistant',
//       content: `这是模拟的 AI 回复：${message}`,
//       createdAt: new Date().toISOString()
//     };
//     mockChatHistory.push(reply);
//     return { success: true, data: { message: reply } };
//   },

//   // Mock chatWithAI - 返回对话和可选图表数据
//   chatWithAI: async (data: { agentId: string; sessionId: string; message: string }): Promise<ApiResponse<{ message: string; graphData?: GraphData }>> => {
//     await delay(1000);

//     const graphData = selectMockGraph(data.message);

//     const reply = {
//       message: `已为你生成「${graphData?.title}」！这张图展示了 ${graphData?.nodes.length} 个节点和 ${graphData?.edges.length} 条关系。你可以让 AI 修改这个图表。`,
//       graphData: graphData ?? undefined,
//     };

//     return { success: true, data: reply };
//   },

//   createSession: async (_agentId: string): Promise<ApiResponse<{ sessionId: string }>> => {
//     await delay(200);
//     return { success: true, data: { sessionId: createId('session') } };
//   },

//   getChatHistory: async (_goalId: string): Promise<ApiResponse<AIChatMessage[]>> => {
//     await delay(200);
//     return { success: true, data: mockChatHistory };
//   }
// };

// // ==================== Consult Mock API ====================

// import type { ConsultSession, ConsultRequest, ConsultResponse } from '../types/api';

// const mockConsultSessions: ConsultSession[] = [];

// export const mockConsultApi = {
//   createSession: async (): Promise<ApiResponse<ConsultSession>> => {
//     await delay(200);
//     const newSession: ConsultSession = {
//       id: generateId(),
//       title: '新咨询',
//       createdAt: new Date().toISOString(),
//       messages: [],
//       userProfile: { goal: '', experience: '', timeframe: '', scale: '' },
//       currentStep: 'ASK_GOAL',
//       finalXml: '',
//       planDetails: [],
//     };
//     mockConsultSessions.unshift(newSession);
//     return { success: true, data: newSession };
//   },

//   getSessions: async (): Promise<ApiResponse<ConsultSession[]>> => {
//     await delay(200);
//     return { success: true, data: mockConsultSessions };
//   },

//   getSessionById: async (sessionId: string): Promise<ApiResponse<ConsultSession>> => {
//     await delay(200);
//     const session = mockConsultSessions.find(s => s.id === sessionId);
//     if (!session) {
//       throw new Error('会话不存在');
//     }
//     return { success: true, data: session };
//   },

//   deleteSession: async (sessionId: string): Promise<ApiResponse<void>> => {
//     await delay(200);
//     const index = mockConsultSessions.findIndex(s => s.id === sessionId);
//     if (index !== -1) {
//       mockConsultSessions.splice(index, 1);
//     }
//     return { success: true };
//   },

//   chat: async (data: ConsultRequest): Promise<ApiResponse<ConsultResponse>> => {
//     await delay(800);

//     const { message, step, profile } = data;
//     const newProfile = { ...profile };
//     let reply = '';
//     let nextStep = step;
//     let finalXml: string | undefined;
//     let planDetails: { week: string; items: string[] }[] | undefined;

//     // 根据步骤处理
//     if (step === 'ASK_GOAL') {
//       newProfile.goal = message;
//       const goalType = message.includes('AI') || message.includes('RAG') ? 'AI应用' :
//                        message.includes('官网') || message.includes('企业') ? '企业Web' :
//                        message.includes('App') || message.includes('移动') ? '移动应用' : '数据平台';
//       reply = `<p>🎯 目标「<strong>${message}</strong>」已记录。</p>
// <p>这是一个很好的${goalType}方向！为了给你更精准的技术路线图，请告诉我：</p>
// <p><strong>你或团队的技术经验水平？</strong></p>
// <p><em>这将帮助我调整学习曲线的陡峭程度</em></p>`;
//       nextStep = 'ASK_EXPERIENCE';
//     } else if (step === 'ASK_EXPERIENCE') {
//       let exp = 'intermediate';
//       if (message.includes('初学') || message.includes('0基础')) exp = 'beginner';
//       else if (message.includes('高级') || message.includes('3年')) exp = 'advanced';
//       newProfile.experience = exp;
//       const expText = { beginner: '初学者', intermediate: '中级', advanced: '高级' }[exp];
//       const advice = exp === 'beginner' ? '我会提供更循序渐进的学习路径' :
//                      exp === 'advanced' ? '可以更快进入实战项目' : '平衡学习与实践';
//       reply = `<p>👍 了解了，你是<strong>${expText}</strong>水平。</p>
// <p>${advice}。</p>
// <p><strong>项目时间要求？</strong></p>
// <p>这决定我们方案的深度和广度</p>`;
//       nextStep = 'ASK_TIMEFRAME';
//     } else if (step === 'ASK_TIMEFRAME') {
//       let t = '1个月';
//       if (message.includes('1-2')) t = '1-2周';
//       else if (message.includes('3个月')) t = '3个月+';
//       newProfile.timeframe = t;
//       const intensity = t === '1-2周' ? '紧凑高效' : t === '1个月' ? '标准节奏' : '深度学习';
//       reply = `<p>⏱️ 周期：<strong>${t}</strong>（${intensity}模式）</p>
// <p>很好，现在来定位应用场景：</p>
// <p><strong>这个项目的用途是？</strong></p>`;
//       nextStep = 'ASK_SCALE';
//     } else if (step === 'ASK_SCALE') {
//       let s = '个人项目';
//       if (message.includes('团队')) s = '团队协作';
//       else if (message.includes('生产') || message.includes('高并发')) s = '生产级';
//       newProfile.scale = s;
//       reply = `<p>📦 场景：<strong>${s}</strong></p><p>正在为您生成专属技术方案...</p>`;
//       nextStep = 'RESULT';

//       // 生成最终方案
//       const isAI = newProfile.goal.includes('AI') || newProfile.goal.includes('智能') || newProfile.goal.includes('RAG');
//       const isFrontend = newProfile.goal.includes('官网') || newProfile.goal.includes('前端') || newProfile.goal.includes('企业');
//       const isMobile = newProfile.goal.includes('App') || newProfile.goal.includes('移动');

//       if (isAI) {
//         finalXml = `<mxfile host="app.diagrams.net"><diagram name="AI学习路线" id="ai-roadmap">
//           <mxGraphModel>
//             <root><mxCell id="0"/><mxCell id="1" parent="0"/>
//               <mxCell id="2" value="Python基础" style="rounded=1;whiteSpace=wrap;fillColor=#4a90e2;fontColor=#ffffff;strokeColor=#4a90e2;" vertex="1"><mxGeometry x="100" y="50" width="120" height="40" as="geometry"/></mxCell>
//               <mxCell id="3" value="LangChain框架" style="rounded=1;whiteSpace=wrap;fillColor=#4a90e2;fontColor=#ffffff;strokeColor=#4a90e2;" vertex="1"><mxGeometry x="100" y="120" width="120" height="40" as="geometry"/></mxCell>
//               <mxCell id="4" value="向量数据库" style="rounded=1;whiteSpace=wrap;fillColor=#4a90e2;fontColor=#ffffff;strokeColor=#4a90e2;" vertex="1"><mxGeometry x="100" y="190" width="120" height="40" as="geometry"/></mxCell>
//               <mxCell id="5" value="RAG流程搭建" style="rounded=1;whiteSpace=wrap;fillColor=#4a90e2;fontColor=#ffffff;strokeColor=#4a90e2;" vertex="1"><mxGeometry x="100" y="260" width="120" height="40" as="geometry"/></mxCell>
//               <mxCell id="6" value="API与前端集成" style="rounded=1;whiteSpace=wrap;fillColor=#4a90e2;fontColor=#ffffff;strokeColor=#4a90e2;" vertex="1"><mxGeometry x="100" y="330" width="120" height="40" as="geometry"/></mxCell>
//               <mxCell id="7" value="部署与测试" style="rounded=1;whiteSpace=wrap;fillColor=#4a90e2;fontColor=#ffffff;strokeColor=#4a90e2;" vertex="1"><mxGeometry x="100" y="400" width="120" height="40" as="geometry"/></mxCell>
//               <mxCell id="8" value="" style="endArrow=classic;html=1;strokeWidth=2;" edge="1"><mxGeometry relative="1" as="geometry"><mxPoint x="160" y="90" as="sourcePoint"/><mxPoint x="160" y="120" as="targetPoint"/></mxGeometry></mxCell>
//               <mxCell id="9" value="" style="endArrow=classic;html=1;strokeWidth=2;" edge="1"><mxGeometry relative="1" as="geometry"><mxPoint x="160" y="160" as="sourcePoint"/><mxPoint x="160" y="190" as="targetPoint"/></mxGeometry></mxCell>
//               <mxCell id="10" value="" style="endArrow=classic;html=1;strokeWidth=2;" edge="1"><mxGeometry relative="1" as="geometry"><mxPoint x="160" y="230" as="sourcePoint"/><mxPoint x="160" y="260" as="targetPoint"/></mxGeometry></mxCell>
//               <mxCell id="11" value="" style="endArrow=classic;html=1;strokeWidth=2;" edge="1"><mxGeometry relative="1" as="geometry"><mxPoint x="160" y="300" as="sourcePoint"/><mxPoint x="160" y="330" as="targetPoint"/></mxGeometry></mxCell>
//               <mxCell id="12" value="" style="endArrow=classic;html=1;strokeWidth=2;" edge="1"><mxGeometry relative="1" as="geometry"><mxPoint x="160" y="370" as="sourcePoint"/><mxPoint x="160" y="400" as="targetPoint"/></mxGeometry></mxCell>
//             </root>
//           </mxGraphModel>
//         </diagram></mxfile>`;
//         planDetails = [
//           { week: '第1周', items: ['Day1-2: Python基础语法', 'Day3-4: FastAPI入门', 'Day5-7: 虚拟环境搭建', 'Day5-7: LangChain核心概念'] },
//           { week: '第2周', items: ['Day1-2: 文档加载器', 'Day3-4: 文本分割', 'Day5-7: 向量数据库(Chroma)集成', 'Day5-7: Embedding模型配置'] },
//           { week: '第3周', items: ['Day1-2: 检索链构建', 'Day3-4: 对话记忆实现', 'Day5-7: 提示词工程', 'Day5-7: 结果优化'] },
//           { week: '第4周', items: ['Day1-2: 前端对话界面开发', 'Day3-4: API对接', 'Day5-7: 性能测试', 'Day5-7: 生产部署'] }
//         ];
//       } else if (isFrontend) {
//         finalXml = `<mxfile host="app.diagrams.net"><diagram name="前端学习路线" id="frontend-roadmap">
//           <mxGraphModel>
//             <root><mxCell id="0"/><mxCell id="1" parent="0"/>
//               <mxCell id="2" value="需求分析" style="rounded=1;whiteSpace=wrap;fillColor=#4a90e2;fontColor=#ffffff;strokeColor=#4a90e2;" vertex="1"><mxGeometry x="100" y="50" width="120" height="40" as="geometry"/></mxCell>
//               <mxCell id="3" value="技术选型" style="rounded=1;whiteSpace=wrap;fillColor=#4a90e2;fontColor=#ffffff;strokeColor=#4a90e2;" vertex="1"><mxGeometry x="100" y="120" width="120" height="40" as="geometry"/></mxCell>
//               <mxCell id="4" value="框架学习" style="rounded=1;whiteSpace=wrap;fillColor=#4a90e2;fontColor=#ffffff;strokeColor=#4a90e2;" vertex="1"><mxGeometry x="100" y="190" width="120" height="40" as="geometry"/></mxCell>
//               <mxCell id="5" value="组件开发" style="rounded=1;whiteSpace=wrap;fillColor=#4a90e2;fontColor=#ffffff;strokeColor=#4a90e2;" vertex="1"><mxGeometry x="100" y="260" width="120" height="40" as="geometry"/></mxCell>
//               <mxCell id="6" value="状态管理" style="rounded=1;whiteSpace=wrap;fillColor=#4a90e2;fontColor=#ffffff;strokeColor=#4a90e2;" vertex="1"><mxGeometry x="100" y="330" width="120" height="40" as="geometry"/></mxCell>
//               <mxCell id="7" value="API对接" style="rounded=1;whiteSpace=wrap;fillColor=#4a90e2;fontColor=#ffffff;strokeColor=#4a90e2;" vertex="1"><mxGeometry x="100" y="400" width="120" height="40" as="geometry"/></mxCell>
//               <mxCell id="8" value="测试部署" style="rounded=1;whiteSpace=wrap;fillColor=#4a90e2;fontColor=#ffffff;strokeColor=#4a90e2;" vertex="1"><mxGeometry x="100" y="470" width="120" height="40" as="geometry"/></mxCell>
//               <mxCell id="9" value="" style="endArrow=classic;html=1;strokeWidth=2;" edge="1"><mxGeometry relative="1" as="geometry"><mxPoint x="160" y="90" as="sourcePoint"/><mxPoint x="160" y="120" as="targetPoint"/></mxGeometry></mxCell>
//               <mxCell id="10" value="" style="endArrow=classic;html=1;strokeWidth=2;" edge="1"><mxGeometry relative="1" as="geometry"><mxPoint x="160" y="160" as="sourcePoint"/><mxPoint x="160" y="190" as="targetPoint"/></mxGeometry></mxCell>
//               <mxCell id="11" value="" style="endArrow=classic;html=1;strokeWidth=2;" edge="1"><mxGeometry relative="1" as="geometry"><mxPoint x="160" y="230" as="sourcePoint"/><mxPoint x="160" y="260" as="targetPoint"/></mxGeometry></mxCell>
//               <mxCell id="12" value="" style="endArrow=classic;html=1;strokeWidth=2;" edge="1"><mxGeometry relative="1" as="geometry"><mxPoint x="160" y="300" as="sourcePoint"/><mxPoint x="160" y="330" as="targetPoint"/></mxGeometry></mxCell>
//               <mxCell id="13" value="" style="endArrow=classic;html=1;strokeWidth=2;" edge="1"><mxGeometry relative="1" as="geometry"><mxPoint x="160" y="370" as="sourcePoint"/><mxPoint x="160" y="400" as="targetPoint"/></mxGeometry></mxCell>
//               <mxCell id="14" value="" style="endArrow=classic;html=1;strokeWidth=2;" edge="1"><mxGeometry relative="1" as="geometry"><mxPoint x="160" y="440" as="sourcePoint"/><mxPoint x="160" y="470" as="targetPoint"/></mxGeometry></mxCell>
//             </root>
//           </mxGraphModel>
//         </diagram></mxfile>`;
//         planDetails = [
//           { week: '第1周', items: ['Day1-2: 项目初始化', 'Day3-4: TypeScript基础', 'Day5-7: React/Vue核心概念', 'Day5-7: 组件生命周期'] },
//           { week: '第2周', items: ['Day1-2: 组件化设计', 'Day3-4: 路由配置', 'Day5-7: 表单处理', 'Day5-7: 样式方案(SCSS/Tailwind)'] },
//           { week: '第3周', items: ['Day1-2: 状态管理方案', 'Day3-4: API封装', 'Day5-7: 错误处理', 'Day5-7: 权限控制'] },
//           { week: '第4周', items: ['Day1-2: 单元测试', 'Day3-4: E2E测试', 'Day5-7: 性能优化', 'Day5-7: CI/CD部署'] }
//         ];
//       } else if (isMobile) {
//         finalXml = `<mxfile host="app.diagrams.net"><diagram name="移动开发路线" id="mobile-roadmap">
//           <mxGraphModel>
//             <root><mxCell id="0"/><mxCell id="1" parent="0"/>
//               <mxCell id="2" value="需求分析" style="rounded=1;whiteSpace=wrap;fillColor=#4a90e2;fontColor=#ffffff;strokeColor=#4a90e2;" vertex="1"><mxGeometry x="100" y="50" width="120" height="40" as="geometry"/></mxCell>
//               <mxCell id="3" value="技术选型" style="rounded=1;whiteSpace=wrap;fillColor=#4a90e2;fontColor=#ffffff;strokeColor=#4a90e2;" vertex="1"><mxGeometry x="100" y="120" width="120" height="40" as="geometry"/></mxCell>
//               <mxCell id="4" value="环境搭建" style="rounded=1;whiteSpace=wrap;fillColor=#4a90e2;fontColor=#ffffff;strokeColor=#4a90e2;" vertex="1"><mxGeometry x="100" y="190" width="120" height="40" as="geometry"/></mxCell>
//               <mxCell id="5" value="功能开发" style="rounded=1;whiteSpace=wrap;fillColor=#4a90e2;fontColor=#ffffff;strokeColor=#4a90e2;" vertex="1"><mxGeometry x="100" y="260" width="120" height="40" as="geometry"/></mxCell>
//               <mxCell id="6" value="状态管理" style="rounded=1;whiteSpace=wrap;fillColor=#4a90e2;fontColor=#ffffff;strokeColor=#4a90e2;" vertex="1"><mxGeometry x="100" y="330" width="120" height="40" as="geometry"/></mxCell>
//               <mxCell id="7" value="API集成" style="rounded=1;whiteSpace=wrap;fillColor=#4a90e2;fontColor=#ffffff;strokeColor=#4a90e2;" vertex="1"><mxGeometry x="100" y="400" width="120" height="40" as="geometry"/></mxCell>
//               <mxCell id="8" value="打包发布" style="rounded=1;whiteSpace=wrap;fillColor=#4a90e2;fontColor=#ffffff;strokeColor=#4a90e2;" vertex="1"><mxGeometry x="100" y="470" width="120" height="40" as="geometry"/></mxCell>
//               <mxCell id="9" value="" style="endArrow=classic;html=1;strokeWidth=2;" edge="1"><mxGeometry relative="1" as="geometry"><mxPoint x="160" y="90" as="sourcePoint"/><mxPoint x="160" y="120" as="targetPoint"/></mxGeometry></mxCell>
//               <mxCell id="10" value="" style="endArrow=classic;html=1;strokeWidth=2;" edge="1"><mxGeometry relative="1" as="geometry"><mxPoint x="160" y="160" as="sourcePoint"/><mxPoint x="160" y="190" as="targetPoint"/></mxGeometry></mxCell>
//               <mxCell id="11" value="" style="endArrow=classic;html=1;strokeWidth=2;" edge="1"><mxGeometry relative="1" as="geometry"><mxPoint x="160" y="230" as="sourcePoint"/><mxPoint x="160" y="260" as="targetPoint"/></mxGeometry></mxCell>
//               <mxCell id="12" value="" style="endArrow=classic;html=1;strokeWidth=2;" edge="1"><mxGeometry relative="1" as="geometry"><mxPoint x="160" y="300" as="sourcePoint"/><mxPoint x="160" y="330" as="targetPoint"/></mxGeometry></mxCell>
//               <mxCell id="13" value="" style="endArrow=classic;html=1;strokeWidth=2;" edge="1"><mxGeometry relative="1" as="geometry"><mxPoint x="160" y="370" as="sourcePoint"/><mxPoint x="160" y="400" as="targetPoint"/></mxGeometry></mxCell>
//               <mxCell id="14" value="" style="endArrow=classic;html=1;strokeWidth=2;" edge="1"><mxGeometry relative="1" as="geometry"><mxPoint x="160" y="440" as="sourcePoint"/><mxPoint x="160" y="470" as="targetPoint"/></mxGeometry></mxCell>
//             </root>
//           </mxGraphModel>
//         </diagram></mxfile>`;
//         planDetails = [
//           { week: '第1周', items: ['Day1-2: React Native/Flutter环境搭建', 'Day3-4: Expo配置', 'Day5-7: 跨平台方案对比'] },
//           { week: '第2周', items: ['Day1-2: 核心UI组件', 'Day3-4: 导航配置', 'Day5-7: 手势处理', 'Day5-7: 动画实现'] },
//           { week: '第3周', items: ['Day1-2: 状态管理', 'Day3-4: 数据持久化', 'Day5-7: 离线支持', 'Day5-7: 主题切换'] },
//           { week: '第4周', items: ['Day1-2: 原生模块集成', 'Day3-4: 性能优化', 'Day5-7: App Store/Google Play发布'] }
//         ];
//       } else {
//         finalXml = `<mxfile host="app.diagrams.net"><diagram name="通用路线" id="general-roadmap">
//           <mxGraphModel>
//             <root><mxCell id="0"/><mxCell id="1" parent="0"/>
//               <mxCell id="2" value="需求分析" style="rounded=1;whiteSpace=wrap;fillColor=#4a90e2;fontColor=#ffffff;strokeColor=#4a90e2;" vertex="1"><mxGeometry x="100" y="50" width="120" height="40" as="geometry"/></mxCell>
//               <mxCell id="3" value="技术栈选择" style="rounded=1;whiteSpace=wrap;fillColor=#4a90e2;fontColor=#ffffff;strokeColor=#4a90e2;" vertex="1"><mxGeometry x="100" y="120" width="120" height="40" as="geometry"/></mxCell>
//               <mxCell id="4" value="数据架构" style="rounded=1;whiteSpace=wrap;fillColor=#4a90e2;fontColor=#ffffff;strokeColor=#4a90e2;" vertex="1"><mxGeometry x="100" y="190" width="120" height="40" as="geometry"/></mxCell>
//               <mxCell id="5" value="后端开发" style="rounded=1;whiteSpace=wrap;fillColor=#4a90e2;fontColor=#ffffff;strokeColor=#4a90e2;" vertex="1"><mxGeometry x="100" y="260" width="120" height="40" as="geometry"/></mxCell>
//               <mxCell id="6" value="前端开发" style="rounded=1;whiteSpace=wrap;fillColor=#4a90e2;fontColor=#ffffff;strokeColor=#4a90e2;" vertex="1"><mxGeometry x="100" y="330" width="120" height="40" as="geometry"/></mxCell>
//               <mxCell id="7" value="测试部署" style="rounded=1;whiteSpace=wrap;fillColor=#4a90e2;fontColor=#ffffff;strokeColor=#4a90e2;" vertex="1"><mxGeometry x="100" y="400" width="120" height="40" as="geometry"/></mxCell>
//               <mxCell id="8" value="" style="endArrow=classic;html=1;strokeWidth=2;" edge="1"><mxGeometry relative="1" as="geometry"><mxPoint x="160" y="90" as="sourcePoint"/><mxPoint x="160" y="120" as="targetPoint"/></mxGeometry></mxCell>
//               <mxCell id="9" value="" style="endArrow=classic;html=1;strokeWidth=2;" edge="1"><mxGeometry relative="1" as="geometry"><mxPoint x="160" y="160" as="sourcePoint"/><mxPoint x="160" y="190" as="targetPoint"/></mxGeometry></mxCell>
//               <mxCell id="10" value="" style="endArrow=classic;html=1;strokeWidth=2;" edge="1"><mxGeometry relative="1" as="geometry"><mxPoint x="160" y="230" as="sourcePoint"/><mxPoint x="160" y="260" as="targetPoint"/></mxGeometry></mxCell>
//               <mxCell id="11" value="" style="endArrow=classic;html=1;strokeWidth=2;" edge="1"><mxGeometry relative="1" as="geometry"><mxPoint x="160" y="300" as="sourcePoint"/><mxPoint x="160" y="330" as="targetPoint"/></mxGeometry></mxCell>
//               <mxCell id="12" value="" style="endArrow=classic;html=1;strokeWidth=2;" edge="1"><mxGeometry relative="1" as="geometry"><mxPoint x="160" y="370" as="sourcePoint"/><mxPoint x="160" y="400" as="targetPoint"/></mxGeometry></mxCell>
//             </root>
//           </mxGraphModel>
//         </diagram></mxfile>`;
//         planDetails = [
//           { week: '第1周', items: ['Day1-2: 需求分析', 'Day3-4: 技术栈选型', 'Day5-7: 数据库设计', 'Day5-7: API规范制定'] },
//           { week: '第2周', items: ['Day1-2: Node.js/Express', 'Day3-4: 数据库CRUD', 'Day5-7: 认证授权', 'Day5-7: 日志监控'] },
//           { week: '第3周', items: ['Day1-2: 前端界面开发', 'Day3-4: 组件复用', 'Day5-7: 状态管理', 'Day5-7: 表单验证'] },
//           { week: '第4周', items: ['Day1-2: 前后端联调', 'Day3-4: 测试用例', 'Day5-7: 部署脚本', 'Day5-7: 生产环境配置'] }
//         ];
//       }
//     }

//     return {
//       success: true,
//       data: {
//         message: reply,
//         isHtml: true,
//         nextStep,
//         updatedProfile: newProfile,
//         finalXml,
//         planDetails,
//       }
//     };
//   },

//   getAgents: async () => {
//     await delay(300);
//     return {
//       success: true,
//       data: [
//         { agentId: '100001', agentName: '测试智能体01', agentDesc: '一个测试的智能体' }
//       ]
//     };
//   }
// };

// // 会话对话 API 别名（使用 mockConsultApi）
// export const mockConversation = mockConsultApi;

// // 图表操作 API Mock
// const mockChartStorage: Record<string, { xml: string; title: string; updatedAt: string }> = {};
// const mockChartHistory: { [key: string]: Array<{ id: string; xml: string; message: string; createdAt: string }> } = {};

// export const mockGraph = {
//   createChatSession: async (_agentId: string) => {
//     await delay(200);
//     return { success: true, data: { sessionId: generateId() } };
//   },

//   getChartInfo: async (sessionId: string) => {
//     await delay(200);
//     const chart = mockChartStorage[sessionId];
//     if (!chart) {
//       // 返回默认图表
//       return {
//         success: true,
//         data: {
//           xml: mockGraphXml,
//           title: '学习路线图',
//           updatedAt: new Date().toISOString(),
//         }
//       };
//     }
//     return { success: true, data: chart };
//   },

//   saveChart: async (sessionId: string, xml: string) => {
//     await delay(300);
//     mockChartStorage[sessionId] = {
//       xml,
//       title: '学习路线图',
//       updatedAt: new Date().toISOString(),
//     };
//     return { success: true };
//   },

//   modifyChart: async (data: { sessionId: string; message: string; currentXml: string }) => {
//     await delay(800);
//     // 模拟 AI 修改图表
//     const { message, currentXml } = data;
//     let responseMessage = '';
//     let newXml = currentXml;

//     if (message.includes('不满意') || message.includes('修改')) {
//       responseMessage = '好的，请您提出具体的修改需求，我会帮您调整图表。';
//     } else if (message.includes('节点') || message.includes('添加')) {
//       responseMessage = '已为您添加新的节点，请查看图表是否满意。';
//       // 简单修改 XML 示例
//       newXml = currentXml.replace('</mxGraphModel>', '<mxCell id="newNode" value="新节点" vertex="1"><mxGeometry x="200" y="300" width="120" height="40" as="geometry"/></mxCell></mxGraphModel>');
//     } else if (message.includes('删除')) {
//       responseMessage = '已删除指定节点，请查看调整后的图表。';
//     } else {
//       responseMessage = '图表已更新，请查看是否满意。';
//     }

//     return {
//       success: true,
//       data: {
//         message: responseMessage,
//         xml: newXml,
//         suggestions: ['可以调整节点位置', '可以添加更多细节', '可以修改节点颜色'],
//       }
//     };
//   },

//   chatStream: async (data: { sessionId: string; message: string }) => {
//     await delay(800);
//     const { message } = data;
//     let reply = '好的，请稍等...';

//     if (message.includes('满意') || message.includes('好的') || message.includes('可以')) {
//       reply = '很高兴您满意！图表已生成完整的学习路线图。';
//     } else if (message.includes('不满意') || message.includes('修改')) {
//       reply = '好的，请您提出具体的修改需求，我会帮您调整图表。';
//     } else {
//       reply = '收到您的消息，请问对当前的图表还有什么需要调整的吗？';
//     }

//     return {
//       success: true,
//       data: {
//         message: reply,
//         graphData: undefined,
//       }
//     };
//   },

//   getChartHistory: async (sessionId: string) => {
//     await delay(200);
//     return { success: true, data: mockChartHistory[sessionId] || [] };
//   },

//   exportChart: async (sessionId: string) => {
//     await delay(300);
//     const chart = mockChartStorage[sessionId] || { xml: mockGraphXml };
//     // 返回一个 Blob（实际是字符串模拟）
//     const blob = new Blob([chart.xml], { type: 'application/xml' });
//     return { success: true, data: blob };
//   },

//   shareChart: async (sessionId: string) => {
//     await delay(300);
//     return {
//       success: true,
//       data: {
//         shareUrl: `https://pathmind.app/share/${sessionId}`,
//         expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
//       }
//     };
//   },
// };
