<template>
  <n-button
    class="transition-colors duration-200"
    aria-label="Toggle theme"
    text
    size="tiny"
    @click="toggleTheme"
  >
    <template #icon>
      <n-icon>
        <SunIcon v-if="isDark" />
        <MoonIcon v-else />
      </n-icon>
    </template>
  </n-button>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { useUserStore } from '~/stores/user'
  import { Sun as SunIcon, Moon as MoonIcon } from '@vicons/fa'

  const userStore = useUserStore()
  const isDark = computed(() => userStore.getCurrentTheme === 'dark')

  const toggleTheme = () => {
    const newTheme = isDark.value ? 'light' : 'dark'
    userStore.setTheme(newTheme)
  }
</script>
