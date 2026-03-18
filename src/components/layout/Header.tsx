import { Link, useLocation } from 'react-router-dom';
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

  const isActive = (path: string) => location.pathname === path;

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
        <span className="btn-text">登录</span>
        <Link to="/copilot" className="btn-primary-blue">
          开始
        </Link>
      </div>
    </header>
  );
}
