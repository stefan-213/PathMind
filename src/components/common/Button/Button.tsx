import { Link } from 'react-router-dom';
import type { ButtonProps } from '../../../types';
import './Button.css';

export function Button({
  className = '',
  onClick,
  children,
  type = 'button',
  disabled = false,
  variant = 'primary',
  icon,
  href
}: ButtonProps) {
  const buttonClass = `btn btn-${variant} ${className}`.trim();

  if (href) {
    return (
      <Link to={href} className={buttonClass}>
        {icon && <span className="btn-icon">{icon}</span>}
        {children}
      </Link>
    );
  }

  return (
    <button
      className={buttonClass}
      onClick={onClick}
      type={type}
      disabled={disabled}
    >
      {icon && <span className="btn-icon">{icon}</span>}
      {children}
    </button>
  );
}
