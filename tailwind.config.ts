import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.{vue,js,ts}',
    './pages/**/*.{vue,js,ts}',
    './app.vue',
  ],
  theme: {
    extend: {
      keyframes: {
        'button-shimmer': {
          '0%': { left: '-100%' },
          '40%': { left: '150%' },
          '100%': { left: '150%' },
        },
        'fade-in-up': {
          from: {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          to: {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'reveal-success': {
          '0%': {
            opacity: '0',
            transform: 'translate(-50%, -50%) scale(0.94)',
            filter: 'saturate(0.8) contrast(0.95)',
          },
          '70%': {
            opacity: '1',
            transform: 'translate(-50%, -50%) scale(1.03)',
          },
          '100%': {
            opacity: '1',
            transform: 'translate(-50%, -50%) scale(1)',
            filter: 'none',
          },
        },
        'reveal-fail': {
          '0%': {
            opacity: '0',
            transform: 'translate(-50%, -50%) scale(0.98)',
            filter: 'grayscale(0.15) saturate(0.9)',
          },
          '35%': {
            opacity: '1',
            transform: 'translate(-50%, -50%) translateX(-6px)',
          },
          '55%': {
            transform: 'translate(-50%, -50%) translateX(6px)',
          },
          '75%': {
            transform: 'translate(-50%, -50%) translateX(-4px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translate(-50%, -50%) translateX(0)',
            filter: 'grayscale(0.1) saturate(0.95)',
          },
        },
        'reveal-skip': {
          '0%': {
            opacity: '0',
            transform: 'translate(-50%, -50%) scale(0.98)',
            filter: 'grayscale(0.25) contrast(0.95)',
          },
          '60%': {
            opacity: '1',
            transform: 'translate(-50%, -50%) scale(1.01)',
          },
          '100%': {
            opacity: '1',
            transform: 'translate(-50%, -50%) scale(1)',
            filter: 'grayscale(0.15) contrast(0.98)',
          },
        },
      },
      animation: {
        'button-shimmer': 'button-shimmer 4s infinite',
        'fade-in-up': 'fade-in-up 0.5s ease-out backwards',
        'reveal-success':
          'reveal-success 500ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
        'reveal-fail': 'reveal-fail 500ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
        'reveal-skip': 'reveal-skip 500ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
      },
    },
  },
} satisfies Config

export default config
