/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        heritage: {
          50:  '#fdf8f0',
          100: '#faefd9',
          200: '#f3d9a8',
          300: '#e9bc6e',
          400: '#de9c3e',
          500: '#c97f20',
          600: '#a8611a',
          700: '#86481a',
          800: '#6c391b',
          900: '#572f19',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Merriweather', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}

