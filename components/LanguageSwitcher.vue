<template>
  <n-dropdown
    :options="languageOptions"
    trigger="click"
    @select="handleLanguageSelect"
  >
    <n-button
      :aria-label="t('accessibility.language_switcher')"
      text
      size="tiny"
      class="flex items-center"
    >
      <n-icon>
        <Language />
      </n-icon>
    </n-button>
  </n-dropdown>
</template>

<script setup lang="ts">
  import { Language } from '@vicons/fa'

  const { locales, setLocale, t } = useI18n()

  const languageOptions = computed(() => {
    return (locales.value as { code: string; name: string }[]).map((l) => ({
      label: l.name,
      key: l.code,
    }))
  })

  const handleLanguageSelect = (key: 'en' | 'zh' | 'de') => {
    setLocale(key)
    // Persist language preference in cookie
    const localeCookie = useCookie('locale', {
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    })
    localeCookie.value = key
  }
</script>
