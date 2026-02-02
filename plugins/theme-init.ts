import type { Theme } from '~/stores/user'

export default defineNuxtPlugin({
  name: 'theme-init',
  enforce: 'pre',
  setup() {
    const userStore = useUserStore()
    const themeCookie = useCookie<Theme | null>('theme')
    let theme = themeCookie.value

    if (import.meta.client) {
      if (theme === 'dark' || theme === 'light') {
        if (userStore.theme !== theme) {
          userStore.$patch({ theme })
        }
      } else {
        const prefersDark =
          window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
        theme = prefersDark ? 'dark' : 'light'
        userStore.setTheme(theme)
      }

      const isDark = theme === 'dark'
      const root = document.documentElement
      root.classList.remove('dark', 'light')
      root.classList.add(isDark ? 'dark' : 'light')
      root.style.colorScheme = isDark ? 'dark' : 'light'
      return
    }

    if ((theme === 'dark' || theme === 'light') && userStore.theme !== theme) {
      userStore.$patch({ theme })
    }
  },
})
