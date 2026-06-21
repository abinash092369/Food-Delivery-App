/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0d9488', // EETS brand teal
          hover: '#0f766e',
          light: '#f0fdfa',
        },
        accent: {
          DEFAULT: '#06b6d4',
          hover: '#0891b2',
        },
        online: '#22C55E',
        offline: '#6B7280',
        background: '#F9FAFB',
        surface: '#FFFFFF',
        textMain: '#111827',
        mutedColor: '#6B7280',
        success: '#10B981',
        error: '#EF4444',
        warning: '#F59E0B',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
