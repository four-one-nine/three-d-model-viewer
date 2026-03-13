/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#EAB308',
        secondary: '#18181B',
        accent: '#3B82F6',
        surface: '#27272A',
        'text-primary': '#FAFAFA',
        'text-secondary': '#A1A1AA',
        border: '#3F3F46',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}