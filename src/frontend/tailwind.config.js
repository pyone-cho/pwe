/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0f0ff',
          200: '#b9ddff',
          300: '#7cc4ff',
          400: '#36a9ff',
          500: '#0A84FF',
          600: '#0070E0',
          700: '#005BBB',
          800: '#004A99',
          900: '#003A7A',
          950: '#00295C',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'SF Pro Text', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 1px 3px rgba(0, 0, 0, 0.06)',
        'medium': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'glow': '0 0 0 3px rgba(10, 132, 255, 0.15)',
        'glow-lg': '0 0 0 4px rgba(10, 132, 255, 0.2)',
        'card': '0 1px 3px rgba(0,0,0,0.04)',
        'card-hover': '0 2px 8px rgba(0,0,0,0.08)',
        'glass': '0 4px 16px rgba(0,0,0,0.04)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      animation: {
        'slide-up': 'slide-up 0.4s ease-out',
        'fade-in': 'fade-in 0.4s ease-out',
      },
      keyframes: {
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
