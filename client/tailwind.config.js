/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Matcha green for buttons and interactables
        matcha: {
          50: '#f0f7f2',
          100: '#ddeee2',
          200: '#bddcc6',
          300: '#8fc2a5',
          400: '#5fa07d',
          500: '#3d8262', // Main matcha
          600: '#2f6b52',
          700: '#285645',
          800: '#244638',
          900: '#1f3b30',
        },
        // Off-black and dark grays for text
        charcoal: {
          50: '#f6f6f6',
          100: '#e7e7e7',
          200: '#d1d1d1',
          300: '#b0b0b0',
          400: '#888888',
          500: '#6d6d6d',
          600: '#5d5d5d',
          700: '#4f4f4f',
          800: '#454545',
          900: '#3d3d3d', // Off-black
        },
        // Eggshell/off-white backgrounds
        eggshell: {
          50: '#fefdfb', // Purest eggshell
          100: '#fcfaf7',
          200: '#f9f5f0',
          300: '#f4ede2',
          400: '#ede0d0',
          500: '#e5d4bc',
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

