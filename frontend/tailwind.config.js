/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        rental: {
          light: '#8fdd56',
          DEFAULT: '#71cc09',
          dark: '#5a9e07',
          darker: '#3d6b05',
        }
      }
    },
  },
  plugins: [],
}