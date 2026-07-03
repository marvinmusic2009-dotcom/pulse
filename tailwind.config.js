/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary, #0284c7)',
          hover: 'var(--color-primary-hover, #0369a1)',
          light: 'var(--color-primary-light, #e0f2fe)',
        },
        secondary: {
          DEFAULT: 'var(--color-secondary, #0f172a)',
          hover: 'var(--color-secondary-hover, #1e293b)',
          light: 'var(--color-secondary-light, #f1f5f9)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
