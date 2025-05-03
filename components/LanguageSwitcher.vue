<template>
  <n-dropdown
    :options="languageOptions"
    trigger="click"
    @select="handleLanguageSelect"
  >
    <n-button
      text
      class="flex items-center"
      aria-label="Language switcher"
    >
      <n-icon size="20">
        <Language />
      </n-icon>
    </n-button>
  </n-dropdown>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { Language } from '@vicons/fa'

  const { locales, setLocale } = useI18n()

  const languageOptions = computed(() => {
    return (locales.value as { code: string; name: string }[]).map((l) => ({
      label: l.name,
      key: l.code,
    }))
  })

  const handleLanguageSelect = (key: 'en' | 'zh') => {
    setLocale(key)
    // Persist language preference in cookie
    const localeCookie = useCookie('locale', {
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    })
    localeCookie.value = key
  }
</script>
