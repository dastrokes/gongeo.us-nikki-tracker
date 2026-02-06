<template>
  <n-config-provider
    :theme="naiveTheme"
    :theme-overrides="themeOverrides"
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
  const route = useRoute()
  const localeHead = useLocaleHead({ dir: true, lang: true, seo: true })
  const siteUrl = useRuntimeConfig().public.siteUrl

  // Initialize theme state
  const { isDark, naiveTheme, initTheme } = useTheme()

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
    },
    title: t('meta.title'),
    meta: [
      ...localeHead.value.meta,
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      {
        name: 'description',
        content: t('meta.description.default'),
      },
      { name: 'robots', content: 'index, follow' },
      { name: 'author', content: 'dastrokes' },
      {
        name: 'keywords',
        content: t('meta.keywords'),
      },
      {
        property: 'og:site_name',
        content: t('meta.title'),
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
        content: `${siteUrl}/og.png`,
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
        content: `${siteUrl}/og.png`,
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
    script:
      route.meta?.umami === false
        ? []
        : [
            {
              async: true,
              defer: true,
              src: '/gongeous.js',
              'data-host-url': 'https://api.gongeo.us',
              'data-website-id': 'dd22ab5d-2045-4450-aaff-f513339b5ca6',
            },
          ],
  }))

  // Theme overrides for both light and dark modes
  const themeOverrides = computed<GlobalThemeOverrides>(() => ({
    common: {
      borderRadius: '12px',

      primaryColor: '#F43F5E', // Rose-400
      primaryColorHover: '#FB7185', // Rose-300
      primaryColorPressed: '#E11D48', // Rose-500
      primaryColorSuppl: '#FB7185', // Rose-300

      infoColor: '#8B5CF6', // Violet-500
      infoColorHover: '#A78BFA', // Violet-400
      infoColorPressed: '#7C3AED', // Violet-600
      infoColorSuppl: '#A78BFA', // Violet-400

      successColor: '#FDA4AF', // Rose-300
      successColorHover: '#FECDD3', // Rose-200
      successColorPressed: '#FB7185', // Rose-400
      successColorSuppl: '#FECDD3', // Rose-200

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
      textColorPrimary: '#f6f6f6',
      textColorHoverPrimary: '#d6d6d6',
      textColorPressedPrimary: '#d6d6d6',
      textColorFocusPrimary: '#969696',
      textColorDisabledPrimary: '#f6f6f6',
    },
    Card: {
      color: isDark.value ? 'rgb(31, 41, 55)' : 'rgb(250, 245, 255)',
    },
    Menu: {
      itemTextColorActive: 'currentColor',
      itemTextColorActiveHover: 'currentColor',
      itemColorActive: isDark.value
        ? 'rgba(75, 85, 99, 0.9)'
        : 'rgba(255, 255, 255, 0.9)',
      itemColorActiveHover: isDark.value
        ? 'rgba(75, 85, 99, 0.9)'
        : 'rgba(255, 255, 255, 0.9)',
    },
    Tooltip: {
      peers: {
        Popover: {
          color: isDark.value
            ? 'rgba(75, 85, 99, 0.9)'
            : 'rgba(255, 255, 255, 0.9)',
          textColor: isDark.value ? '#e4e5e7' : '#5c5c5e',
        },
      },
    },
    Carousel: {
      dotColor: isDark.value ? '#4b5563' : '#d1d5db',
      dotColorActive: isDark.value ? '#f9fafb' : '#6b7280',
      dotColorHover: isDark.value ? '#e5e7eb' : '#94a3b8',
    },
  }))

  // Initialize authentication
  const { initAuth } = useAuth()
  const { initProfile } = useProfileSlots()

  // Ensure theme is initialized on client-side
  onMounted(() => {
    initTheme()
    initProfile()
    initAuth()
  })
</script>
