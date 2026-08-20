/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6366f1',
        'primary-light': '#818cf8',
        'primary-dark': '#4f46e5',
        bg: '#0a0a0f',
        bg2: '#12121a',
        bg3: '#1a1a24',
        bg4: '#22222e',
        border: '#2a2a3a',
        text: '#e8e8f0',
        'text-2': '#9898b0',
        'text-3': '#5a5a78',
        green: '#22c983',
        amber: '#f5a623',
        red: '#e85555',
        blue: '#4a9ef5',
      },
    },
  },
  plugins: [],
}