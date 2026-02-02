<template>
  <n-config-provider
    :theme="naiveTheme"
    :theme-overrides="themeOverrides"
    :inline-theme-disabled="true"
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

  // Initialize theme state
  const { isDark, naiveTheme } = useTheme()

  useHead(() => ({
    htmlAttrs: {
      class: isDark.value ? 'dark' : 'light',
    },
  }))

  if (import.meta.client) {
    watch(
      isDark,
      (value) => {
        document.documentElement.classList.toggle('dark', value)
      },
      { immediate: true }
    )
  }

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

  onMounted(() => {
    // Defer auth initialization to idle to protect LCP
    const run = () => initAuth()

    if ('requestIdleCallback' in window) {
      requestIdleCallback(run, { timeout: 1000 })
    } else {
      setTimeout(run, 0)
    }
  })
</script>
