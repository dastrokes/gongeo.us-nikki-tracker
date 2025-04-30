<script setup lang="ts">
  import { Discord } from '@vicons/fa'
</script>

<template>
  <div class="max-w-7xl mx-auto space-y-4">
    <n-card
      class="rounded-xl"
      no-title
    >
      <div class="text-center mb-12">
        <h1 class="text-2xl font-bold mb-4">Under Maintenance</h1>
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
          href="https://discord.gg/K92RAEvCXx"
          target="_blank"
        >
          <template #icon>
            <n-icon><Discord /></n-icon>
          </template>
          Join Discord
        </n-button>
      </n-space>
    </n-card>
  </div>
</template>
