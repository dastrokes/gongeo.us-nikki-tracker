<template>
  <n-config-provider :theme="theme">
    <n-message-provider>
      <n-dialog-provider>
        <n-notification-provider>
          <div class="min-h-screen bg-gray-50">
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
  import { useUserStore } from '~/stores/user'

  // Initialize user store
  const userStore = useUserStore()

  // For now, we'll use the light theme by default
  const theme = ref(null)

  // Initialize user auth state
  onMounted(async () => {
    await userStore.auth()
  })
</script>
