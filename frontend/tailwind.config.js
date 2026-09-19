/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0f1d',
        surface: '#111827',
        surfaceBorder: '#1f293d',
        accent: '#3b82f6',
        accentGlow: 'rgba(59, 130, 246, 0.15)',
        freeFlow: '#10b981',
        lightCongestion: '#3b82f6',
        moderateCongestion: '#f59e0b',
        heavyCongestion: '#ef4444',
        severeCongestion: '#7f1d1d'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace']
      }
    },
  },
  plugins: [],
}
