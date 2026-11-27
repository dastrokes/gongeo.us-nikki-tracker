<template>
  <span
    v-if="isStarCrownQuality(quality)"
    class="flex items-center gap-1"
    :title="t('quality.8')"
  >
    <n-icon
      :class="iconClass"
      aria-hidden="true"
    >
      <Crown />
    </n-icon>
    <span class="sr-only">{{ t('quality.8') }}</span>
  </span>
  <span
    v-else
    class="flex items-center gap-1"
  >
    {{ quality }}
    <n-icon :class="iconClass">
      <Star />
    </n-icon>
  </span>
</template>

<script setup lang="ts">
  import { Crown, Star } from '@vicons/fa'

  defineProps<{
    quality: number
    iconClass?: string
  }>()

  const { t } = useI18n()
</script>
