import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Spin } from '../common/Spin';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

type RouteLocationState = {
  from?: {
    pathname?: string;
  };
};

/**
 * 受保护的路由组件
 * - 未登录时重定向到登录页
 * - 登录页和注册页在已登录时重定向到首页
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  // 加载中显示 loading
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

  // 未登录，重定向到登录页
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 已登录，渲染子组件
  return <>{children}</>;
}

/**
 * 公开路由组件（登录页、注册页）
 * - 已登录时重定向到首页
 */
export function PublicRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  // 加载中显示 loading
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

  // 已登录，重定向到首页
  if (isAuthenticated) {
    // 如果是从其他页面跳转过来的，则跳转回去
    const from = (location.state as RouteLocationState | null)?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }

  // 未登录，渲染子组件
  return <>{children}</>;
}