import React from 'react';
import './Textarea.scss';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({
  label,
  error,
  className = '',
  ...props
}: TextareaProps) {
  return (
    <div className={`textarea-wrapper ${error ? 'textarea-error' : ''} ${className}`}>
      {label && <label className="textarea-label">{label}</label>}
      <textarea
        className="textarea-field"
        {...props}
      />
      {error && <span className="textarea-error-message">{error}</span>}
    </div>
  );
}
