import type { Config } from 'tailwindcss'

const config: Config = {
  theme: {
    fontFamily: {
      sans: ['var(--font-family-default)'],
      mono: ['var(--font-family-mono)'],
    },
  },
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.{vue,js,ts}',
    './pages/**/*.{vue,js,ts}',
    './app.vue',
  ],
} satisfies Config

export default config
