/**
 * useFormValidation - 表单验证 Hook
 *
 * 【功能】通过规则配置实现表单验证，支持同步/异步验证
 *
 * 【核心概念】
 * 1. 规则驱动 - 验证规则以数组形式配置
 * 2. 触碰追踪 - 只有被触碰的字段才显示错误
 * 3. 受控输入 - 通过 register() 展开到 input
 *
 * 【使用方式】
 *
 * 1. 定义规则
 * const rules = {
 *   username: [
 *     { test: (v) => !!v, message: '请输入用户名' },
 *     { test: (v) => String(v).length >= 2, message: '用户名至少2位' },
 *   ],
 *   password: [
 *     { test: (v) => !!v, message: '请输入密码' },
 *     { test: (v) => String(v).length >= 6, message: '密码至少6位' },
 *   ],
 * };
 *
 * 2. 初始化 Hook
 * const { register, validate, touchAll, reset } = useFormValidation({
 *   rules,
 *   initialValues: { username: '', password: '' },
 * });
 *
 * 3. JSX 中使用
 * <input {...register('username')} />
 * {register('username').error && <span>{register('username').error}</span>}
 *
 * 4. 提交时验证
 * const handleSubmit = async (e) => {
 *   e.preventDefault();
 *   touchAll();
 *   if (!await validate()) return;
 *   // 提交表单
 * };
 *
 * 【register() 返回值】
 * - name: 字段名
 * - value: 字段值
 * - onChange: 更新字段值
 * - error: 错误信息（字段被触碰后才返回，否则 undefined）
 *
 * 【高级用法】
 * 异步验证（检查用户名是否已存在）：
 * { test: async (v) => {
 *   const res = await checkUsernameAPI(String(v));
 *   return !res.exists;
 * }, message: '用户名已被占用' }
 *
 * 跨字段验证在 handleSubmit 中手动处理
 */

import { useState, useCallback } from 'react';

/** 验证规则 */
export type ValidationRule = {
  test: (value: unknown) => boolean | Promise<boolean>;  // 验证函数
  message: string;  // 失败时的错误信息
};

/** Hook 配置 */
export interface UseFormValidationOptions<T extends Record<string, unknown>> {
  rules: Partial<Record<keyof T, ValidationRule[]>>;  // 验证规则
  initialValues?: T;  // 初始值
}

/** Hook 返回值 */
export interface UseFormValidationReturn<T> {
  /** 注册字段，返回受控 input 所需的 props */
  register: <K extends keyof T>(name: K) => {
    name: string;
    value: T[K];
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    error: string | undefined;  // 字段被触碰后才返回错误
  };
  /** 验证所有字段，返回是否通过 */
  validate: () => Promise<boolean>;
  /** 触碰单个字段 */
  touchField: (name: keyof T) => void;
  /** 触碰所有字段（提交时调用） */
  touchAll: () => void;
  /** 重置表单到初始状态 */
  reset: () => void;
  /** 清除所有错误 */
  clearErrors: () => void;
  /** 当前错误信息 */
  errors: Partial<Record<keyof T, string>>;
}

export function useFormValidation<T extends Record<string, unknown>>(
  options: UseFormValidationOptions<T>
): UseFormValidationReturn<T> {
  const { rules, initialValues } = options;

  // 字段值
  const [values, setValues] = useState<T>(() => initialValues ?? ({} as T));
  // 错误信息
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  // 已触碰的字段
  const [touchedFields, setTouchedFields] = useState<Set<keyof T>>(new Set());

  /** 注册字段，返回 { name, value, onChange, error } */
  const register = useCallback(
    <K extends keyof T>(name: K) => {
      return {
        name: String(name),
        value: values[name],
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
          setValues((prev) => ({ ...prev, [name]: e.target.value as T[K] }));
        },
        // 只有触碰过的字段才显示错误
        error: touchedFields.has(name) ? errors[name] : undefined,
      };
    },
    [values, errors, touchedFields]
  );

  /** 触碰单个字段 */
  const touchField = useCallback((name: keyof T) => {
    setTouchedFields((prev) => new Set(prev).add(name));
  }, []);

  /** 触碰所有字段 */
  const touchAll = useCallback(() => {
    setTouchedFields(new Set(Object.keys(rules)) as Set<keyof T>);
  }, [rules]);

  /** 清除所有错误 */
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  /** 重置表单 */
  const reset = useCallback(() => {
    setValues(initialValues ?? ({} as T));
    setErrors({});
    setTouchedFields(new Set());
  }, [initialValues]);

  /** 验证所有规则 */
  const validate = useCallback(async (): Promise<boolean> => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    for (const [field, fieldRules] of Object.entries(rules)) {
      const fieldKey = field as keyof T;
      const value = values[fieldKey];

      for (const rule of fieldRules ?? []) {
        try {
          const result = rule.test(value);
          const passed = result instanceof Promise ? await result : result;
          if (!passed) {
            newErrors[fieldKey] = rule.message;
            isValid = false;
            break;
          }
        } catch {
          newErrors[fieldKey] = '验证失败';
          isValid = false;
          break;
        }
      }
    }

    setErrors(newErrors);
    return isValid;
  }, [rules, values]);

  return {
    register,
    validate,
    touchField,
    touchAll,
    reset,
    clearErrors,
    errors,
  };
}
