/**
 * useToast - 临时消息提示 Hook
 *
 * 【功能】显示临时消息（如成功/失败/警告提示），自动消失
 *
 * 【使用方式】
 *
 * 1. 初始化
 * const { toast, showToast } = useToast();
 *
 * 2. 显示提示
 * showToast({ message: '保存成功', type: 'success' });
 * showToast({ message: '出错了', type: 'error' });
 * showToast({ message: '自定义时长', type: 'info', duration: 5000 });
 *
 * 3. JSX 中渲染
 * {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}
 *
 * 【API】
 * - toast: 当前提示状态（null 或 { message, type, duration }）
 * - showToast: 显示提示，支持 message(必填)、type(默认 info)、duration(默认 3000ms)
 * - hideToast: 手动关闭提示
 */

import { useState, useCallback, useRef, useEffect } from 'react';

/** Toast 类型 */
export type ToastType = 'success' | 'info' | 'error' | 'warning';

/** Toast 配置 */
export interface ToastOptions {
  message: string;           // 提示文字
  type?: ToastType;          // 类型，默认 info
  duration?: number;         // 显示时长(ms)，默认 3000
}

/** Hook 返回值 */
export interface UseToastReturn {
  /** 当前 toast 状态 */
  toast: ToastOptions | null;
  /** 显示 toast */
  showToast: (options: ToastOptions) => void;
  /** 手动关闭 toast */
  hideToast: () => void;
}

/**
 * Toast Hook
 * @param defaultDuration - 默认显示时长(ms)
 */
export function useToast(defaultDuration = 600000): UseToastReturn {
  const [toast, setToast] = useState<ToastOptions | null>(null);
  const timerRef = useRef<number | null>(null);

  // 组件卸载时清除定时器
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  /** 显示 toast */
  const showToast = useCallback((options: ToastOptions) => {
    // 清除之前的定时器
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // 设置新的 toast
    const { duration = defaultDuration } = options;
    setToast(options);

    // 自动清除
    if (duration > 0) {
      timerRef.current = window.setTimeout(() => {
        setToast(null);
        timerRef.current = null;
      }, duration);
    }
  }, [defaultDuration]);

  /** 关闭 toast */
  const hideToast = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setToast(null);
  }, []);

  return {
    toast,
    showToast,
    hideToast,
  };
}
