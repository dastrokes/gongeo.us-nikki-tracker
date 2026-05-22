<template>
  <div class="flex items-center gap-2 self-start text-sm whitespace-nowrap">
    <span class="text-gray-500 dark:text-gray-400">
      {{ t('common.variations') }}
    </span>
    <n-select
      :value="value"
      size="small"
      class="w-32"
      :options="variationOptions"
      :aria-label="t('common.variations')"
      @update:value="handleUpdate"
    />
  </div>
</template>

<script setup lang="ts">
  type CatalogVariationFilter =
    | 'base'
    | 'all'
    | 'glowup'
    | 'evo1'
    | 'evo2'
    | 'evo3'
    | 'all-evos'

  defineProps<{
    value: CatalogVariationFilter
  }>()

  const emit = defineEmits<{
    (event: 'update:value', value: CatalogVariationFilter): void
  }>()

  const { t } = useI18n()

  const variationOptions = computed(() => [
    { label: t('banner.outfit.level.1'), value: 'base' },
    { label: t('common.all'), value: 'all' },
    { label: t('banner.outfit.level.glow'), value: 'glowup' },
    { label: t('banner.outfit.level.2'), value: 'evo1' },
    { label: t('banner.outfit.level.3'), value: 'evo2' },
    { label: t('banner.outfit.level.4'), value: 'evo3' },
    { label: t('compendium.variation_filter.all_evos'), value: 'all-evos' },
  ])

  const handleUpdate = (value: CatalogVariationFilter) => {
    emit('update:value', value)
  }
</script>
