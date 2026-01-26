export default defineNuxtPlugin({
  name: 'console-filter',
  setup() {
    if (import.meta.env.DEV) {
      const originalInfo = console.info
      const originalWarn = console.warn

      console.info = (...args) => {
        if (
          typeof args[0] === 'string' &&
          args[0].includes('<Suspense> is an experimental feature')
        ) {
          return
        }
        originalInfo(...args)
      }

      console.warn = (...args) => {
        if (
          typeof args[0] === 'string' &&
          args[0].includes('Non-function value encountered for default slot')
        ) {
          return
        }
        originalWarn(...args)
      }
    }
  },
})
