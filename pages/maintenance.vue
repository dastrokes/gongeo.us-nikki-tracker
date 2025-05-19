<template>
  <div class="max-w-7xl mx-auto space-y-4">
    <n-card
      size="small"
      class="rounded-xl p-0 sm:p-2"
      :style="cardStyle"
    >
      <div class="text-center mb-12">
        <n-h1 class="font-bold mb-4">{{ $t('maintenance.title') }}</n-h1>
        <p class="text-lg">
          {{ $t('maintenance.message') }}
        </p>
        <p class="text-lg">
          {{ $t('maintenance.status') }}
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
