import { darkTheme, lightTheme } from 'naive-ui'
import type { GlobalTheme } from 'naive-ui'

export const useTheme = () => {
  const userStore = useUserStore()

  const syncTheme = (theme: Theme) => {
    if (!import.meta.client) return

    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    root.classList.toggle('light', theme === 'light')
    root.style.colorScheme = theme
  }

  const toggleTheme = () => {
    const newTheme: Theme =
      userStore.getCurrentTheme === 'light' ? 'dark' : 'light'
    userStore.setTheme(newTheme)
  }

  const initTheme = () => {
    userStore.initializeTheme()
  }

  const naiveTheme = computed<GlobalTheme | null>(() =>
    userStore.getCurrentTheme === 'dark' ? darkTheme : lightTheme
  )

  return {
    theme: computed(() => userStore.getCurrentTheme),
    isDark: computed(() => userStore.getCurrentTheme === 'dark'),
    naiveTheme,
    toggleTheme,
    setTheme: userStore.setTheme,
    initTheme,
    syncTheme,
  }
}
