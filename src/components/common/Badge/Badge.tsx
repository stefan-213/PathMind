import React from 'react';
import './Badge.css';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'accent' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = ''
}: BadgeProps) {
  const classNames = [
    'badge-component',
    `badge-${variant}`,
    `badge-${size}`,
    className
  ].join(' ');

  return <span className={classNames}>{children}</span>;
}
