<template>
  <n-config-provider
    :theme="naiveTheme"
    :theme-overrides="themeOverrides"
    inline-theme-disabled
  >
    <n-message-provider>
      <n-dialog-provider>
        <NuxtLayout>
          <NuxtPage />
        </NuxtLayout>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
  import type { GlobalThemeOverrides } from 'naive-ui'
  import type { I18nHeadMetaInfo } from '@nuxtjs/i18n'

  const { t } = useI18n()
  const localeHead = useLocaleHead({ dir: true, lang: true, seo: true })
  const runtimeConfig = useRuntimeConfig()
  const gameVersion = getGameVersion()
  const { locale } = useI18n()
  const ogImageUrl = computed(() => {
    const siteUrl = String(runtimeConfig.public.siteUrl || '').replace(
      /\/$/,
      ''
    )
    const filename = locale.value === 'zh' ? 'og-zh.jpg' : 'og.jpg'
    return `${siteUrl}/${filename}?v=${encodeURIComponent(gameVersion)}`
  })

  // Initialize theme state
  const { theme, isDark, naiveTheme, initTheme, syncTheme } = useTheme()

  const localeHeadLinks = computed<I18nHeadMetaInfo['link']>(
    () => localeHead.value.link as I18nHeadMetaInfo['link']
  )

  const localeHtmlAttrs = computed<I18nHeadMetaInfo['htmlAttrs']>(
    () => localeHead.value.htmlAttrs as I18nHeadMetaInfo['htmlAttrs']
  )

  const htmlClass = computed(() => {
    const themeClass = isDark.value ? 'dark' : 'light'
    const localeClass = localeHtmlAttrs.value?.class
    return [localeClass, themeClass].filter(Boolean).join(' ')
  })

  useHead(() => ({
    htmlAttrs: {
      ...localeHtmlAttrs.value,
      class: htmlClass.value,
      style: `color-scheme: ${isDark.value ? 'dark' : 'light'}`,
    },
    title: t('meta.title'),
    meta: [
      ...localeHead.value.meta,
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      {
        name: 'theme-color',
        content: isDark.value ? '#101014' : '#F8FAFC',
      },
      {
        name: 'description',
        content: t('meta.description.default'),
      },
      {
        name: 'apple-mobile-web-app-title',
        content: 'gongeo.us',
      },
      { name: 'robots', content: 'index, follow' },
      { name: 'author', content: 'dastrokes' },
      {
        property: 'og:site_name',
        content: t('meta.title'),
      },
      {
        property: 'og:type',
        content: 'website',
      },
      {
        property: 'og:title',
        content: t('meta.title'),
      },
      {
        property: 'og:description',
        content: t('meta.description.default'),
      },
      {
        property: 'og:image',
        content: ogImageUrl.value,
      },
      {
        property: 'og:image:alt',
        content: t('meta.title'),
      },
      {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
      {
        name: 'twitter:title',
        content: t('meta.title'),
      },
      {
        name: 'twitter:description',
        content: t('meta.description.default'),
      },
      {
        name: 'twitter:image',
        content: ogImageUrl.value,
      },
      {
        name: 'twitter:site',
        content: '@gongeo_us',
      },
      {
        name: 'twitter:creator',
        content: '@gongeo_us',
      },
    ],
    link: [
      ...localeHeadLinks.value,
      {
        rel: 'manifest',
        href: '/site.webmanifest',
      },
      {
        rel: 'apple-touch-icon',
        href: '/apple-touch-icon.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        href: '/favicon-32x32.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
        href: '/favicon-16x16.png',
      },
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      {
        rel: 'preconnect',
        href: 'https://api.gongeo.us',
      },
      {
        rel: 'preconnect',
        href: 'https://o4509482068869120.ingest.us.sentry.io',
      },
    ],
  }))

  const palette = usePalette()

  // Theme overrides for both light and dark modes
  const themeOverrides = computed<GlobalThemeOverrides>(() => ({
    common: {
      borderRadius: '16px',

      primaryColor: '#F43F5E', // Rose-500
      primaryColorHover: '#FB7185', // Rose-400
      primaryColorPressed: '#E11D48', // Rose-600
      primaryColorSuppl: '#FB7185', // Rose-400

      infoColor: '#6366F1', // Indigo-500
      infoColorHover: '#818CF8', // Indigo-400
      infoColorPressed: '#4F46E5', // Indigo-600
      infoColorSuppl: '#818CF8', // Indigo-400

      successColor: '#10B981', // Emerald-500
      successColorHover: '#34D399', // Emerald-400
      successColorPressed: '#059669', // Emerald-600
      successColorSuppl: '#34D399', // Emerald-400

      warningColor: '#F59E0B', // Amber-500
      warningColorHover: '#FBBF24', // Amber-400
      warningColorPressed: '#D97706', // Amber-600
      warningColorSuppl: '#FBBF24', // Amber-400

      errorColor: '#EF4444', // Red-500
      errorColorHover: '#F87171', // Red-400
      errorColorPressed: '#DC2626', // Red-600
      errorColorSuppl: '#F87171', // Red-400
    },
    AutoComplete: {
      peers: {
        InternalSelectMenu: {
          height: '24rem',
        },
      },
    },
    Button: {
      textColorPrimary: palette.light,
      textColorHoverPrimary: palette.light,
      textColorPressedPrimary: palette.light,
      textColorFocusPrimary: palette.light,
      textColorDisabledPrimary: palette.light,
    },
    Card: {
      color: isDark.value ? '#1E2035' : '#F5F0FA',
      borderColor: isDark.value ? '#2F2D48' : '#E4DAF0',
    },
    Menu: {
      itemTextColorActive: isDark.value ? palette.light : palette.dark,
      itemTextColorActiveHover: isDark.value ? palette.light : palette.dark,
      itemColorActive: isDark.value ? palette.dark : palette.light,
      itemColorActiveHover: isDark.value ? palette.dark : palette.light,
    },
    Tooltip: {
      peers: {
        Popover: {
          color: isDark.value ? palette.dark : palette.light,
          textColor: isDark.value ? palette.textDark : palette.textLight,
        },
      },
    },
  }))

  // Initialize authentication
  const { initAuth } = useAuth()
  const { initProfile } = useProfileSlots()

  if (import.meta.client) {
    watch(
      theme,
      (currentTheme) => {
        syncTheme(currentTheme)
      },
      { immediate: true }
    )

    useEventListener(window, 'pageshow', (event: PageTransitionEvent) => {
      if (event.persisted) {
        syncTheme(theme.value)
      }
    })
  }

  // Ensure theme is initialized on client-side
  onMounted(() => {
    initTheme()
    initProfile()
    initAuth()
  })
</script>
