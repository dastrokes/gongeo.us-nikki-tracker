<template>
  <div
    class="flex w-full max-w-40 items-center gap-2 self-start text-sm whitespace-nowrap sm:w-40"
  >
    <n-select
      :value="value"
      size="small"
      class="w-full"
      :options="variationOptions"
      :render-label="renderVariationOptionLabel"
      :aria-label="t('common.variations')"
      @update:value="handleUpdate"
    />
  </div>
</template>

<script setup lang="ts">
  import { Palette } from '@vicons/fa'
  import { NIcon } from 'naive-ui'
  import type { SelectOption } from 'naive-ui'
  import { h } from 'vue'

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

  const renderVariationOptionLabel = (option: SelectOption) =>
    h('div', { class: 'flex items-center gap-2' }, [
      h(NIcon, { size: 16 }, { default: () => h(Palette) }),
      h('span', null, String(option.label ?? '')),
    ])

  const handleUpdate = (value: CatalogVariationFilter) => {
    emit('update:value', value)
  }
</script>
