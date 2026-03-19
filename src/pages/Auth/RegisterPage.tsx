import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import './Auth.css';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [formErrors, setFormErrors] = useState<{
    email?: string;
    username?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validate = () => {
    const errors: typeof formErrors = {};

    if (!email) {
      errors.email = '请输入邮箱';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = '请输入有效的邮箱地址';
    }

    if (!username) {
      errors.username = '请输入用户名';
    } else if (username.length < 2) {
      errors.username = '用户名至少需要 2 位';
    } else if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(username)) {
      errors.username = '用户名只能包含字母、数字、下划线';
    }

    if (!password) {
      errors.password = '请输入密码';
    } else if (password.length < 6) {
      errors.password = '密码至少需要 6 位';
    }

    if (!confirmPassword) {
      errors.confirmPassword = '请确认密码';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = '两次输入的密码不一致';
    }

    if (!agreeTerms) {
      errors.confirmPassword = '请同意用户协议和隐私条款';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const getPasswordStrength = (pwd: string): { level: number; text: string } => {
    if (!pwd) return { level: 0, text: '' };
    if (pwd.length < 6) return { level: 1, text: '太短' };
    if (pwd.length < 8) return { level: 2, text: '一般' };
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) {
      return { level: 4, text: '强' };
    }
    if (pwd.length >= 8 && (/[a-zA-Z]/.test(pwd) || /[0-9]/.test(pwd))) {
      return { level: 3, text: '中等' };
    }
    return { level: 2, text: '一般' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validate()) return;

    try {
      await register(email, username, password);
      navigate('/', { replace: true });
    } catch (err) {
      // 错误已在 store 中处理
    }
  };

  const passwordStrength = getPasswordStrength(password);

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

        {/* 注册卡片 */}
        <div className="auth-card">
          {/* 切换标签 */}
          <div className="tabs">
            <Link to="/login" className="tab">登录</Link>
            <Link to="/register" className="tab active">注册</Link>
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
                  placeholder="你的名字"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              {formErrors.username && <span className="error-text">{formErrors.username}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">邮箱</label>
              <div className="input-wrapper">
                <i className="fas fa-envelope input-icon"></i>
                <input
                  type="email"
                  className={`form-input ${formErrors.email ? 'error' : ''}`}
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {formErrors.email && <span className="error-text">{formErrors.email}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">密码</label>
              <div className="input-wrapper password-wrapper">
                <i className="fas fa-lock input-icon"></i>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`form-input ${formErrors.password ? 'error' : ''}`}
                  placeholder="至少8位"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <i
                  className={`fas password-toggle ${showPassword ? 'fa-eye' : 'fa-eye-slash'}`}
                  onClick={() => setShowPassword(!showPassword)}
                ></i>
              </div>
              {password && (
                <div className="password-strength">
                  <div className="strength-bar">
                    <div
                      className={`strength-level level-${passwordStrength.level}`}
                      style={{ width: `${passwordStrength.level * 25}%` }}
                    ></div>
                  </div>
                  <span className={`strength-text level-${passwordStrength.level}`}>
                    {passwordStrength.text}
                  </span>
                </div>
              )}
              {formErrors.password && <span className="error-text">{formErrors.password}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">确认密码</label>
              <div className="input-wrapper password-wrapper">
                <i className="fas fa-lock input-icon"></i>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className={`form-input ${formErrors.confirmPassword ? 'error' : ''}`}
                  placeholder="再次输入密码"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <i
                  className={`fas password-toggle ${showConfirmPassword ? 'fa-eye' : 'fa-eye-slash'}`}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                ></i>
              </div>
              {formErrors.confirmPassword && <span className="error-text">{formErrors.confirmPassword}</span>}
            </div>

            <div className="form-options">
              <label className="remember-me">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                />
                <span className="checkbox-custom"></span>
                <span>同意用户协议和隐私条款</span>
              </label>
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
                  <i className="fas fa-spinner fa-spin"></i> 注册中...
                </>
              ) : (
                '注册'
              )}
            </button>

            <div className="terms">
              点击注册即表示同意 <Link to="/terms">用户协议</Link> 和 <Link to="/privacy">隐私政策</Link>
            </div>
          </form>
        </div>

        {/* 底部提示 */}
        <div className="auth-footer">
          已有账号？<Link to="/login">立即登录</Link>
        </div>
      </div>
    </div>
  );
}
