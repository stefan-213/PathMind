export interface IconProps {
  className?: string;
  role?: 'presentation' | 'img';
  'aria-hidden'?: boolean;
}

export interface ButtonProps {
  className?: string;
  onClick?: () => void;
  children: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'primary-blue' | 'text' | 'cta-white';
  icon?: React.ReactNode;
  href?: string;
}

export interface LinkItem {
  href: string;
  label: string;
  icon?: React.ReactNode;
}

export interface CardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  links: LinkItem[];
}
