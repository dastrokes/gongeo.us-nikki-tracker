<template>
  <n-card
    v-if="editMode"
    size="small"
    class="rounded-xl p-0 sm:p-2"
    content-class="p-2 sm:p-4"
  >
    <div
      class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
        <div class="min-w-0">
          <div
            class="text-xs font-semibold tracking-wide text-sky-600 uppercase dark:text-sky-300"
          >
            {{ t('wardrobe.batch.title') }}
          </div>
          <div class="text-sm font-medium text-gray-900 dark:text-gray-100">
            {{ activeCountLabel }}
          </div>
        </div>
        <n-radio-group
          :value="scope"
          size="small"
          class="sm:ml-2"
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
      </div>

      <div class="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:items-center">
        <n-button
          size="small"
          type="primary"
          :disabled="disabled || activeCount === 0"
          @click="$emit('mark-owned')"
        >
          <template #icon>
            <n-icon><Check /></n-icon>
          </template>
          {{ t('wardrobe.actions.mark_owned') }}
        </n-button>
        <n-button
          size="small"
          :disabled="disabled || activeCount === 0"
          @click="$emit('mark-unowned')"
        >
          <template #icon>
            <n-icon><Times /></n-icon>
          </template>
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
  </n-card>
</template>

<script setup lang="ts">
  import { Check, Times } from '@vicons/fa'

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

  const activeCountLabel = computed(() => {
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
