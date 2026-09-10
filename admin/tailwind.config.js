/** @type {import('tailwindcss').Config} */
export default {
  important: '.firstloop',
  content: [
    "./src/landing/firstloop/**/*.{js,ts,jsx,tsx}",
  ],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#1B2A4A',
          navyDark: '#0F172A',
          navyLight: '#23324E',
          teal: '#008B9B',
          tealHover: '#007A89',
          cyan: '#0284C7',
          cyanLight: '#38BDF8',
          bgLight: '#F8FAFC',
          cardBorder: '#E2E8F0',
        }
      },
      boxShadow: {
        'teal-glow': '0 0 25px rgba(0, 139, 155, 0.35)',
        'cyan-glow': '0 0 25px rgba(2, 132, 199, 0.35)',
        'float': '0 12px 35px rgba(15, 23, 42, 0.08)',
        'card': '0 8px 30px rgba(15, 23, 42, 0.06)',
      }
    },
  },
  plugins: [],
}

