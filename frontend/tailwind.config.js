/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flash': 'flash 0.8s ease-in-out infinite',
      },
      keyframes: {
        flash: {
          '0%, 100%': { backgroundColor: 'rgb(220 38 38)' },
          '50%': { backgroundColor: 'rgb(153 27 27)' },
        }
      }
    },
  },
  plugins: [],
}
