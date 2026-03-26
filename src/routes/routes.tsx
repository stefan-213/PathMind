import { Navigate, useLocation, Route, createRoutesFromElements } from 'react-router-dom';
import { Spin } from '../components/common';
import { useAuthStore } from '../stores/authStore';
import { HomePage } from '../pages/Home';
import { CopilotPage } from '../pages/Copilot';
import { TasksPage } from '../pages/Tasks';
import { ProposalPage } from '../pages/Proposal';
import { GraphPage } from '../pages/Graph';
import { LoginPage, RegisterPage } from '../pages/Auth';
import { RootLayout } from './RootLayout';

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
export const routes = createRoutesFromElements(
  <Route element={<RootLayout />}>
    <Route path="/" element={<HomePage />} />
    <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
    <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
    <Route path="/copilot" element={<ProtectedRoute><CopilotPage /></ProtectedRoute>} />
    <Route path="/tasks" element={<ProtectedRoute><TasksPage /></ProtectedRoute>} />
    <Route path="/proposal" element={<ProtectedRoute><ProposalPage /></ProtectedRoute>} />
    <Route path="/graph" element={<ProtectedRoute><GraphPage /></ProtectedRoute>} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Route>
);