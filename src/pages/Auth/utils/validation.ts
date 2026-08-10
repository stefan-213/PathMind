/**
 * Auth 表单验证规则
 */

export const rules = {
  username: [
    { test: (v: unknown) => !!v, message: '请输入用户名' },
    { test: (v: unknown) => String(v).length >= 2, message: '用户名至少需要 2 位' },
    { test: (v: unknown) => /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(String(v)), message: '用户名只能包含字母、数字、下划线' },
  ],
  email: [
    { test: (v: unknown) => !!v, message: '请输入邮箱' },
    { test: (v: unknown) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v)), message: '请输入有效的邮箱地址' },
  ],
  phone: [
    { test: (v: unknown) => !v || /^1[3-9]\d{9}$/.test(String(v)), message: '请输入有效的手机号' },
  ],
  password: [
    { test: (v: unknown) => !!v, message: '请输入密码' },
    { test: (v: unknown) => String(v).length >= 6, message: '密码至少需要 6 位' },
  ],
};