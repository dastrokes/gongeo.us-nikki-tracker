<template>
  <div
    v-if="editMode"
    class="sticky bottom-3 z-30 mx-auto flex w-[calc(100%-1rem)] max-w-4xl flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white/95 p-2 shadow-lg backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/95"
  >
    <div class="flex min-w-0 flex-wrap items-center gap-2">
      <n-radio-group
        :value="scope"
        size="small"
        @update:value="$emit('update:scope', $event as WardrobeBatchScope)"
      >
        <n-radio-button
          v-for="option in scopeOptions"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </n-radio-button>
      </n-radio-group>
      <span class="text-sm font-medium text-gray-700 dark:text-gray-200">
        {{ countLabel }}
      </span>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <n-button
        size="small"
        :disabled="disabled || activeCount === 0"
        @click="$emit('mark-owned')"
      >
        {{ t('wardrobe.actions.mark_owned') }}
      </n-button>
      <n-button
        size="small"
        :disabled="disabled || activeCount === 0"
        @click="$emit('mark-unowned')"
      >
        {{ t('wardrobe.actions.mark_unowned') }}
      </n-button>
      <n-button
        size="small"
        quaternary
        :disabled="selectedCount === 0"
        @click="$emit('clear-selection')"
      >
        {{ t('wardrobe.actions.clear_selection') }}
      </n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
  export type WardrobeBatchScope = 'selected' | 'page' | 'all'

  const props = defineProps<{
    editMode: boolean
    scope: WardrobeBatchScope
    selectedCount: number
    pageCount: number
    allMatchingCount: number | null
    disabled?: boolean
  }>()

  defineEmits<{
    (e: 'update:scope', value: WardrobeBatchScope): void
    (e: 'mark-owned' | 'mark-unowned' | 'clear-selection'): void
  }>()

  const { t } = useI18n()

  const scopeOptions = computed(() => [
    { label: t('wardrobe.scope.selected'), value: 'selected' },
    { label: t('wardrobe.scope.page'), value: 'page' },
    { label: t('wardrobe.scope.all'), value: 'all' },
  ])

  const activeCount = computed(() => {
    if (props.scope === 'selected') return props.selectedCount
    if (props.scope === 'page') return props.pageCount
    return props.allMatchingCount ?? 0
  })

  const countLabel = computed(() => {
    if (props.scope === 'selected') {
      return t('wardrobe.count.selected', { count: props.selectedCount })
    }
    if (props.scope === 'page') {
      return t('wardrobe.count.page', { count: props.pageCount })
    }
    if (props.allMatchingCount === null) {
      return t('wardrobe.count.all', { count: 0 })
    }
    return t('wardrobe.count.all', {
      count: props.allMatchingCount,
    })
  })
</script>
