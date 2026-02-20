/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          900: '#1B4332',
          800: '#2D6A4F',
          700: '#40916C',
          600: '#52B788',
          500: '#74C69D',
          400: '#95D5B2',
          300: '#B7E4C7',
          200: '#D8F3DC',
        },
        cream: {
          50:  '#FEFDF8',
          100: '#FEFAE0',
          200: '#F5F0E1',
          300: '#EDE5CC',
          400: '#DDA15E',
        },
        gold: {
          400: '#DDA15E',
          500: '#BC6C25',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Playfair Display', 'Georgia', 'serif'],
        arabic: ['Amiri', 'serif'],
      },
    },
  },
  plugins: [],
}
