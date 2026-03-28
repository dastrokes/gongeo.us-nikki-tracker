<template>
  <div
    v-if="sections.length > 0"
    class="space-y-4"
  >
    <div
      v-for="section in sections"
      :key="section.key"
      class="space-y-2"
    >
      <div
        v-for="field in section.fields"
        :key="field.field"
        class="space-y-1"
      >
        <div class="text-xs font-semibold text-slate-500 dark:text-slate-400">
          {{ t(field.labelKey) }}
        </div>
        <div class="flex flex-wrap gap-1.5">
          <n-tag
            v-for="value in field.values"
            :key="`${field.field}-${value}`"
            size="small"
            type="default"
            :bordered="false"
            class="font-medium !bg-slate-100 dark:!bg-slate-800 text-slate-700 dark:text-slate-300 shadow-sm border border-slate-200/50 dark:border-slate-700/50"
          >
            {{ translateFilterToken(field.field, value) }}
          </n-tag>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { ItemSearchMetadata } from '#shared/types/itemSearch'

  const props = defineProps<{
    metadata?: ItemSearchMetadata | null
    itemType?: string | null
  }>()

  const { t } = useI18n()
  const { translateFilterToken } = useFilterToken()

  const sections = computed(() =>
    getItemSearchMetadataSections(props.metadata, props.itemType)
  )
</script>
