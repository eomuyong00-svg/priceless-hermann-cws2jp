import type { Config } from 'tailwindcss'
export default {
  darkMode: 'class',
  content: ['./app/**/*.{js,ts,jsx,tsx}','./components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: { colors: { 'neutral-925': '#0f1115' } },
  },
  plugins: [],
} satisfies Config
