/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Dark theme base (legacy — kept for existing components)
        dark: {
          50: '#f7f7f8',
          100: '#eeeef0',
          200: '#d9d9de',
          300: '#b8b8c1',
          400: '#91919f',
          500: '#737384',
          600: '#5d5d6b',
          700: '#4c4c57',
          800: '#41414a',
          900: '#393940',
          950: '#18181b',
        },
        // Accent colors (legacy — kept for existing components)
        accent: {
          purple: '#a855f7',
          blue: '#3b82f6',
          cyan: '#06b6d4',
          pink: '#ec4899',
          orange: '#f97316',
        },
        // 2026 design tokens
        surface: {
          0: 'rgb(9 9 11)',
          1: 'rgb(24 24 27 / 0.8)',
          2: 'rgb(39 39 42 / 0.6)',
          3: 'rgb(63 63 70 / 0.5)',
        },
        border: {
          subtle: 'rgb(255 255 255 / 0.05)',
          DEFAULT: 'rgb(255 255 255 / 0.1)',
          strong: 'rgb(255 255 255 / 0.15)',
        },
        brand: {
          primary: 'rgb(139 92 246)',
          secondary: 'rgb(34 211 238)',
        },
        signal: {
          success: 'rgb(74 222 128)',
          warning: 'rgb(250 204 21)',
          danger: 'rgb(248 113 113)',
        },
      },
      fontFamily: {
        sans: ['Inter Variable', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono Variable', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2xs': ['11px', { lineHeight: '14px' }],
        xs: ['12px', { lineHeight: '16px' }],
        sm: ['13px', { lineHeight: '18px' }],
        base: ['14px', { lineHeight: '20px' }],
        lg: ['18px', { lineHeight: '26px' }],
        xl: ['24px', { lineHeight: '32px' }],
        '2xl': ['32px', { lineHeight: '40px' }],
        '3xl': ['48px', { lineHeight: '56px' }],
        '4xl': ['56px', { lineHeight: '64px' }],
        '5xl': ['72px', { lineHeight: '80px' }],
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '8px',
        md: '12px',
        lg: '16px',
      },
      transitionDuration: {
        fast: '150ms',
        panel: '250ms',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 8s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(168, 85, 247, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(168, 85, 247, 0.8)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
