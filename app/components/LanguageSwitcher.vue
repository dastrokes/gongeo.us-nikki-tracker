<template>
  <n-dropdown
    :options="languageOptions"
    trigger="click"
    @select="handleLanguageSelect"
  >
    <n-button
      :aria-label="$t('default.accessibility.language_switcher')"
      text
      size="tiny"
      class="flex items-center"
    >
      <n-icon :size="16">
        <SvgIcon name="language" />
      </n-icon>
    </n-button>
  </n-dropdown>
</template>

<script setup lang="ts">
  import type { SupportedLocaleCode } from '~/locales/locales'

  const { locales, setLocale, t } = useI18n()

  const languageOptions = computed(() => {
    const localeOptions = (
      locales.value as { code: string; name: string }[]
    ).map((l) => ({
      label: l.name,
      key: l.code,
    }))

    return [
      ...localeOptions,
      {
        type: 'divider',
        key: 'divider',
      },
      {
        label: t('default.language_switcher.help_translate'),
        key: 'crowdin',
        props: {
          onClick: () => {
            window.open('https://crowdin.com/project/gongeous', '_blank')
          },
        },
      },
    ]
  })

  const handleLanguageSelect = async (key: string) => {
    if (key === 'crowdin') return
    await setLocale(key as SupportedLocaleCode)
  }
</script>
