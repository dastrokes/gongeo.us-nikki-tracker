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
      class="flex h-7 w-7 items-center justify-center rounded-full bg-black/3 text-slate-600 transition-colors duration-200 hover:bg-black/5 hover:text-slate-800 focus-visible:ring-2 focus-visible:ring-rose-500/80 focus-visible:outline-hidden motion-reduce:transition-none dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/8 dark:hover:text-slate-100"
    >
      <n-icon :size="18">
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
