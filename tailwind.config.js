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
        earth: {
          50: '#f9f6f0',
          100: '#f0eae0',
          200: '#e1d5c1',
          300: '#c8b69a',
          400: '#ae9373',
          500: '#967756',
          600: '#806045',
          700: '#684d39',
          800: '#553f31',
          900: '#47362c',
          950: '#271d17',
        },
        primary: '#14532D',
        secondary: '#22C55E',
        warmSand: '#EFEAD4',
        biscuitSec: '#F5EEDC',
        biscuitHover: '#F3EFE3',
        cardBg: '#FFFFFF',
        accentGreen: '#DCFCE7',
        goldAccent: '#D4AF37',
        customText: '#1F2937',
        textSecondary: '#6B7280',
        borders: '#E8E2D3',
        stone: {
          750: '#1e2d24',
          850: '#121f17',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'Inter', 'Outfit', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'grid-pattern': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cpath d='M0 0h40v40H0V0zm1 1h38v38H1V1z' fill='%2310b981' fill-opacity='0.03'/%3E%3C/svg%3E\")",
        'grid-pattern-dark': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cpath d='M0 0h40v40H0V0zm1 1h38v38H1V1z' fill='%2310b981' fill-opacity='0.05'/%3E%3C/svg%3E\")",
      }
    },
  },
  plugins: [],
}
