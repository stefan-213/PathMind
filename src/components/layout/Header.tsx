/**
 * Header - desktop floating navigation and mobile bottom navigation.
 */
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useNavStore } from '../../stores/navStore';
import './Header.scss';

type NavItem = 'home' | 'graph' | 'consult' | 'tasks' | 'knowledge' | 'profile';

interface NavItemConfig {
  key: NavItem;
  label: string;
  mobileLabel: string;
  path: string;
  icon: string;
}

const navItems: NavItemConfig[] = [
  { key: 'home', label: '首页', mobileLabel: '首页', path: '/', icon: 'fa-home' },
  { key: 'consult', label: 'Copilot', mobileLabel: 'Copilot', path: '/consult', icon: 'fa-comments' },
  { key: 'graph', label: '知识图谱', mobileLabel: '图谱', path: '/graph', icon: 'fa-project-diagram' },
  { key: 'tasks', label: '我的任务', mobileLabel: '任务', path: '/tasks', icon: 'fa-tasks' },
  { key: 'knowledge', label: '知识库', mobileLabel: '知识库', path: '/knowledge-base', icon: 'fa-database' },
  { key: 'profile', label: '个人中心', mobileLabel: '我的', path: '/profile', icon: 'fa-user' },
];

export function Header() {
  const location = useLocation();
  const { isAuthenticated, logout } = useAuthStore();
  const isNavExpanded = useNavStore((state) => state.isNavExpanded);
  const setNavExpanded = useNavStore((state) => state.setNavExpanded);
  const toggleNav = useNavStore((state) => state.toggleNav);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    if (path === '/tasks') return location.pathname === '/tasks' || location.pathname === '/task-detail';
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = `${import.meta.env.BASE_URL}login`;
  };

  return (
    <>
      <nav className={`floating-nav-bar ${isNavExpanded ? 'floating-nav-bar--expanded' : ''}`} aria-label="主导航">
        <div className="floating-nav-bar__panel">
          <Link to="/" className="floating-nav-bar__logo" title="PathMind 首页">
            <i className="fas fa-code-branch"></i>
            <span className="floating-nav-bar__tooltip">PathMind</span>
          </Link>
          <div className="floating-nav-bar__divider"></div>

          {navItems.map((item) => (
            <Link
              key={item.key}
              to={item.path}
              className={`floating-nav-bar__item ${isActive(item.path) ? 'floating-nav-bar__item--active' : ''}`}
              onClick={() => setNavExpanded(false)}
              aria-current={isActive(item.path) ? 'page' : undefined}
            >
              <i className={`fas ${item.icon}`}></i>
              <span className="floating-nav-bar__tooltip">{item.label}</span>
            </Link>
          ))}

          <div className="floating-nav-bar__divider"></div>

          {isAuthenticated ? (
            <button type="button" className="floating-nav-bar__item" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt"></i>
              <span className="floating-nav-bar__tooltip">退出</span>
            </button>
          ) : (
            <Link to="/login" className="floating-nav-bar__item">
              <i className="fas fa-sign-in-alt"></i>
              <span className="floating-nav-bar__tooltip">登录</span>
            </Link>
          )}
        </div>

        <button
          type="button"
          className="floating-nav-bar__toggle"
          onClick={toggleNav}
          title={isNavExpanded ? '收起菜单' : '展开菜单'}
          aria-label={isNavExpanded ? '收起菜单' : '展开菜单'}
          aria-expanded={isNavExpanded}
        >
          <i className={`fas ${isNavExpanded ? 'fa-times' : 'fa-bars'}`}></i>
        </button>
      </nav>

      <nav className="mobile-bottom-nav" aria-label="移动端主导航">
        {navItems.map((item) => {
          const active = isActive(item.path);

          return (
            <Link
              key={item.key}
              to={item.path}
              className={`mobile-bottom-nav__item ${active ? 'mobile-bottom-nav__item--active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              <i className={`fas ${item.icon}`}></i>
              <span>{item.mobileLabel}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
