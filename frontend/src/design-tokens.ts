/**
 * LedgerLink Design Tokens
 * Production-ready design system tokens
 */

export const designTokens = {
  colors: {
    primary: {
      900: '#0b3a66', // deep blue
      700: '#1464a6', // primary
      500: '#2a8fe6', // bright primary
      300: '#7fc0ff', // accent light
    },
    neutral: {
      900: '#0f1724', // text
      700: '#334155', // subtext
      400: '#94a3b8', // muted
      200: '#e6eef9', // surface light
    },
    white: '#ffffff',
    success: '#16a34a',
    warning: '#f59e0b',
    error: '#ef4444',
    mutedBg: '#f8fafc',
    border: '#e6eef9',
  },
  spacing: {
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    6: '24px',
    8: '32px',
    12: '48px',
    16: '64px',
  },
  borderRadius: {
    sm: '6px',
    md: '12px',
    lg: '20px',
  },
  shadows: {
    sm: '0 1px 2px rgba(14,25,40,0.06)',
    md: '0 6px 18px rgba(14,25,40,0.08)',
    lg: '0 20px 40px rgba(14,25,40,0.12)',
  },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
    monoFontFamily: 'ui-monospace, "Fira Code", Consolas, monospace',
    scale: {
      h1: { size: '28px', lineHeight: '36px', weight: '700' },
      h2: { size: '22px', lineHeight: '30px', weight: '600' },
      h3: { size: '18px', lineHeight: '26px', weight: '600' },
      bodyLarge: { size: '16px', lineHeight: '24px', weight: '400' },
      body: { size: '14px', lineHeight: '20px', weight: '400' },
      small: { size: '12px', lineHeight: '16px', weight: '400' },
      mono: { size: '13px', lineHeight: '18px', weight: '400' },
    },
  },
  zIndex: {
    base: 0,
    stickyHeader: 50,
    sidebar: 60,
    modalOverlay: 100,
    toast: 110,
  },
  motion: {
    duration: {
      short: '120ms',
      medium: '240ms',
      long: '420ms',
    },
    easing: 'cubic-bezier(.2,.8,.2,1)',
  },
  layout: {
    topNavHeight: {
      desktop: '64px',
      mobile: '56px',
    },
    sidebarWidth: {
      expanded: '280px',
      collapsed: '72px',
    },
  },
  iconSizes: {
    sm: '16px',
    md: '20px',
    lg: '24px',
  },
};

export type DesignTokens = typeof designTokens;

// Helper functions for accessing tokens
export const getColor = (path: string) => {
  const keys = path.split('.');
  let value: any = designTokens.colors;
  for (const key of keys) {
    value = value[key];
  }
  return value;
};

export const getSpacing = (size: keyof typeof designTokens.spacing) => {
  return designTokens.spacing[size];
};

export const getShadow = (size: keyof typeof designTokens.shadows) => {
  return designTokens.shadows[size];
};