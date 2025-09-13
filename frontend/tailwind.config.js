/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          900: '#0b3a66',
          800: '#0f4577',
          700: '#1464a6',
          600: '#1a74c7',
          500: '#2a8fe6',
          400: '#54a3eb',
          300: '#7fc0ff',
          200: '#a6d1ff',
          100: '#cce5ff',
          50: '#f0f7ff',
        },
        neutral: {
          900: '#0f1724',
          800: '#1e293b',
          700: '#334155',
          600: '#475569',
          500: '#64748b',
          400: '#94a3b8',
          300: '#cbd5e1',
          200: '#e6eef9',
          100: '#f1f5f9',
          50: '#f8fafc',
        },
        success: {
          600: '#059669',
          500: '#16a34a',
          400: '#22c55e',
          100: '#dcfce7',
        },
        warning: {
          600: '#d97706',
          500: '#f59e0b',
          400: '#fbbf24',
          100: '#fef3c7',
        },
        error: {
          600: '#dc2626',
          500: '#ef4444',
          400: '#f87171',
          100: '#fecaca',
        },
        muted: {
          bg: '#f8fafc',
          border: '#e6eef9',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial'],
        mono: ['ui-monospace', '"Fira Code"', 'Consolas', 'monospace'],
      },
      fontSize: {
        'h1': ['28px', { lineHeight: '36px', fontWeight: '700' }],
        'h2': ['22px', { lineHeight: '30px', fontWeight: '600' }],
        'h3': ['18px', { lineHeight: '26px', fontWeight: '600' }],
        'body-lg': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'small': ['12px', { lineHeight: '16px', fontWeight: '400' }],
        'mono': ['13px', { lineHeight: '18px', fontWeight: '400' }],
      },
      spacing: {
        '18': '72px',
        '88': '352px',
        '112': '448px',
      },
      borderRadius: {
        'sm': '6px',
        'md': '12px',
        'lg': '20px',
      },
      boxShadow: {
        'sm': '0 1px 2px rgba(14,25,40,0.06)',
        'md': '0 6px 18px rgba(14,25,40,0.08)',
        'lg': '0 20px 40px rgba(14,25,40,0.12)',
        'primary': '0 6px 18px rgba(42,143,230,0.12)',
      },
      zIndex: {
        'sticky-header': '50',
        'sidebar': '60',
        'modal-overlay': '100',
        'toast': '110',
      },
      transitionDuration: {
        '120': '120ms',
        '240': '240ms',
        '420': '420ms',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(.2,.8,.2,1)',
      },
      animation: {
        'fade-in': 'fadeIn 240ms cubic-bezier(.2,.8,.2,1)',
        'slide-up': 'slideUp 240ms cubic-bezier(.2,.8,.2,1)',
        'slide-down': 'slideDown 240ms cubic-bezier(.2,.8,.2,1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};