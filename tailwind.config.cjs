/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.js'],
  theme: {
    extend: {
      colors: {
        dialysis: {
          50: '#f0f9ff',
          500: '#0284c7',
          600: '#0369a1',
          700: '#0369a1',
          900: '#0c4a6e',
          950: '#082f49'
        }
      }
    }
  },
  plugins: []
};
