/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          500: '#1B365D',
          600: '#1e40af',
          700: '#1d4ed8'
        }
      }
    },
  },
  plugins: [],
}