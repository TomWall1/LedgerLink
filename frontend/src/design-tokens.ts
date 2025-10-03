/**
 * LedgerLink Design Tokens
 * Production-ready design system tokens from style guide
 * 
 * Usage:
 * import { colors, spacing, typography } from './design-tokens';
 */

export const colors = {
  // Primary palette
  primary: {
    900: '#0b3a66', // deep blue
    700: '#1464a6', // primary
    500: '#2a8fe6', // bright primary (main)
    300: '#7fc0ff', // accent light
  },
  
  // Neutral palette
  neutral: {
    900: '#0f1724', // text
    700: '#334155', // subtext
    400: '#94a3b8', // muted
    200: '#e6eef9', // surface light
    50: '#f8fafc',  // muted bg
  },
  
  // Semantic colors
  success: '#16a34a',
  warning: '#f59e0b',
  error: '#ef4444',
  
  // Utility colors
  white: '#ffffff',
  border: '#e6eef9',
  mutedBg: '#f8fafc',
} as const;

export const spacing = {
  // Base 4px scale
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  6: '24px',
  8: '32px',
  12: '48px',
  16: '64px',
} as const;

export const borderRadius = {
  sm: '6px',
  md: '12px',
  lg: '20px',
} as const;

export const shadows = {
  sm: '0 1px 2px rgba(14,25,40,0.06)',
  md: '0 6px 18px rgba(14,25,40,0.08)',
  lg: '0 20px 40px rgba(14,25,40,0.12)',
} as const;

export const typography = {
  fontFamily: {
    sans: "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    mono: "ui-monospace, 'SFMono-Regular', Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
  
  // Type scale from style guide (px values)
  fontSize: {
    h1: { size: '28px', lineHeight: '36px', fontWeight: '700' },
    h2: { size: '22px', lineHeight: '30px', fontWeight: '600' },
    h3: { size: '18px', lineHeight: '26px', fontWeight: '600' },
    bodyLarge: { size: '16px', lineHeight: '24px', fontWeight: '400' },
    body: { size: '14px', lineHeight: '20px', fontWeight: '400' },
    small: { size: '12px', lineHeight: '16px', fontWeight: '400' },
    monoTable: { size: '13px', lineHeight: '18px', fontWeight: '400' },
  },
} as const;

export const motion = {
  duration: {
    short: '120ms',
    medium: '240ms',
    long: '420ms',
  },
  easing: {
    smooth: 'cubic-bezier(.2,.8,.2,1)',
  },
} as const;

export const zIndex = {
  base: 0,
  header: 50,
  sidebar: 60,
  modal: 100,
  toast: 110,
} as const;

// Icon sizes (Lucide icons)
export const iconSizes = {
  small: 16,   // dense table rows
  medium: 20,  // inline
  large: 24,   // controls (default)
} as const;

// Button variants configuration
export const buttonVariants = {
  primary: {
    background: colors.primary[500],
    color: colors.white,
    hover: colors.primary[700],
    shadow: '0 6px 18px rgba(42,143,230,0.12)',
  },
  secondary: {
    background: colors.white,
    color: colors.primary[700],
    border: `1px solid ${colors.border}`,
    hover: colors.neutral[200],
  },
  ghost: {
    background: 'transparent',
    color: colors.neutral[700],
    hover: colors.neutral[200],
  },
  destructive: {
    background: colors.error,
    color: colors.white,
    hover: '#dc2626',
  },
} as const;

// Badge/status chip colors for match confidence
export const confidenceBadges = {
  high: {
    // >= 90%
    background: '#dcfce7',
    color: colors.success,
    label: 'High',
  },
  medium: {
    // 70-89%
    background: '#dbeafe',
    color: colors.primary[500],
    label: 'Medium',
  },
  low: {
    // < 70%
    background: '#fef3c7',
    color: colors.warning,
    label: 'Low',
  },
  failed: {
    // Unmatched
    background: '#fee2e2',
    color: colors.error,
    label: 'Failed',
  },
} as const;

// Table configuration
export const table = {
  rowHeight: {
    default: '48px',
    dense: '36px',
  },
  header: {
    background: colors.mutedBg,
    fontSize: typography.fontSize.small.size,
    textTransform: 'uppercase',
    color: colors.neutral[700],
  },
} as const;

// Layout breakpoints (Tailwind-style)
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Navigation dimensions
export const navigation = {
  topNav: {
    height: {
      mobile: '56px',
      desktop: '64px',
    },
  },
  sidebar: {
    width: {
      expanded: '280px',
      collapsed: '72px',
    },
  },
} as const;

// Export all tokens as default
export default {
  colors,
  spacing,
  borderRadius,
  shadows,
  typography,
  motion,
  zIndex,
  iconSizes,
  buttonVariants,
  confidenceBadges,
  table,
  breakpoints,
  navigation,
};
