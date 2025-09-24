<template>
  <n-config-provider
    :theme="theme"
    :theme-overrides="themeOverrides"
  >
    <n-message-provider placement="bottom">
      <n-dialog-provider>
        <n-notification-provider>
          <NuxtLayout :hydrate="true">
            <NuxtPage />
          </NuxtLayout>
        </n-notification-provider>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
  import { darkTheme, lightTheme, type GlobalThemeOverrides } from 'naive-ui'

  // Initialize theme state
  const userStore = useUserStore()
  const isDark = computed(() => userStore.getCurrentTheme === 'dark')
  const theme = computed(() => (isDark.value ? darkTheme : lightTheme))

  // Theme overrides for both light and dark modes
  const themeOverrides = computed<GlobalThemeOverrides>(() => ({
    common: {
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

      borderRadius: '12px',
    },
    Button: {
      textColorPrimary: '#f6f6f6',
      textColorHoverPrimary: '#d6d6d6',
      textColorPressedPrimary: '#d6d6d6',
      textColorFocusPrimary: '#969696',
      fontWeight: '500',
    },
    Card: {
      borderRadius: '16px',
      color: isDark.value
        ? 'rgba(31, 41, 55, 0.9)'
        : 'rgba(255, 255, 255, 0.9)',
      colorModal: isDark.value
        ? 'rgba(31, 41, 55, 0.9)'
        : 'rgba(255, 255, 255, 0.9)',
      colorPopover: isDark.value
        ? 'rgba(31, 41, 55, 0.9)'
        : 'rgba(255, 255, 255, 0.9)',
      colorEmbedded: isDark.value
        ? 'rgba(31, 41, 55, 0.9)'
        : 'rgba(255, 255, 255, 0.9)',
      colorTarget: isDark.value
        ? 'rgba(244, 63, 94, 0.2)'
        : 'rgba(244, 63, 94, 0.1)',
    },
    Input: {
      borderRadius: '12px',
      boxShadowFocus: 'none',
      color: isDark.value ? 'rgb(75, 85, 99, 0.9)' : 'rgba(255, 255, 255, 0.9)',
      textColor: isDark.value ? '#E5E7EB' : '#4F4F4F',
    },
    Menu: {
      itemTextColorActive: 'currentColor',
      itemTextColorActiveHover: 'currentColor',
      itemColorActive: isDark.value
        ? 'rgba(255, 255, 255, 0.09)'
        : 'rgb(243, 243, 245)',
      itemColorActiveHover: isDark.value
        ? 'rgba(255, 255, 255, 0.09)'
        : 'rgb(243, 243, 245)',
    },
    Select: {
      peers: {
        InternalSelectMenu: {
          color: isDark.value ? '#3a424d' : '#faf5ff',
        },
      },
    },
    Tooltip: {
      common: {
        borderRadius: '12px',
      },
      peers: {
        Popover: {
          color: isDark.value
            ? 'rgb(75, 85, 99, 0.9)'
            : 'rgba(255, 255, 255, 0.9)',
          textColor: isDark.value ? '#e4e5e7' : '#5c5c5e',
          boxShadow: isDark.value
            ? '0 2px 8px rgba(200, 200, 200, 0.12)'
            : '0 2px 8px rgba(0, 0, 0, 0.12)',
        },
      },
    },
    Carousel: {
      dotColor: isDark.value ? '#4b5563' : '#d1d5db', // dark: gray-600 | light: gray-300
      dotColorActive: isDark.value ? '#f9fafb' : '#6b7280', // dark: gray-50  | light: gray-500
      dotColorHover: isDark.value ? '#e5e7eb' : '#94a3b8', // dark: gray-200 | light: gray-400
    },
  }))

  // Initialize authentication
  const { initAuth } = useAuth()

  // Ensure theme is initialized on client-side
  onMounted(() => {
    // Initialize theme immediately for correct initial paint
    userStore.initializeTheme()

    // Defer auth initialization to idle to protect LCP
    const run = () => initAuth()

    if ('requestIdleCallback' in window) {
      requestIdleCallback(run, { timeout: 1000 })
    } else {
      setTimeout(run, 0)
    }
  })
</script>
