import { HomePage } from '../pages/Home';
import { CopilotPage } from '../pages/Copilot';
import { TasksPage } from '../pages/Tasks';
import { ProposalPage } from '../pages/Proposal';
import { GraphPage } from '../pages/Graph';

// 路由配置
export const routes = [
  {
    path: '/',
    name: '首页',
    element: <HomePage />,
  },
  {
    path: '/copilot',
    name: 'AI Copilot',
    element: <CopilotPage />,
  },
  {
    path: '/tasks',
    name: '我的任务',
    element: <TasksPage />,
  },
  {
    path: '/proposal',
    name: '技术方案',
    element: <ProposalPage />,
  },
  {
    path: '/graph',
    name: '知识图谱',
    element: <GraphPage />,
  },
];
