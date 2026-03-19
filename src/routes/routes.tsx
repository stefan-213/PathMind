import { Navigate, useLocation } from 'react-router-dom';
import { Spin } from '../components/common';
import { useAuthStore } from '../stores/authStore';
import { HomePage } from '../pages/Home';
import { CopilotPage } from '../pages/Copilot';
import { TasksPage } from '../pages/Tasks';
import { ProposalPage } from '../pages/Proposal';
import { GraphPage } from '../pages/Graph';
import { LoginPage, RegisterPage } from '../pages/Auth';

// 路由守卫组件
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

// 公开路由（已登录用户不能访问）
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Spin size="large" />
      </div>
    );
  }

  if (isAuthenticated) {
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
}

// 路由配置
export const routes = [
  // 公开路由
  {
    path: '/',
    name: '首页',
    element: <HomePage />,
    public: true,
  },
  {
    path: '/login',
    name: '登录',
    element: (
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    ),
    public: true,
  },
  {
    path: '/register',
    name: '注册',
    element: (
      <PublicRoute>
        <RegisterPage />
      </PublicRoute>
    ),
    public: true,
  },

  // 受保护路由
  {
    path: '/copilot',
    name: 'AI Copilot',
    element: (
      <ProtectedRoute>
        <CopilotPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/tasks',
    name: '我的任务',
    element: (
      <ProtectedRoute>
        <TasksPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/proposal',
    name: '技术方案',
    element: (
      <ProtectedRoute>
        <ProposalPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/graph',
    name: '知识图谱',
    element: (
      <ProtectedRoute>
        <GraphPage />
      </ProtectedRoute>
    ),
  },

  // 404
  {
    path: '*',
    name: '404',
    element: <Navigate to="/" replace />,
  },
];
