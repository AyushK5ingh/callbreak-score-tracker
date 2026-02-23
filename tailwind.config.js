/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        outfit: ['Outfit', 'sans-serif'],
      },
      colors: {
        dark: {
          900: '#0c0c0c',
          800: '#161616',
          700: '#262626',
        },
        primary: {
          500: '#059669', // Emerald 600
          600: '#047857',
        }
      },
    },
  },
  plugins: [],
}
