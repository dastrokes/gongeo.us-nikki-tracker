<template>
  <n-button
    class="transition-colors duration-200"
    :aria-label="$t('default.accessibility.theme_switcher')"
    text
    size="tiny"
    @click="toggleTheme"
  >
    <template #icon>
      <n-icon
        :class="{ 'rotate-180': isDark }"
        class="transition-transform duration-500"
        :component="isDark ? SunIcon : MoonIcon"
      />
    </template>
  </n-button>
</template>

<script setup lang="ts">
  import { Sun as SunIcon, Moon as MoonIcon } from '@vicons/fa'

  const { isDark, setTheme } = useTheme()

  const toggleTheme = () => {
    const newTheme = isDark.value ? 'light' : 'dark'
    setTheme(newTheme)
  }
</script>
