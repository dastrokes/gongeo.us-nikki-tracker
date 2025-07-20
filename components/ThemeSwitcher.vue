<template>
  <n-button
    class="transition-colors duration-200"
    :aria-label="t('accessibility.theme_switcher')"
    text
    size="tiny"
    @click="toggleTheme"
  >
    <template #icon>
      <n-icon :component="isDark ? SunIcon : MoonIcon" />
    </template>
  </n-button>
</template>

<script setup lang="ts">
  import { useUserStore } from '~/stores/user'
  import { Sun as SunIcon, Moon as MoonIcon } from '@vicons/fa'
  const { t } = useI18n()

  const userStore = useUserStore()
  const isDark = computed(() => userStore.getCurrentTheme === 'dark')

  const toggleTheme = () => {
    const newTheme = isDark.value ? 'light' : 'dark'
    userStore.setTheme(newTheme)
  }
</script>
