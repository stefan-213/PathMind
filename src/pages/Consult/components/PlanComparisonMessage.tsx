import { memo } from 'react';
import { Badge, Button } from '../../../components/common';
import type { PlanComparisonMessageProps, PlanOption } from '../../../types/copilot';

/**
 * 格式化选项文本（去除 A. B. 等前缀）
 * @param option - 原始选项文本
 * @returns 去除前缀后的纯文本
 */
function formatOptionText(option: string): string {
  const match = option.match(/^[A-F][.、]\s*(.+)$/);
  return match ? match[1] : option;
}

/**
 * 方案对比列表组件
 * 渲染方案的优势/劣势等列表数据
 */
function PlanComparisonList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <span className="plan-comparison-empty">-</span>;
  }

  return (
    <ul className="plan-comparison-list">
      {items.map((item, index) => (
        <li key={`${item}-${index}`}>{item}</li>
      ))}
    </ul>
  );
}

/**
 * 方案对比消息组件
 * 展示多个方案的对比表格，包含推荐方案和决策提示
 */
const PlanComparisonMessage = memo(function PlanComparisonMessage({
  data,        // 方案对比数据
  disabled,    // 是否禁用按钮
  onSelectOption // 选择方案的回调函数
}: PlanComparisonMessageProps) {
  // 找到推荐方案
  const recommendedOption = data.options.find(
    (option) => option.id === data.recommended.option_id
  );

  // 定义对比表格的行配置
  const comparisonRows = [
    { label: '核心思路', render: (option: PlanOption) => option.core_idea },
    { label: '适合人群', render: (option: PlanOption) => option.suitable_for },
    { label: '优点', render: (option: PlanOption) => <PlanComparisonList items={option.pros} /> },
    { label: '风险/不足', render: (option: PlanOption) => <PlanComparisonList items={option.cons} /> },
    { label: '成本', render: (option: PlanOption) => option.cost },
    { label: '难度', render: (option: PlanOption) => option.difficulty },
  ];

  return (
    <div className="plan-comparison">
      {/* 方案对比表格 */}
      <div className="plan-comparison-table-wrap">
        <table className="plan-comparison-table">
          <thead>
            <tr>
              <th className="plan-comparison-table__metric">对比项</th>
              {data.options.map((option) => {
                const isRecommended = option.id === data.recommended.option_id;
                return (
                  <th
                    key={option.id}
                    className={isRecommended ? 'plan-comparison-table__column--recommended' : ''}
                  >
                    <div className="plan-option-name">
                      <span>{option.name}</span>
                      {isRecommended && <Badge variant="accent" size="sm">推荐</Badge>}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {comparisonRows.map((row) => (
              <tr key={row.label}>
                <th scope="row" className="plan-comparison-table__metric">
                  {row.label}
                </th>
                {data.options.map((option) => {
                  const isRecommended = option.id === data.recommended.option_id;
                  return (
                    <td
                      key={`${row.label}-${option.id}`}
                      className={isRecommended ? 'plan-comparison-table__column--recommended' : ''}
                    >
                      {row.render(option)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="plan-comparison-cards">
        {data.options.map((option) => {
          const isRecommended = option.id === data.recommended.option_id;

          return (
            <article
              key={option.id}
              className={`plan-comparison-card ${isRecommended ? 'plan-comparison-card--recommended' : ''}`}
            >
              <div className="plan-comparison-card__header">
                <h3>{option.name}</h3>
                {isRecommended ? <Badge variant="accent" size="sm">推荐</Badge> : null}
              </div>
              <div className="plan-comparison-card__body">
                {comparisonRows.map((row) => (
                  <div key={`${option.id}-${row.label}`} className="plan-comparison-card__row">
                    <span className="plan-comparison-card__label">{row.label}</span>
                    <div className="plan-comparison-card__value">{row.render(option)}</div>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </div>

      {/* 推荐方案区域 */}
      <section className="plan-recommendation">
        <div className="plan-recommendation__title">
          <i className="fas fa-star"></i>
          <span>推荐方案</span>
        </div>
        <div className="plan-recommendation__name">
          {recommendedOption?.name || data.recommended.option_id}
        </div>
        <p className="plan-recommendation__reason">{data.recommended.reason}</p>
      </section>

      {/* 决策提示 */}
      {data.decision_points.length > 0 && (
        <section className="plan-decision-points">
          <div className="plan-decision-points__title">决策提示</div>
          <ul>
            {data.decision_points.map((point, index) => (
              <li key={`${point}-${index}`}>{point}</li>
            ))}
          </ul>
        </section>
      )}

      {/* 操作按钮：每个方案对应一个生成按钮 */}
      <div className="plan-option-actions">
        {data.options.map((option) => {
          const isRecommended = option.id === data.recommended.option_id;
          return (
            <Button
              key={option.id}
              variant={isRecommended ? 'primary' : 'secondary'}
              disabled={disabled || !onSelectOption}
              onClick={() => {
                // 找到用户点击的方案的索引
                const clickedIndex = data.options.findIndex(
                  (o) => o.id === option.id
                );
                onSelectOption?.(option.id, clickedIndex);
              }}
            >
              生成：{option.name}
            </Button>
          );
        })}
      </div>
    </div>
  );
});

export { PlanComparisonMessage, formatOptionText };
