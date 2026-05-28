import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import './Auth.scss';

type RouteLocationState = {
  from?: {
    pathname?: string;
  };
};

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formErrors, setFormErrors] = useState<{ username?: string; password?: string }>({});

  const from = (location.state as RouteLocationState | null)?.from?.pathname || '/';

  const validate = () => {
    const errors: { username?: string; password?: string } = {};

    if (!username) {
      errors.username = '请输入用户名';
    }

    if (!password) {
      errors.password = '请输入密码';
    } else if (password.length < 6) {
      errors.password = '密码至少需要 6 位';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validate()) return;

    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch {
      // 错误已在 store 中处理
    }
  };

  return (
    <div className="auth-page">
      {/* 柔光背景 */}
      <div className="auth-background">
        <div className="background-gradient"></div>
        <div className="background-grid"></div>
        <div className="background-glow"></div>
      </div>

      <div className="auth-container">
        {/* Logo 区域 */}
        <div className="logo-area">
          <div className="logo-text">
            <i className="fas fa-code-branch"></i> PathMind
          </div>
          <div className="logo-tagline">AI 驱动的技术决策引擎</div>
        </div>

        {/* 登录卡片 */}
        <div className="auth-card">
          {/* 切换标签 */}
          <div className="tabs">
            <Link to="/login" className="tab active">登录</Link>
            <Link to="/register" className="tab">注册</Link>
          </div>

          {/* 表单 */}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">用户名</label>
              <div className="input-wrapper">
                <i className="fas fa-user input-icon"></i>
                <input
                  type="text"
                  className={`form-input ${formErrors.username ? 'error' : ''}`}
                  placeholder="请输入用户名"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              {formErrors.username && <span className="error-text">{formErrors.username}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">密码</label>
              <div className="input-wrapper password-wrapper">
                <i className="fas fa-lock input-icon"></i>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`form-input ${formErrors.password ? 'error' : ''}`}
                  placeholder="请输入密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <i
                  className={`fas password-toggle ${showPassword ? 'fa-eye' : 'fa-eye-slash'}`}
                  onClick={() => setShowPassword(!showPassword)}
                ></i>
              </div>
              {formErrors.password && <span className="error-text">{formErrors.password}</span>}
            </div>

            <div className="form-options">
              <label className="remember-me">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="checkbox-custom"></span>
                <span>记住我</span>
              </label>
              <Link to="/forgot-password" className="forgot-link">忘记密码？</Link>
            </div>

            {error && (
              <div className="auth-error">
                <i className="fas fa-exclamation-circle"></i>
                {error}
              </div>
            )}

            <button type="submit" className="btn-submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> 登录中...
                </>
              ) : (
                '登录'
              )}
            </button>
          </form>
        </div>

        {/* 底部提示 */}
        <div className="auth-footer">
          还没有账号？<Link to="/register">立即注册</Link>
        </div>
      </div>
    </div>
  );
}
