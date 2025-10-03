/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand colors - from style guide
        primary: {
          900: '#0b3a66', // deep blue
          700: '#1464a6', // primary
          500: '#2a8fe6', // bright primary (main)
          300: '#7fc0ff', // accent light
        },
        // Neutral colors - from style guide
        neutral: {
          900: '#0f1724', // text
          700: '#334155', // subtext
          400: '#94a3b8', // muted
          200: '#e6eef9', // surface light
          50: '#f8fafc',  // muted bg
        },
        // Semantic colors - from style guide
        success: {
          DEFAULT: '#16a34a',
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        warning: {
          DEFAULT: '#f59e0b',
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        error: {
          DEFAULT: '#ef4444',
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        // Utility colors
        white: '#ffffff',
        border: '#e6eef9',
        'muted-bg': '#f8fafc',
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif'
        ],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          '"Liberation Mono"',
          '"Courier New"',
          'monospace'
        ]
      },
      fontSize: {
        // Semantic font sizes from style guide
        'h1': ['28px', { lineHeight: '36px', fontWeight: '700' }],
        'h2': ['22px', { lineHeight: '30px', fontWeight: '600' }],
        'h3': ['18px', { lineHeight: '26px', fontWeight: '600' }],
        'body-large': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'small': ['12px', { lineHeight: '16px', fontWeight: '400' }],
        'mono-table': ['13px', { lineHeight: '18px', fontWeight: '400' }],
      },
      spacing: {
        // Base 4px spacing scale from style guide
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '6': '24px',
        '8': '32px',
        '12': '48px',
        '16': '64px',
      },
      borderRadius: {
        // From style guide
        'sm': '6px',
        'md': '12px',
        'lg': '20px',
      },
      boxShadow: {
        // From style guide
        'sm': '0 1px 2px rgba(14,25,40,0.06)',
        'md': '0 6px 18px rgba(14,25,40,0.08)',
        'lg': '0 20px 40px rgba(14,25,40,0.12)',
      },
      transitionDuration: {
        // From style guide
        'short': '120ms',
        'medium': '240ms',
        'long': '420ms',
      },
      transitionTimingFunction: {
        // From style guide
        'smooth': 'cubic-bezier(.2,.8,.2,1)',
      },
      zIndex: {
        // From style guide
        'base': '0',
        'header': '50',
        'sidebar': '60',
        'modal': '100',
        'toast': '110',
      },
      animation: {
        'fade-in': 'fadeIn 240ms cubic-bezier(.2,.8,.2,1)',
        'slide-up': 'slideUp 240ms cubic-bezier(.2,.8,.2,1)',
        'slide-down': 'slideDown 240ms cubic-bezier(.2,.8,.2,1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        }
      },
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography')
  ]
};
