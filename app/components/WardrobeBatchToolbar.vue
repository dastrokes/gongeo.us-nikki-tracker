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
      <div
        class="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3"
      >
        <n-button-group>
          <n-button
            v-for="option in scopeOptions"
            :key="option.value"
            size="small"
            :type="scope === option.value ? 'primary' : 'default'"
            @click="$emit('update:scope', option.value)"
          >
            {{ option.label }}
          </n-button>
        </n-button-group>

        <div
          class="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100"
        >
          {{ activeCountLabel }}
          <n-button
            size="small"
            tertiary
            :disabled="!canClearSelection"
            @click="$emit('clear-selection')"
          >
            {{ t('common.clear') }}
          </n-button>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
        <n-button-group>
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
          <n-dropdown
            v-if="markOwnedMenuOptions.length > 0"
            trigger="click"
            :options="markOwnedMenuOptions"
            :disabled="disabled || activeCount === 0"
            @select="handleMarkOwnedMenuSelect"
          >
            <n-button
              size="small"
              type="primary"
              :disabled="disabled || activeCount === 0"
              :aria-label="t('wardrobe.actions.more_mark_options')"
              @click.stop
            >
              <template #icon>
                <n-icon><EllipsisH /></n-icon>
              </template>
            </n-button>
          </n-dropdown>
        </n-button-group>
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
      </div>
    </div>
  </n-card>
</template>

<script setup lang="ts">
  import { Check, EllipsisH, Times } from '@vicons/fa'
  import type { DropdownOption } from 'naive-ui'

  export type WardrobeBatchScope = 'selected' | 'page' | 'all'

  export type WardrobeBatchMenuOption = DropdownOption & { key: string }

  const props = defineProps<{
    editMode: boolean
    scope: WardrobeBatchScope
    selectedCount: number
    pageCount: number
    allMatchingCount: number | null
    disabled?: boolean
    markOwnedMenuOptions?: WardrobeBatchMenuOption[]
  }>()

  const emit = defineEmits<{
    (e: 'update:scope', value: WardrobeBatchScope): void
    (e: 'mark-owned' | 'mark-unowned' | 'clear-selection'): void
    (e: 'mark-owned-menu-select', key: string): void
  }>()

  const { t } = useI18n()

  const markOwnedMenuOptions = computed(() => props.markOwnedMenuOptions ?? [])

  const handleMarkOwnedMenuSelect = (key: string | number) => {
    emit('mark-owned-menu-select', String(key))
  }

  const scopeOptions = computed<
    Array<{ label: string; value: WardrobeBatchScope }>
  >(() => [
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

  const canClearSelection = computed(
    () => props.scope !== 'selected' || props.selectedCount > 0
  )
</script>
