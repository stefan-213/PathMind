import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useFormValidation } from '../../hooks';
import { getPasswordStrength } from './utils/password';
import { rules } from './utils/validation';
import './Auth.scss';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register: authRegister, isLoading, error, clearError } = useAuthStore();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState<string>('');

  const { register, validate, touchAll } = useFormValidation({
    rules,
    initialValues: {
      username: '',
      email: '',
      phone: '',
      password: '',
    },
  });

  const passwordStrength = getPasswordStrength(register('password').value);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setConfirmPasswordError('');
    touchAll();

    // 手动检查密码确认
    if (register('password').value !== confirmPassword) {
      setConfirmPasswordError('两次输入的密码不一致');
      return;
    }

    // 手动检查 agreeTerms（checkbox 不通过 register）
    if (!agreeTerms) {
      setConfirmPasswordError('请同意用户协议和隐私条款');
      return;
    }

    if (!await validate()) return;

    try {
      await authRegister(
        register('username').value,
        register('password').value,
        register('email').value,
        register('phone').value || undefined
      );
      navigate('/login', { replace: true });
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

        {/* 注册卡片 */}
        <div className="auth-card">
          {/* 切换标签 */}
          <div className="tabs">
            <Link to="/login" onClick={clearError} className="tab">登录</Link>
            <Link to="/register" className="tab active">注册</Link>
          </div>

          {/* 表单 */}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">用户名(不可重复)</label>
              <div className="input-wrapper">
                <i className="fas fa-user input-icon"></i>
                <input
                  type="text"
                  className={`form-input ${register('username').error ? 'error' : ''}`}
                  placeholder="你的昵称"
                  {...register('username')}
                />
              </div>
              {register('username').error && <span className="error-text">{register('username').error}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">邮箱(不可重复)</label>
              <div className="input-wrapper">
                <i className="fas fa-envelope input-icon"></i>
                <input
                  type="email"
                  className={`form-input ${register('email').error ? 'error' : ''}`}
                  placeholder="your@email.com"
                  {...register('email')}
                />
              </div>
              {register('email').error && <span className="error-text">{register('email').error}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">手机号</label>
              <div className="input-wrapper">
                <i className="fas fa-phone input-icon"></i>
                <input
                  type="tel"
                  className={`form-input ${register('phone').error ? 'error' : ''}`}
                  placeholder="请输入手机号"
                  {...register('phone')}
                />
              </div>
              {register('phone').error && <span className="error-text">{register('phone').error}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">密码</label>
              <div className="input-wrapper password-wrapper">
                <i className="fas fa-lock input-icon"></i>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`form-input ${register('password').error ? 'error' : ''}`}
                  placeholder="至少6位"
                  {...register('password')}
                />
                <i
                  className={`fas password-toggle ${showPassword ? 'fa-eye' : 'fa-eye-slash'}`}
                  onClick={() => setShowPassword(!showPassword)}
                ></i>
              </div>
              {register('password').value && (
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
              {register('password').error && <span className="error-text">{register('password').error}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">确认密码</label>
              <div className="input-wrapper password-wrapper">
                <i className="fas fa-lock input-icon"></i>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className={`form-input ${confirmPasswordError ? 'error' : ''}`}
                  placeholder="再次输入密码"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setConfirmPasswordError('');
                  }}
                />
                <i
                  className={`fas password-toggle ${showConfirmPassword ? 'fa-eye' : 'fa-eye-slash'}`}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                ></i>
              </div>
              {confirmPasswordError && <span className="error-text">{confirmPasswordError}</span>}
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