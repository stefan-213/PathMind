import { isValidEmail } from './email';

// ==================== 验证规则 ====================
export const editRules = {
  username: [
    { test: (v: unknown) => !!String(v).trim(), message: '用户名不能为空' },
  ],
  email: [
    { test: (v: unknown) => !!String(v).trim(), message: '邮箱不能为空' },
    { test: (v: unknown) => isValidEmail(String(v)), message: '邮箱格式不正确' },
  ],
};

export const passwordRules = {
  oldPassword: [
    { test: (v: unknown) => !!v, message: '请输入当前密码' },
  ],
  newPassword: [
    { test: (v: unknown) => !!v, message: '请输入新密码' },
    { test: (v: unknown) => String(v).length >= 6, message: '新密码至少需要 6 位' },
  ],
  confirmPassword: [
    { test: (v: unknown) => !!v, message: '请确认新密码' },
  ],
};