import React from 'react';
import './Card.css';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'bordered' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  onClick?: () => void;
}

export function Card({
  children,
  className = '',
  variant = 'default',
  padding = 'lg',
  hoverable = true,
  onClick
}: CardProps) {
  const classNames = [
    'card-component',
    `card-${variant}`,
    `card-padding-${padding}`,
    onClick || hoverable ? 'card-hoverable' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classNames} onClick={onClick}>
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className = ''
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`card-header ${className}`}>{children}</div>;
}

export function CardTitle({
  children,
  className = ''
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <h3 className={`card-title ${className}`}>{children}</h3>;
}

export function CardDescription({
  children,
  className = ''
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <p className={`card-description ${className}`}>{children}</p>;
}

export function CardContent({
  children,
  className = ''
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`card-content ${className}`}>{children}</div>;
}

export function CardFooter({
  children,
  className = ''
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`card-footer ${className}`}>{children}</div>;
}
