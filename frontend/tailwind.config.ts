import type { Config } from 'tailwindcss'

export default {
  content: ['./app/**/*.{js,jsx,ts,tsx}'],
  important: true, // Ensures Tailwind styles override other CSS (like Polaris)
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config

