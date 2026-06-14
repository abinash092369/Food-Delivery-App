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
          DEFAULT: '#0d9488', // Brand Teal
          hover: '#0f766e',
          light: '#f0fdfa',
        },
        sidebar: {
          bg: '#1E293B',
          hover: '#334155',
          text: '#94A3B8',
          textActive: '#F8FAFC',
        },
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
