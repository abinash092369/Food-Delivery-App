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
          DEFAULT: '#0d9488',
          hover: '#0f766e',
          light: '#f0fdfa',
        },
        accent: {
          DEFAULT: '#06b6d4',
          hover: '#0891b2',
          light: '#ecfeff',
        },
        navy: {
          DEFAULT: '#0f172a',
          hover: '#1e293b',
          light: '#f1f5f9',
        },
        background: '#f8fafc',
        surface: '#FFFFFF',
        textMain: '#0f172a',
        mutedColor: '#64748b',
        success: '#10b981',
        error: '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Poppins', 'sans-serif'],
      },
      borderRadius: {
        'xl': '0.75rem',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}
