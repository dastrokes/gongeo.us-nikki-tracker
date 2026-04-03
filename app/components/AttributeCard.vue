<template>
  <div
    v-if="sections.length > 0"
    class="flex flex-col gap-2"
  >
    <div
      v-for="section in sections"
      :key="section.key"
      class="grid grid-cols-2 gap-x-2 gap-y-2 sm:gap-y-3"
    >
      <div
        v-for="field in section.fields"
        :key="field.field"
        class="flex flex-col gap-1"
      >
        <div
          class="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest"
        >
          {{ t(field.labelKey) }}
        </div>
        <div class="flex flex-wrap gap-1">
          <n-tag
            v-for="value in field.values"
            :key="`${field.field}-${value}`"
            size="small"
            type="default"
            :bordered="false"
            class="font-medium !bg-slate-100 dark:!bg-slate-800 text-slate-700 dark:text-slate-300 shadow-sm border border-slate-200/50 dark:border-slate-700/50"
          >
            {{
              translateFilterToken(
                field.field,
                value,
                props.itemType ?? props.metadata?.item_type
              )
            }}
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
