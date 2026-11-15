/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ocean: '#00B4D8',
        tropical: '#2E8B57',
        sand: '#F4D6A0',
        sunset: '#FF9F43',
        sky: '#87CEEB',
        navy: '#102A43',
      },
      fontFamily: {
        display: ['"Baloo 2"', 'system-ui', 'sans-serif'],
        body: ['Nunito', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        game: '0 6px 0 rgba(16,42,67,0.35), 0 12px 24px rgba(0,0,0,0.25)',
      },
    },
  },
  plugins: [],
};
