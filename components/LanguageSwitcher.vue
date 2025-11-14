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
      <n-icon :size="16">
        <Language />
      </n-icon>
    </n-button>
  </n-dropdown>
</template>

<script setup lang="ts">
  import Language from '~/components/icons/Language.vue'
  import type { SupportedLocaleCode } from '~/locales/locales'

  const { locales, setLocale, t } = useI18n()

  const languageOptions = computed(() => {
    return (locales.value as { code: string; name: string }[]).map((l) => ({
      label: l.name,
      key: l.code,
    }))
  })

  const handleLanguageSelect = (key: SupportedLocaleCode) => {
    setLocale(key)
    set('locale', key)
  }
</script>
