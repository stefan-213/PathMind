import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import './Header.css';

type NavItem = 'home' | 'graph' | 'copilot' | 'proposal' | 'tasks';

const navItems: { key: NavItem; label: string; path: string }[] = [
  { key: 'home', label: '首页', path: '/' },
  { key: 'copilot', label: 'AI Copilot', path: '/copilot' },
  { key: 'graph', label: '知识图谱', path: '/graph' },
  { key: 'tasks', label: '我的任务', path: '/tasks' },
];

export function Header() {
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuthStore();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  return (
    <header className="header">
      <div className="logo">
        <i className="fas fa-code-branch"></i> PathMind
      </div>
      <nav className="nav-links">
        {navItems.map((item) => (
          <Link
            key={item.key}
            to={item.path}
            className={isActive(item.path) ? 'active' : ''}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="nav-buttons">
        {isAuthenticated ? (
          <>
            <span className="user-info">
              <i className="fas fa-user-circle"></i>
              {user?.username || user?.email?.split('@')[0] || '用户'}
            </span>
            <button className="btn-text" onClick={handleLogout}>
              退出
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn-text">
              登录
            </Link>
            <Link to="/register" className="btn-primary-blue">
              注册
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
