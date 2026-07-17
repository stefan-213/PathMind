import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useFormValidation } from '../../hooks';
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

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const rules = {
    username: [
      { test: (v: unknown) => !!v, message: '请输入用户名' },
    ],
    password: [
      { test: (v: unknown) => !!v, message: '请输入密码' },
      { test: (v: unknown) => String(v).length >= 6, message: '密码至少需要 6 位' },
    ],
  };

  const { register, validate, touchAll } = useFormValidation({
    rules,
    initialValues: { username: '', password: '' },
  });

  const from = (location.state as RouteLocationState | null)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    touchAll();

    if (!await validate()) return;

    try {
      await login(register('username').value, register('password').value);
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
            <Link to="/register" onClick={clearError} className="tab">注册</Link>
          </div>

          {/* 表单 */}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">用户名</label>
              <div className="input-wrapper">
                <i className="fas fa-user input-icon"></i>
                <input
                  type="text"
                  className={`form-input ${register('username').error ? 'error' : ''}`}
                  placeholder="请输入用户名"
                  {...register('username')}
                />
              </div>
              {register('username').error && <span className="error-text">{register('username').error}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">密码</label>
              <div className="input-wrapper password-wrapper">
                <i className="fas fa-lock input-icon"></i>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`form-input ${register('password').error ? 'error' : ''}`}
                  placeholder="请输入密码"
                  {...register('password')}
                />
                <i
                  className={`fas password-toggle ${showPassword ? 'fa-eye' : 'fa-eye-slash'}`}
                  onClick={() => setShowPassword(!showPassword)}
                ></i>
              </div>
              {register('password').error && <span className="error-text">{register('password').error}</span>}
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
