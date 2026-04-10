<template>
  <div
    v-if="fields.length > 0"
    class="space-y-2"
  >
    <div
      v-for="field in fields"
      :key="field"
      :class="[
        'space-y-1.5 rounded-xl border p-3',
        hasActiveItemSearchAdvancedFilterValue(filters[field] ?? null)
          ? 'border-slate-300 bg-slate-100/90 dark:border-slate-600 dark:bg-slate-900/55'
          : 'border-black/5 bg-slate-50/85 hover:border-slate-300/70 hover:bg-slate-100/70 dark:border-white/10 dark:bg-slate-900/35 dark:hover:border-white/15 dark:hover:bg-slate-900/50',
      ]"
    >
      <label
        class="block text-xs font-medium text-slate-500 dark:text-slate-400"
      >
        {{ t(getItemSearchFieldLabelKey(field)) }}
      </label>

      <n-select
        v-if="
          isItemSearchArrayField(field) &&
          !isItemSearchCompendiumSingleSelectArrayField(field)
        "
        :value="Array.isArray(filters[field]) ? filters[field] : []"
        :options="buildOptions(field)"
        size="small"
        multiple
        clearable
        filterable
        :show-checkmark="false"
        :placeholder="
          t('compendium.advanced_filter_placeholder', {
            field: t(getItemSearchFieldLabelKey(field)),
          })
        "
        @update:value="updateField(field, $event)"
      />

      <n-select
        v-else
        :value="
          isItemSearchCompendiumSingleSelectArrayField(field)
            ? Array.isArray(filters[field])
              ? (filters[field][0] ?? null)
              : null
            : typeof filters[field] === 'string'
              ? filters[field]
              : null
        "
        :options="buildOptions(field)"
        size="small"
        clearable
        filterable
        :show-checkmark="false"
        :placeholder="
          t('compendium.advanced_filter_placeholder', {
            field: t(getItemSearchFieldLabelKey(field)),
          })
        "
        @update:value="updateField(field, $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  import type {
    ItemSearchAdvancedFilters,
    ItemSearchAdvancedField,
    ItemSearchAdvancedFacetMap,
  } from '#shared/types/itemSearch'
  import {
    hasActiveItemSearchAdvancedFilterValue,
    isItemSearchCompendiumSingleSelectArrayField,
    isItemSearchArrayField,
    sortItemSearchFacetValues,
  } from '#shared/utils/itemSearch'
  import type { SelectOption } from 'naive-ui'

  const props = defineProps<{
    fields: ItemSearchAdvancedField[]
    filters: ItemSearchAdvancedFilters
    options: ItemSearchAdvancedFacetMap
  }>()

  const emit = defineEmits<{
    'update:filters': [value: ItemSearchAdvancedFilters]
  }>()

  const { t } = useI18n()
  const { translateFilterToken } = useFilterToken()

  const buildOptions = (field: ItemSearchAdvancedField): SelectOption[] =>
    sortItemSearchFacetValues(props.options[field] ?? []).map((value) => ({
      label: translateFilterToken(field, value),
      value,
    }))

  const updateField = (
    field: ItemSearchAdvancedField,
    value: string | string[] | null
  ) => {
    const nextValue = isItemSearchCompendiumSingleSelectArrayField(field)
      ? typeof value === 'string' && value
        ? [value]
        : []
      : value

    emit('update:filters', {
      ...props.filters,
      [field]: nextValue,
    })
  }
</script>
