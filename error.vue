<template>
  <div class="min-h-screen flex items-center justify-center">
    <n-result
      class="w-full max-w-xs"
      size="small"
      status="404"
      title="Page not found"
      description="The page you are looking for does not exist."
    >
      <template #icon>
        <NuxtImg
          src="/images/404.webp"
          alt="404"
          class="w-2/3 h-2/3 object-cover"
          width="400"
          height="400"
          fit="cover"
          sizes="200px"
        />
      </template>
      <template #footer>
        <n-button
          round
          @click="handleError"
        >
          <template #icon>
            <n-icon>
              <Home />
            </n-icon>
          </template>
          Return home
        </n-button>
      </template>
    </n-result>
  </div>
</template>

<script setup lang="ts">
  import { Home } from '@vicons/fa'

  const handleError = () => {
    navigateTo('/')
  }
</script>
