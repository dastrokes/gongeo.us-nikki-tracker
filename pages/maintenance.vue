<template>
  <div class="max-w-7xl mx-auto space-y-4">
    <n-card
      size="small"
      class="rounded-xl p-0 sm:p-2"
      :style="cardStyle"
    >
      <div class="text-center mb-12">
        <n-h1 class="font-bold mb-4">Under Maintenance</n-h1>
        <p class="text-gray-600">
          We're currently performing some maintenance on our site to improve
          your experience.
        </p>
        <p class="text-gray-600">
          We'll be back online shortly. Thank you for your patience!
        </p>
      </div>

      <n-space
        justify="center"
        class="mt-12"
      >
        <n-button
          tag="a"
          href="https://discord.gg/qymsW3j4Zw"
          target="_blank"
        >
          <template #icon>
            <n-icon><Discord /></n-icon>
          </template>
          Discord
        </n-button>
      </n-space>
    </n-card>
  </div>
</template>

<script setup lang="ts">
  import { Discord } from '@vicons/fa'
  import { useCardStyle } from '~/composables/useCardStyle'

  const { cardStyle } = useCardStyle()
</script>
