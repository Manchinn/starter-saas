/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts}',
    '../shared/**/*.{vue,js,ts}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        primary: {
          25:  '#F5F8FF',
          50:  '#EEF2FF',
          100: '#E0E9FF',
          200: '#C7D7FE',
          300: '#A5B8FC',
          400: '#7592ff',
          500: '#465fff',
          600: '#3641f5',
          700: '#2D35CF',
          800: '#252BAA',
          900: '#1E2390',
          950: '#161950',
        },
        sidebar: {
          DEFAULT: '#1C2434',
          dark:    '#24303F',
          hover:   '#2e3a4e',
          border:  'rgba(255,255,255,0.08)',
        },
      },
      boxShadow: {
        xs:        '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        card:      '0 1px 4px 0 rgb(0 0 0 / 0.07), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card-md': '0 4px 8px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.04)',
        'card-lg': '0 10px 20px -4px rgb(0 0 0 / 0.10), 0 4px 8px -4px rgb(0 0 0 / 0.06)',
        'focus':   '0 0 0 3px rgb(70 95 255 / 0.15)',
        'focus-sm':'0 0 0 2px rgb(70 95 255 / 0.20)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      backgroundImage: {
        'grid-slate': "linear-gradient(rgba(148,163,184,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.07) 1px, transparent 1px)",
        'grid-white': "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
      },
      backgroundSize: {
        'grid': '32px 32px',
      },
      animation: {
        'fade-in': 'fadeIn 0.15s ease-out',
        'slide-down': 'slideDown 0.15s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0', transform: 'scale(0.97)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideDown: {
          '0%':   { opacity: '0', transform: 'translateY(-4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
