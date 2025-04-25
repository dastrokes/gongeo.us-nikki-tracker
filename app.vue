<template>
  <n-config-provider
    :theme="lightTheme"
    :theme-overrides="themeOverrides"
  >
    <n-message-provider>
      <n-dialog-provider>
        <n-notification-provider>
          <div class="min-h-screen">
            <NuxtLayout>
              <NuxtPage />
            </NuxtLayout>
          </div>
        </n-notification-provider>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
  import { lightTheme } from 'naive-ui'
  // import { darkTheme } from 'naive-ui'
  import { NConfigProvider, type GlobalThemeOverrides } from 'naive-ui'

  const themeOverrides: GlobalThemeOverrides = {
    common: {
    },
    Button: {
    },
  }

  const theme = ref(lightTheme)
</script>
