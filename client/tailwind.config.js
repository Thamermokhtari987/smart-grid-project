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
        primary: {
          navy: '#101B2D',
          dark: '#172A45',
          light: '#1E3A5F'
        },
        electric: '#2563EB',
        cyanAccent: '#06B6D4',
        energy: {
          solar: '#F59E0B',
          solarLight: '#FEF3C7',
          battery: '#8B5CF6',
          batteryLight: '#EDE9FE',
          consumption: '#EF4444',
          consumptionLight: '#FEE2E2',
          success: '#10B981',
          successLight: '#D1FAE5',
          warning: '#F97316',
          warningLight: '#FFEDD5',
          grid: '#3B82F6',
        },
        bgLight: '#F5F7FB',
      },
      boxShadow: {
        'glow-solar': '0 0 15px rgba(245, 158, 11, 0.4)',
        'glow-battery': '0 0 15px rgba(139, 92, 246, 0.4)',
        'glow-blue': '0 0 15px rgba(37, 99, 235, 0.4)',
        'glow-green': '0 0 15px rgba(16, 185, 129, 0.4)',
      }
    },
  },
  plugins: [],
}
