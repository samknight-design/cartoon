/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        space: {
          950: '#04030e',
          900: '#0A0818',
          800: '#0f0d23',
          700: '#15122e',
          600: '#1d1940',
        },
        coin: {
          light: '#FFE566',
          DEFAULT: '#FFD700',
          dark: '#B8860B',
        },
        gem: {
          light: '#C084FC',
          DEFAULT: '#9333EA',
          dark: '#6D28D9',
          cyan: '#06B6D4',
        },
      },
      fontFamily: {
        display: ['"Fredoka One"', 'cursive'],
        body: ['"Nunito"', 'sans-serif'],
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        coinSpin: {
          '0%': { transform: 'rotateY(0deg)' },
          '100%': { transform: 'rotateY(360deg)' },
        },
        gemPulse: {
          '0%, 100%': { filter: 'drop-shadow(0 0 6px #9333EA)' },
          '50%': { filter: 'drop-shadow(0 0 18px #A855F7) drop-shadow(0 0 36px #7C3AED)' },
        },
        celebrationPop: {
          '0%': { transform: 'scale(0) rotate(-15deg)', opacity: '0' },
          '60%': { transform: 'scale(1.15) rotate(5deg)', opacity: '1' },
          '80%': { transform: 'scale(0.95) rotate(-2deg)' },
          '100%': { transform: 'scale(1) rotate(0deg)' },
        },
        slideUp: {
          from: { transform: 'translateY(30px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        twinkle: {
          '0%, 100%': { opacity: '0.2', transform: 'scale(0.8)' },
          '50%': { opacity: '1', transform: 'scale(1.2)' },
        },
        countUp: {
          from: { transform: 'translateY(8px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
      },
      animation: {
        float: 'float 3s ease-in-out infinite',
        coinSpin: 'coinSpin 1s ease-in-out',
        gemPulse: 'gemPulse 2s ease-in-out infinite',
        celebrationPop: 'celebrationPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        slideUp: 'slideUp 0.4s ease-out forwards',
        shimmer: 'shimmer 2s linear infinite',
        twinkle: 'twinkle 2s ease-in-out infinite',
        countUp: 'countUp 0.3s ease-out forwards',
        wiggle: 'wiggle 0.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
