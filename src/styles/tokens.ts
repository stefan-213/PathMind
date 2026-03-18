/**
 * Design Tokens - Centralized theme values for PathMind
 * These tokens should be used across the application for consistent styling
 */

export const tokens = {
  // Brand Colors
  colors: {
    primary: {
      DEFAULT: 'var(--primary)',
      light: 'var(--primary-light)',
      dark: 'var(--primary-dark)',
      bg: 'var(--primary-bg)',
      border: 'var(--primary-border)',
      shadow: 'var(--primary-shadow)',
    },
    accent: {
      DEFAULT: 'var(--accent)',
      light: 'var(--accent-light)',
      hover: 'var(--accent-hover)',
    },
    // Text Colors
    text: {
      DEFAULT: 'var(--text)',
      heading: 'var(--text-h)',
      primary: 'var(--text-primary)',
      secondary: 'var(--text-secondary)',
      light: 'var(--text-light)',
      white: 'var(--text-white)',
      muted: 'var(--text-muted)',
    },
    // Background Colors
    bg: {
      DEFAULT: 'var(--bg)',
      primary: 'var(--bg-primary)',
      secondary: 'var(--bg-secondary)',
      dark: 'var(--bg-dark)',
      card: 'var(--bg-card)',
    },
    // Border Colors
    border: {
      DEFAULT: 'var(--border)',
      color: 'var(--border-color)',
      light: 'var(--border-light)',
    },
  },

  // Spacing
  space: {
    xs: 'var(--space-xs)',
    sm: 'var(--space-sm)',
    md: 'var(--space)',
    lg: 'var(--space-lg)',
    xl: 'var(--space-xl)',
    '2xl': 'var(--space-2xl)',
    '3xl': 'var(--space-3xl)',
  },

  // Border Radius
  radius: {
    lg: 'var(--radius-lg)',
    xl: 'var(--radius-xl)',
    full: 'var(--radius-full)',
  },

  // Shadows
  shadow: {
    sm: 'var(--shadow-sm)',
    md: 'var(--shadow-md)',
    lg: 'var(--shadow-lg)',
    xl: 'var(--shadow-xl)',
  },

  // Typography
  font: {
    sans: 'var(--sans)',
    heading: 'var(--heading)',
    mono: 'var(--mono)',
  },

  // Transitions
  transition: 'var(--transition)',
} as const;

// Button variant styles
export const buttonVariants = {
  primary: {
    background: 'var(--primary)',
    color: 'var(--text-white)',
    '&:hover': {
      background: 'var(--primary-light)',
    },
  },
  secondary: {
    background: 'var(--border-light)',
    color: 'var(--text-primary)',
    '&:hover': {
      background: 'var(--border-color)',
    },
  },
  accent: {
    background: 'var(--accent)',
    color: 'var(--text-white)',
    '&:hover': {
      background: 'var(--accent-hover)',
    },
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-secondary)',
    '&:hover': {
      background: 'var(--border-light)',
    },
  },
} as const;

// Component default styles
export const componentStyles = {
  card: {
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-xl)',
    padding: 'var(--space-xl)',
    border: '1px solid var(--border-color)',
    boxShadow: 'var(--shadow-sm)',
  },
  input: {
    width: '100%',
    padding: 'var(--space-md)',
    border: '2px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)',
    fontSize: '15px',
    fontFamily: 'inherit',
    transition: 'var(--transition)',
    '&:focus': {
      outline: 'none',
      borderColor: 'var(--primary)',
      boxShadow: '0 0 0 4px var(--primary-bg)',
    },
  },
} as const;

export type ButtonVariant = keyof typeof buttonVariants;
