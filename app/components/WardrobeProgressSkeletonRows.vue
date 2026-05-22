<template>
  <div class="space-y-3">
    <div
      v-for="row in rows"
      :key="row"
      class="space-y-2"
    >
      <div class="flex items-center justify-between">
        <n-skeleton
          text
          width="96px"
        />
        <n-skeleton
          text
          width="40px"
        />
      </div>
      <n-skeleton
        height="8px"
        round
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  withDefaults(
    defineProps<{
      rows?: number
    }>(),
    {
      rows: 5,
    }
  )
</script>
