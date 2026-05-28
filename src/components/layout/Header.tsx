/**
 * Header - 右侧悬浮导航
 */
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useNavStore } from '../../stores/navStore';
import './Header.scss';

type NavItem = 'home' | 'graph' | 'consult' | 'tasks' | 'knowledge' | 'profile';

const navItems: { key: NavItem; label: string; path: string; icon: string }[] = [
  { key: 'home', label: '首页', path: '/', icon: 'fa-home' },
  { key: 'consult', label: 'Copilot', path: '/consult', icon: 'fa-comments' },
  { key: 'graph', label: '知识图表', path: '/graph', icon: 'fa-project-diagram' },
  { key: 'tasks', label: '我的任务', path: '/tasks', icon: 'fa-tasks' },
  { key: 'knowledge', label: '知识库', path: '/knowledge-base', icon: 'fa-database' },
  { key: 'profile', label: '个人中心', path: '/profile', icon: 'fa-user' },
];

export function Header() {
  const location = useLocation();
  const { isAuthenticated, logout } = useAuthStore();
  const isNavExpanded = useNavStore((state) => state.isNavExpanded);
  const setNavExpanded = useNavStore((state) => state.setNavExpanded);
  const toggleNav = useNavStore((state) => state.toggleNav);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  return (
    <>
      {/* 右侧悬浮导航栏 */}
      <nav className={`floating-nav-bar ${isNavExpanded ? 'floating-nav-bar--expanded' : ''}`}>
        {/* 导航项容器 - 始终渲染，通过 CSS 控制动画 */}
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
            >
              <i className={`fas ${item.icon}`}></i>
              <span className="floating-nav-bar__tooltip">{item.label}</span>
            </Link>
          ))}

          <div className="floating-nav-bar__divider"></div>

          {isAuthenticated ? (
            <button className="floating-nav-bar__item" onClick={handleLogout}>
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

        {/* 展开/收起按钮 */}
        <button
          className="floating-nav-bar__toggle"
          onClick={toggleNav}
          title={isNavExpanded ? '收起菜单' : '展开菜单'}
        >
          <i className={`fas ${isNavExpanded ? 'fa-times' : 'fa-bars'}`}></i>
        </button>
      </nav>
    </>
  );
}
