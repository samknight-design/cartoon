import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        flame: {
          50:  '#fff8ec',
          100: '#ffefd3',
          200: '#ffdba5',
          300: '#ffc06d',
          400: '#ff9832',
          500: '#ff7a0a',
          600: '#f05d00',
          700: '#c74202',
          800: '#9e340b',
          900: '#7f2c0c',
        },
        ember: {
          400: '#f59e0b',
          500: '#d97706',
          600: '#b45309',
        },
        arcane: {
          900: '#0a0a12',
          800: '#10101e',
          700: '#16162b',
          600: '#1e1e38',
          500: '#2a2a50',
        },
        gold: {
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
      },
      fontFamily: {
        display: ['Georgia', 'Cambria', 'serif'],
        body: ['system-ui', '-apple-system', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-pattern': "linear-gradient(to bottom, rgba(10,10,18,0.7) 0%, rgba(10,10,18,0.95) 100%)",
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease-out forwards',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glow: {
          '0%': { textShadow: '0 0 10px #f59e0b, 0 0 20px #f59e0b' },
          '100%': { textShadow: '0 0 20px #f59e0b, 0 0 40px #f59e0b, 0 0 60px #ea580c' },
        },
      },
    },
  },
  plugins: [],
}
export default config
