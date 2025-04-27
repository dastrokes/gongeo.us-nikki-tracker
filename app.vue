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
  import { darkTheme, type GlobalThemeOverrides } from 'naive-ui'
  import { useUserStore } from '~/stores/user'
  import { computed, onMounted } from 'vue'

  // Initialize theme state
  const userStore = useUserStore()
  const theme = computed(() =>
    userStore.getCurrentTheme === 'dark' ? darkTheme : null
  )

  // Theme overrides for both light and dark modes
  const themeOverrides: GlobalThemeOverrides = {
    common: {
      primaryColor: '#F43F5E', // Rose-500
      primaryColorHover: '#FB7185', // Rose-400
      primaryColorPressed: '#E11D48', // Rose-600
      primaryColorSuppl: '#FB7185', // Rose-400

      infoColor: '#8B5CF6', // Violet-500 (complementary)
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
      textColor: '#4F4F4F',
      borderRadius: '12px',
      fontWeight: '600',
    },
    Card: {
      borderRadius: '16px',
      color: 'rgba(255, 255, 255, 0.9)',
      colorModal: 'rgba(255, 255, 255, 0.9)',
      colorPopover: 'rgba(255, 255, 255, 0.9)',
      colorEmbedded: 'rgba(255, 255, 255, 0.9)',
      colorTarget: 'rgba(244, 63, 94, 0.1)', // Updated to match new rose color
    },
    Input: {
      borderRadius: '12px',
      borderFocus: '#F43F5E', // Updated to rose
      boxShadowFocus: '0 0 0 2px rgba(244, 63, 94, 0.2)', // Updated to rose
    },
    Select: {
      peers: {
        InternalSelection: {
          borderRadius: '12px',
        },
      },
    },
  }

  // Ensure theme is initialized on client-side
  onMounted(() => {
    userStore.initializeTheme()
  })
</script>
