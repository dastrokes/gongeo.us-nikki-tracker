<template>
  <n-config-provider
    :theme="theme"
    :theme-overrides="themeOverrides"
  >
    <n-message-provider>
      <n-dialog-provider>
        <n-notification-provider>
          <NuxtLayout
            :key="$route.fullPath"
            :hydrate="true"
          >
            <NuxtPage />
          </NuxtLayout>
        </n-notification-provider>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
  import { darkTheme, lightTheme, type GlobalThemeOverrides } from 'naive-ui'
  import { useUserStore } from '~/stores/user'
  import { computed, onMounted } from 'vue'

  // Initialize theme state
  const userStore = useUserStore()
  const isDark = computed(() => userStore.getCurrentTheme === 'dark')
  const theme = computed(() => (isDark.value ? darkTheme : lightTheme))

  // Theme overrides for both light and dark modes
  const themeOverrides = computed<GlobalThemeOverrides>(() => ({
    common: {
      primaryColor: '#F43F5E', // Rose-500
      primaryColorHover: '#FB7185', // Rose-400
      primaryColorPressed: '#E11D48', // Rose-600
      primaryColorSuppl: '#FB7185', // Rose-400

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
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    },
    Button: {
      textColor: isDark.value ? '#E5E7EB' : '#4F4F4F', // Gray-200 : Gray-700
      borderRadius: '12px',
      fontWeight: '600',
    },
    Card: {
      borderRadius: '16px',
      color: isDark.value
        ? 'rgba(31, 41, 55, 0.9)'
        : 'rgba(255, 255, 255, 0.9)', // Gray-800 : White
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
      borderFocus: '#F43F5E',
      boxShadowFocus: '0 0 0 2px rgba(244, 63, 94, 0.2)',
      color: isDark.value
        ? 'rgba(31, 41, 55, 0.9)'
        : 'rgba(255, 255, 255, 0.9)',
      textColor: isDark.value ? '#E5E7EB' : '#4F4F4F',
    },
    Select: {
      peers: {
        InternalSelection: {
          borderRadius: '12px',
        },
      },
    },
  }))

  // Ensure theme is initialized on client-side
  onMounted(() => {
    userStore.initializeTheme()
  })
</script>

<style>
  :root {
    --bg-primary: #ffffff;
    --text-primary: #1f2937;
    --text-secondary: #4b5563;
  }

  .dark {
    --bg-primary: #111827;
    --text-primary: #f9fafb;
    --text-secondary: #e5e7eb;
  }

  body {
    @apply bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200;
  }
</style>
