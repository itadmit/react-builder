import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          md: '2rem',
        },
      },
      colors: {
        brand: {
          DEFAULT: '#111827',
          primary: '#2563eb',
          accent: '#f59e0b',
        },
      },
    },
  },
  plugins: [],
} satisfies Config

