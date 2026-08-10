import { memo } from 'react';
import type { QuickOptionsProps } from '../../../types/copilot';

/**
 * 快捷选项组件
 * 显示一系列可点击的快捷按钮
 */
const QuickOptions = memo(function QuickOptions({
  options,   // 选项列表
  onSelect,  // 点击回调
  disabled   // 是否禁用
}: QuickOptionsProps) {
  if (options.length === 0) return null;
  return (
    <div className="quick-options">
      {options.map((opt, i) => (
        <button
          key={i}
          type="button"
          className="quick-option-btn"
          disabled={disabled}
          onClick={() => {
            if (!disabled) onSelect(opt);
          }}
        >
          {opt}
        </button>
      ))}
    </div>
  );
});

export { QuickOptions };