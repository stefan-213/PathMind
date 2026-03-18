import type { IconProps } from '../../../types';

interface SvgIconProps extends IconProps {
  href: string;
}

export function SvgIcon({ className = '', role = 'presentation', 'aria-hidden': ariaHidden = true, href }: SvgIconProps) {
  return (
    <svg className={className} role={role} aria-hidden={ariaHidden}>
      <use href={href}></use>
    </svg>
  );
}
