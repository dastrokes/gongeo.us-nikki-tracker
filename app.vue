<template>
  <n-config-provider :theme="theme">
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
  import { darkTheme } from 'naive-ui'
  import { useUserStore } from '~/stores/user'
  import { computed, onMounted } from 'vue'

  // Initialize theme state
  const userStore = useUserStore()
  const theme = computed(() =>
    userStore.getCurrentTheme === 'dark' ? darkTheme : null
  )

  // Ensure theme is initialized on client-side
  onMounted(() => {
    userStore.initializeTheme()
  })
</script>
