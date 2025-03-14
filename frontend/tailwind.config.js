/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1B365D',      // Dark navy blue
        secondary: '#00A4B4',    // Teal
        accent: '#13B5EA',       // Light blue
        text: '#647789',         // Dark gray for text
      },
    },
  },
  plugins: [],
};
