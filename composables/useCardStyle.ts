export const useCardStyle = () => {
  const userStore = useUserStore()
  const isDark = computed(() => userStore.getCurrentTheme === 'dark')

  const cardStyle = computed(() => ({
    background: isDark.value ? 'rgb(31, 41, 55)' : 'rgb(250, 245, 255)',
  }))

  return {
    cardStyle,
  }
}
