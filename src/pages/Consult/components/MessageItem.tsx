import { useState, memo } from 'react';
import type { MessageItemProps } from '../../../types/copilot';
import { parseAIContent, parseJSONResponse } from '../utils/parse';
import { PlanComparisonMessage } from './PlanComparisonMessage';
import { formatOptionText } from './PlanComparisonMessage';

/**
 * 单条消息组件
 * 渲染用户消息或AI消息，支持多种内容格式
 */
const MessageItem = memo(function MessageItem({
  message,              // 消息数据
  onOptionSelect,       // 选项选择回调
  onPlanOptionSelect,   // 方案选择回调
  optionsDisabled = false, // 选项是否禁用
}: MessageItemProps) {
  const [showThinking, setShowThinking] = useState(false); // 是否显示思考过程
  const isAssistant = message.role === 'assistant';
  const { thinking, response } = parseAIContent(message.content);

  // 解析JSON响应，判断内容类型
  const jsonParsed = parseJSONResponse(response);

  // preview/diagnosis 格式不渲染
  if (!jsonParsed) return null;

  const isPlanOptionsFormat = jsonParsed.type === 'plan-options'; // 方案对比
  const isQuestionFormat = jsonParsed.type === 'question';        // 问答

  return (
    <div className={`message-item ${isAssistant ? '' : 'message-item--user'}${isPlanOptionsFormat ? ' message-item--plan-options' : ''}`}>
      {/* AI消息头部 */}
      {isAssistant && (
        <div className="message-header">
          <span className="message-label">PathMind AI</span>
          <span className="message-time">刚刚</span>
        </div>
      )}
      <div className={`message-bubble ${isAssistant ? 'message-bubble--assistant' : 'message-bubble--user'}`}>
        {/* 思考过程 - 可折叠展开 */}
        {thinking && (
          <div className="thinking-section">
            <button
              className="thinking-toggle"
              onClick={() => setShowThinking(!showThinking)}
            >
              {showThinking ? '▼' : '▶'} 思考过程
            </button>
            {showThinking && (
              <div className="thinking-content">
                {thinking.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 消息内容渲染 */}
        <div className="message-content">
          {isPlanOptionsFormat ? (
            // 方案对比格式
            <PlanComparisonMessage
              data={jsonParsed.planComparison}
              disabled={optionsDisabled}
              onSelectOption={onPlanOptionSelect}
            />
          ) : message.isHtml ? (
            // HTML格式内容（使用dangerouslySetInnerHTML渲染）
            <div dangerouslySetInnerHTML={{ __html: message.content }} />
          ) : isQuestionFormat ? (
            // 问答格式：显示问题和选项按钮
            <div className="question-container">
              <p className="question-text">{jsonParsed.question}</p>
              {jsonParsed.options && jsonParsed.options.length > 0 && (
                <div className="question-options-list">
                  {jsonParsed.options.map((opt, idx) => {
                    const prefix = String.fromCharCode(65 + idx); // A, B, C, ...
                    const optionText = formatOptionText(opt);
                    return (
                      <button
                        key={idx}
                        type="button"
                        className="question-option-item"
                        disabled={optionsDisabled}
                        onClick={() => {
                          if (optionsDisabled) return;
                          onOptionSelect?.(opt);
                        }}
                      >
                        <span className="option-prefix">{prefix}.</span>
                        <span className="option-text">{optionText}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            // 普通文本格式：按行渲染，识别选项行
            response.split('\n').map((line, i) => {
              const trimmedLine = line.trim();
              if (/^[A-D][.、]\s/.test(trimmedLine)) {
                return <div key={i} className="option-line">{line}</div>;
              }
              return line ? <p key={i}>{line}</p> : <br key={i} />;
            })
          )}
        </div>
      </div>
    </div>
  );
});

export { MessageItem };