/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        'eco-dark': '#1B4332',
        'eco-light': '#F0F4F0',
        'eco-accent': '#2D6A4F',
      }
    },
  },
  plugins: [],
}
