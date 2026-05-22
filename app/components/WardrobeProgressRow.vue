<template>
  <div class="space-y-1.5">
    <div class="flex items-center justify-between gap-3 text-sm">
      <span
        class="min-w-0 truncate font-medium text-gray-800 dark:text-gray-100"
      >
        {{ label }}
      </span>
      <span
        class="shrink-0 text-xs text-gray-500 tabular-nums dark:text-gray-400"
      >
        {{ owned }}/{{ total }}
      </span>
    </div>
    <div
      class="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800"
      :class="compact ? 'h-1.5' : 'h-2'"
    >
      <div
        class="h-full rounded-full bg-sky-500 transition-[width] duration-500 ease-out"
        :style="{ width: `${clampedPercent}%` }"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
  const props = defineProps<{
    label: string
    owned: number
    total: number
    percent: number
    compact?: boolean
  }>()

  const clampedPercent = computed(() =>
    Math.min(Math.max(props.percent, 0), 100)
  )
</script>
