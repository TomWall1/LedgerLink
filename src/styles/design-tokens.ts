/**
 * LedgerLink Design Tokens
 * 
 * These tokens define the core design system values used throughout the application.
 * They are organized by category and provide consistent styling across all components.
 */

export const designTokens = {
  // Colors - Primary Palette
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
    
    // State colors
    success: '#16a34a',
    warning: '#f59e0b',
    error: '#ef4444',
    
    // Background colors
    mutedBg: '#f8fafc',
    border: '#e6eef9',
  },
  
  // Spacing scale (base 4px)
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
  
  // Border radius
  borderRadius: {
    sm: '6px',
    md: '12px',
    lg: '20px',
  },
  
  // Shadows
  shadows: {
    sm: '0 1px 2px rgba(14,25,40,0.06)',
    md: '0 6px 18px rgba(14,25,40,0.08)',
    lg: '0 20px 40px rgba(14,25,40,0.12)',
  },
  
  // Typography
  typography: {
    fontFamily: {
      primary: '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      mono: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    },
    fontSize: {
      h1: { size: '28px', lineHeight: '36px', fontWeight: '700' },
      h2: { size: '22px', lineHeight: '30px', fontWeight: '600' },
      h3: { size: '18px', lineHeight: '26px', fontWeight: '600' },
      bodyLarge: { size: '16px', lineHeight: '24px', fontWeight: '400' },
      body: { size: '14px', lineHeight: '20px', fontWeight: '400' },
      small: { size: '12px', lineHeight: '16px', fontWeight: '400' },
      mono: { size: '13px', lineHeight: '18px', fontWeight: '400' },
    },
  },
  
  // Z-index layers
  zIndex: {
    base: 0,
    stickyHeader: 50,
    sidebar: 60,
    modalOverlay: 100,
    toast: 110,
  },
  
  // Motion
  motion: {
    duration: {
      short: '120ms',
      medium: '240ms',
      long: '420ms',
    },
    easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
  },
  
  // Breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  
  // Component sizes
  components: {
    button: {
      height: '40px',
      padding: '8px 16px',
    },
    input: {
      height: '40px',
      padding: '8px 12px',
    },
    nav: {
      mobile: '56px',
      desktop: '64px',
    },
    sidebar: {
      expanded: '280px',
      collapsed: '72px',
    },
    modal: {
      width: '720px',
    },
    table: {
      rowHeight: '48px',
      denseRowHeight: '36px',
    },
  },
  
  // Icon sizes
  iconSizes: {
    dense: '16px',
    inline: '20px',
    default: '24px',
  },
} as const;

export type DesignTokens = typeof designTokens;