// Design Tokens for LedgerLink
// Based on the UI Style Guide - Finance-grade professional design

export const tokens = {
  // Color palette
  colors: {
    primary: {
      900: '#0b3a66',  // Deep blue - for text on light backgrounds
      700: '#1464a6',  // Primary dark - for hover states  
      500: '#2a8fe6',  // Primary - main brand color
      300: '#7fc0ff',  // Primary light - for accents and focus rings
      100: '#e6f2ff',  // Primary very light - for subtle backgrounds
    },
    neutral: {
      900: '#0f1724',  // Main text color
      700: '#334155',  // Secondary text
      600: '#475569',  // Muted text
      400: '#94a3b8',  // Placeholder text
      300: '#cbd5e1',  // Border light
      200: '#e6eef9',  // Surface light
      100: '#f1f5f9',  // Background light
      50: '#f8fafc',   // Subtle background
    },
    white: '#ffffff',
    
    // Status colors
    success: {
      500: '#16a34a',
      100: '#dcfce7',
      50: '#f0fdf4',
    },
    warning: {
      500: '#f59e0b', 
      100: '#fef3c7',
      50: '#fffbeb',
    },
    error: {
      500: '#ef4444',
      100: '#fee2e2', 
      50: '#fef2f2',
    },
    
    // Semantic colors
    muted: '#f8fafc',
    border: '#e6eef9',
    
    // Confidence score colors (for reconciliation matching)
    confidence: {
      high: '#16a34a',    // >90% match - green
      medium: '#2a8fe6',  // 70-89% match - blue  
      low: '#f59e0b',     // <70% match - amber
      none: '#ef4444',    // No match - red
    }
  },

  // Typography scale
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      mono: ['ui-monospace', 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'monospace'],
    },
    fontSize: {
      h1: { size: '28px', lineHeight: '36px', weight: '700' },
      h2: { size: '22px', lineHeight: '30px', weight: '600' },
      h3: { size: '18px', lineHeight: '26px', weight: '600' },
      large: { size: '16px', lineHeight: '24px', weight: '400' },
      base: { size: '14px', lineHeight: '20px', weight: '400' },
      small: { size: '12px', lineHeight: '16px', weight: '400' },
      mono: { size: '13px', lineHeight: '18px', weight: '400' },
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    }
  },

  // Spacing scale (base 4px)
  spacing: {
    0: '0px',
    1: '4px',
    2: '8px', 
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
    12: '48px',
    16: '64px',
    20: '80px',
    24: '96px',
  },

  // Border radius
  borderRadius: {
    none: '0px',
    sm: '6px',
    md: '12px', 
    lg: '20px',
    full: '9999px',
  },

  // Shadows
  shadows: {
    none: 'none',
    sm: '0 1px 2px rgba(14, 25, 40, 0.06)',
    md: '0 6px 18px rgba(14, 25, 40, 0.08)',
    lg: '0 20px 40px rgba(14, 25, 40, 0.12)',
    button: '0 6px 18px rgba(42, 143, 230, 0.12)',
    focus: '0 0 0 3px rgba(42, 143, 230, 0.12)',
  },

  // Animation
  animation: {
    duration: {
      short: '120ms',
      medium: '240ms', 
      long: '420ms',
    },
    easing: {
      smooth: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    }
  },

  // Layout dimensions
  layout: {
    container: '1280px',
    sidebar: '280px',
    sidebarCollapsed: '72px',
    header: '64px',
    headerMobile: '56px',
    input: '40px',
    button: '40px',
    tableRow: '48px',
    tableRowDense: '36px',
  },

  // Z-index layers
  zIndex: {
    base: 0,
    sticky: 50,
    sidebar: 60,
    modal: 100,
    toast: 110,
  },

  // Breakpoints  
  breakpoints: {
    sm: '640px',
    md: '768px', 
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  }
};

// Component-specific token mappings
export const components = {
  button: {
    primary: {
      background: tokens.colors.primary[500],
      backgroundHover: tokens.colors.primary[700],
      text: tokens.colors.white,
      shadow: tokens.shadows.button,
      borderRadius: tokens.borderRadius.sm,
      height: tokens.layout.button,
    },
    secondary: {
      background: tokens.colors.white,
      backgroundHover: tokens.colors.muted,
      text: tokens.colors.primary[700],
      border: tokens.colors.border,
      borderRadius: tokens.borderRadius.sm,
      height: tokens.layout.button,
    },
    ghost: {
      background: 'transparent',
      backgroundHover: tokens.colors.neutral[200],
      text: tokens.colors.neutral[700],
      borderRadius: tokens.borderRadius.sm,
      height: tokens.layout.button,
    },
    destructive: {
      background: tokens.colors.error[500],
      backgroundHover: '#dc2626',
      text: tokens.colors.white,
      borderRadius: tokens.borderRadius.sm,
      height: tokens.layout.button,
    }
  },
  
  input: {
    background: tokens.colors.white,
    border: tokens.colors.border,
    borderFocus: tokens.colors.primary[500],
    borderError: tokens.colors.error[500],
    borderRadius: tokens.borderRadius.sm,
    height: tokens.layout.input,
    shadow: tokens.shadows.focus,
  },

  card: {
    background: tokens.colors.white,
    border: tokens.colors.border,
    borderRadius: tokens.borderRadius.md,
    shadow: tokens.shadows.md,
    padding: tokens.spacing[6],
  },

  badge: {
    success: {
      background: tokens.colors.success[50],
      text: tokens.colors.success[500],
    },
    warning: {
      background: tokens.colors.warning[50], 
      text: tokens.colors.warning[500],
    },
    error: {
      background: tokens.colors.error[50],
      text: tokens.colors.error[500],
    },
    neutral: {
      background: tokens.colors.neutral[100],
      text: tokens.colors.neutral[700],
    }
  },

  // Table-specific tokens (important for LedgerLink)
  table: {
    headerBackground: tokens.colors.neutral[50],
    headerText: tokens.colors.neutral[700],
    rowHeight: tokens.layout.tableRow,
    rowHeightDense: tokens.layout.tableRowDense,
    rowHover: tokens.colors.neutral[50],
    border: tokens.colors.border,
    text: tokens.colors.neutral[900],
    textMuted: tokens.colors.neutral[600],
  }
};

// Utility functions for using tokens
export const utils = {
  // Get color with opacity
  rgba: (color, opacity) => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  },

  // Get spacing value
  space: (multiplier) => `${4 * multiplier}px`,

  // Media queries
  mediaQuery: {
    sm: `(min-width: ${tokens.breakpoints.sm})`,
    md: `(min-width: ${tokens.breakpoints.md})`,
    lg: `(min-width: ${tokens.breakpoints.lg})`,
    xl: `(min-width: ${tokens.breakpoints.xl})`,
    '2xl': `(min-width: ${tokens.breakpoints['2xl']})`,
  },

  // Confidence score helpers (specific to LedgerLink)
  getConfidenceColor: (score) => {
    if (score >= 90) return tokens.colors.confidence.high;
    if (score >= 70) return tokens.colors.confidence.medium; 
    if (score >= 50) return tokens.colors.confidence.low;
    return tokens.colors.confidence.none;
  },

  getConfidenceBadgeStyle: (score) => {
    const color = utils.getConfidenceColor(score);
    return {
      backgroundColor: utils.rgba(color, 0.1),
      color: color,
      border: `1px solid ${utils.rgba(color, 0.2)}`,
    };
  }
};

export default { tokens, components, utils };