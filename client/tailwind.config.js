/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        success: {
          50: '#ecfdf5',
          500: '#10b981',
        },
        warning: {
          50: '#fffbeb',
          500: '#f59e0b',
        },
        error: {
          50: '#fef2f2',
          500: '#ef4444',
        },
      },
    },
  },
  plugins: [],
};
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
        secondary: {
          50: '#f0fdfa',
          500: '#14b8a6',
          600: '#0d9488',
        },
        accent: {
          500: '#f97316',
        },
        success: {
          500: '#10b981',
        },
        warning: {
          500: '#f59e0b',
        },
        error: {
          500: '#ef4444',
        },
      },
    },
  },
  plugins: [],
};