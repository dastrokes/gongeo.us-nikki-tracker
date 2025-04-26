import { useUserStore } from '~/stores/user'
import type { Theme } from '~/stores/user'
import { darkTheme, lightTheme } from 'naive-ui'
import type { GlobalTheme } from 'naive-ui'

export const useTheme = () => {
  const userStore = useUserStore()

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
  }
}
