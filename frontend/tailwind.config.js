/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      // Colors matching the style guide
      colors: {
        primary: {
          900: '#0b3a66',
          700: '#1464a6', 
          500: '#2a8fe6',
          300: '#7fc0ff',
        },
        neutral: {
          900: '#0f1724',
          700: '#334155', 
          400: '#94a3b8',
          200: '#e6eef9',
        },
        success: '#16a34a',
        warning: '#f59e0b',
        error: '#ef4444',
        muted: '#f8fafc',
        border: '#e6eef9',
      },
      
      // Font family
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['ui-monospace', 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'monospace'],
      },
      
      // Spacing scale (base 4px)
      spacing: {
        '1': '4px',
        '2': '8px', 
        '3': '12px',
        '4': '16px',
        '6': '24px',
        '8': '32px',
        '12': '48px',
        '16': '64px',
      },
      
      // Border radius
      borderRadius: {
        'sm': '6px',
        'md': '12px', 
        'lg': '20px',
      },
      
      // Box shadows
      boxShadow: {
        'sm': '0 1px 2px rgba(14, 25, 40, 0.06)',
        'md': '0 6px 18px rgba(14, 25, 40, 0.08)',
        'lg': '0 20px 40px rgba(14, 25, 40, 0.12)',
        'button-primary': '0 6px 18px rgba(42, 143, 230, 0.12)',
      },
      
      // Typography
      fontSize: {
        'h1': ['28px', { lineHeight: '36px', fontWeight: '700' }],
        'h2': ['22px', { lineHeight: '30px', fontWeight: '600' }],
        'h3': ['18px', { lineHeight: '26px', fontWeight: '600' }],
        'large': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'base': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'small': ['12px', { lineHeight: '16px', fontWeight: '400' }],
        'mono': ['13px', { fontFamily: 'ui-monospace' }],
      },
      
      // Animation durations
      transitionDuration: {
        'short': '120ms',
        'medium': '240ms', 
        'long': '420ms',
      },
      
      // Animation timing
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
      
      // Z-index layers
      zIndex: {
        'base': '0',
        'sticky': '50',
        'sidebar': '60', 
        'modal': '100',
        'toast': '110',
      },
      
      // Container max widths
      maxWidth: {
        'container': '1280px',
        'auth': '400px',
        'modal': '720px',
      },
      
      // Height utilities
      height: {
        'nav': '64px',
        'nav-mobile': '56px',
        'input': '40px',
        'button': '40px',
        'table-row': '48px',
        'table-row-dense': '36px',
      },
      
      // Width utilities  
      width: {
        'sidebar': '280px',
        'sidebar-collapsed': '72px',
      },
    },
  },
  plugins: [],
}