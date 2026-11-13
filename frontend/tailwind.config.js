/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        railway: {
          dark: '#0a0f1d',
          navy: '#0f172a',
          surface: '#1e293b',
          card: '#182234',
          border: '#334155',
          primary: '#1d4ed8',
          accent: '#2563eb',
          danger: '#dc2626',
          warning: '#f59e0b',
          success: '#10b981',
          gold: '#eab308'
        }
      }
    },
  },
  plugins: [],
}
