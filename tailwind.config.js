/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
    },
    extend: {
      colors: {
        page: 'var(--color-page-bg)',
        brand: {
          50: '#EAF2FF',
          100: '#EAF2FF',
          200: '#A3C4F7',
          300: '#A3C4F7',
          400: '#2D6BE5',
          500: '#2D6BE5',
          600: '#1155CC',
          700: '#0A3A8C',
          800: '#0A3A8C',
          900: '#0A3A8C',
          950: '#082E70',
        },
        p6: {
          gray: {
            0: '#FFFFFF',
            100: '#FAFAFB',
            300: '#D9DEE5',
            400: '#9CA3AF',
            600: '#6B7280',
            700: '#4B5563',
            900: '#30343C',
            950: '#1E293B',
          },
          fitness: {
            bg: '#EAF2FF',
            text: '#1C4FA3',
          },
          golf: {
            bg: '#EAF8EE',
            text: '#2A6240',
          },
        },
        surface: {
          DEFAULT: 'var(--color-surface)',
          muted: 'var(--color-surface-muted)',
          border: 'var(--color-surface-border)',
        },
        content: {
          primary: 'var(--color-content-primary)',
          secondary: 'var(--color-content-secondary)',
          muted: 'var(--color-content-muted)',
        },
        status: {
          success: '#28C76F',
          warning: '#FF9F43',
          danger: '#EA5455',
        },
      },
      fontSize: {
        'page-title': ['2rem', { lineHeight: '2.5rem', fontWeight: '700' }],
        'section-label': ['0.875rem', { lineHeight: '1.25rem', fontWeight: '600' }],
        'table-header': ['0.875rem', { lineHeight: '1.25rem', fontWeight: '600' }],
        'metric-value': ['1.75rem', { lineHeight: '2.25rem', fontWeight: '700' }],
        'metric-label': ['0.875rem', { lineHeight: '1.25rem', fontWeight: '500' }],
        'body-sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'caption': ['0.75rem', { lineHeight: '1rem' }],
      },
      boxShadow: {
        card: 'var(--color-card-shadow)',
      },
      borderRadius: {
        card: '16px',
        control: '10px',
      },
    },
  },
  plugins: [],
};
