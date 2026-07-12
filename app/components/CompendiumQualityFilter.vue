<template>
  <div class="w-full min-w-0 self-start sm:w-auto">
    <n-button-group class="flex w-full sm:w-auto sm:min-w-max">
      <n-button
        size="small"
        :type="value === null ? 'primary' : 'default'"
        class="min-w-0 flex-1 px-1! sm:min-w-10 sm:flex-none sm:px-3!"
        @click="value = null"
      >
        {{ t('common.all') }}
      </n-button>
      <n-button
        v-for="quality in qualityOptions"
        :key="quality"
        size="small"
        v-bind="getQualityButtonTheme(quality, value === quality)"
        class="min-w-0 flex-1 px-1! sm:min-w-10 sm:flex-none sm:px-3!"
        :disabled="disabledQualities.includes(quality)"
        @click="value = quality"
      >
        <span class="flex items-center justify-center gap-1">
          {{ quality }}
          <n-icon>
            <Star />
          </n-icon>
        </span>
      </n-button>
    </n-button-group>
  </div>
</template>

<script setup lang="ts">
  import { Star } from '@vicons/fa'

  withDefaults(
    defineProps<{
      qualityOptions?: number[]
      disabledQualities?: number[]
    }>(),
    {
      qualityOptions: () => [5, 4, 3, 2],
      disabledQualities: () => [],
    }
  )

  const value = defineModel<number | null>('value', { required: true })
  const { t } = useI18n()
</script>
