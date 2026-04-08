<template>
  <n-drawer
    :show="show"
    placement="right"
    :width="drawerWidth"
    class="h-[calc(100vh-3rem)] !top-12"
    :show-mask="false"
    :mask-closable="false"
    :on-mask-click="handleMaskClick"
    @update:show="emit('update:show', $event)"
  >
    <n-drawer-content closable>
      <template #header>
        <div class="flex items-center justify-between gap-3">
          <div class="flex min-w-0 items-center gap-2">
            <span
              class="truncate text-sm font-medium text-slate-900 dark:text-slate-100"
            >
              {{ t('compendium.advanced_filters') }}
            </span>
            <span
              v-if="activeCount > 0"
              class="inline-flex min-w-5 items-center justify-center rounded-full bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-300"
            >
              {{ activeCount }}
            </span>
          </div>

          <n-button
            v-if="activeCount > 0"
            text
            size="small"
            class="!px-1 !text-slate-500 transition-colors hover:!text-slate-700 dark:!text-slate-400 dark:hover:!text-slate-200"
            @click="clearFilters"
          >
            {{ t('compendium.clear_advanced_filters') }}
          </n-button>
        </div>
      </template>

      <div class="space-y-4">
        <AdvancedFilterFields
          v-if="visibleFields.length > 0"
          :fields="visibleFields"
          :filters="filters"
          :options="options"
          @update:filters="emit('update:filters', $event)"
        />

        <n-empty
          v-else
          size="small"
          class="py-6"
          :description="t('compendium.advanced_filters_empty')"
        />
      </div>
    </n-drawer-content>
  </n-drawer>
</template>

<script setup lang="ts">
  import type {
    ItemSearchAdvancedFacetMap,
    ItemSearchAdvancedScalarField,
    ItemSearchAdvancedScalarFilters,
  } from '#shared/types/itemSearch'

  const props = defineProps<{
    show: boolean
    fields: ItemSearchAdvancedScalarField[]
    filters: ItemSearchAdvancedScalarFilters
    options: ItemSearchAdvancedFacetMap
    ignoreCloseSelector?: string
  }>()

  const emit = defineEmits<{
    'update:show': [value: boolean]
    'update:filters': [value: ItemSearchAdvancedScalarFilters]
  }>()

  const { t } = useI18n()
  const { width } = useWindowSize()
  const drawerWidth = computed(() => (width.value < 640 ? '100%' : 360))
  const visibleFields = computed(() =>
    props.fields.filter((field) => {
      const values = props.options[field] ?? []
      return values.length > 0 || Boolean(props.filters[field])
    })
  )
  const activeCount = computed(
    () =>
      visibleFields.value.filter((field) => Boolean(props.filters[field]))
        .length
  )

  const clearFilters = () => {
    emit(
      'update:filters',
      Object.fromEntries(visibleFields.value.map((field) => [field, null]))
    )
  }

  const handleMaskClick = (event: MouseEvent) => {
    const target = event.target

    if (
      props.ignoreCloseSelector &&
      target instanceof Element &&
      target.closest(props.ignoreCloseSelector)
    ) {
      return
    }

    emit('update:show', false)
  }
</script>
