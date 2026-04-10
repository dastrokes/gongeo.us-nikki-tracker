<template>
  <div
    v-if="sections.length > 0"
    :class="[
      'attribute-card flex flex-col gap-3',
      `attribute-card--${props.layout}`,
    ]"
  >
    <div
      v-for="(section, index) in previewSections"
      :key="section.key"
      class="attribute-card__grid grid gap-x-2 gap-y-2"
    >
      <div
        v-for="field in section.fields"
        :key="field.field"
        class="min-w-0 rounded-lg border border-slate-200/70 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-900/35"
      >
        <div
          class="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest"
        >
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
      <button
        v-if="!showExpandedFields && hasCollapsedExtraFields && index === 0"
        type="button"
        class="flex h-full min-w-0 items-center justify-center rounded-lg border border-dashed border-slate-300/80 bg-slate-100/40 p-3 text-slate-500 hover:border-slate-400 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-900/15 dark:text-slate-400 dark:hover:border-slate-500 dark:hover:text-slate-200"
        :aria-label="t('feedback.more_tags')"
        @click="emit('expand')"
      >
        <span
          class="flex items-center justify-center gap-1 text-[11px] font-semibold uppercase tracking-[0.16em]"
        >
          <span class="text-sm leading-none">+</span>
          {{ t('feedback.more_tags') }}
        </span>
      </button>
    </div>

    <n-collapse-transition :show="showExpandedFields">
      <div
        v-if="extraSections.length > 0"
        class="space-y-3"
      >
        <div
          v-for="section in extraSections"
          :key="`${section.key}-extra`"
          class="attribute-card__grid grid gap-x-2 gap-y-2"
        >
          <div
            v-for="field in section.fields"
            :key="field.field"
            class="min-w-0 rounded-lg border border-slate-200/70 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-900/35"
          >
            <div
              class="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest"
            >
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
    </n-collapse-transition>
  </div>
</template>

<script setup lang="ts">
  import type {
    ItemSearchField,
    ItemSearchMetadata,
    ItemSearchMetadataDisplaySection,
  } from '#shared/types/itemSearch'

  const PREVIEW_FIELDS: ItemSearchField[] = ['category', 'subcategory']
  const emit = defineEmits<{
    expand: []
  }>()

  const props = withDefaults(
    defineProps<{
      metadata?: ItemSearchMetadata | null
      itemType?: string | null
      displayMode?: 'editable' | 'all'
      collapsible?: boolean
      expanded?: boolean
      layout?: 'default' | 'compact'
    }>(),
    {
      metadata: null,
      itemType: null,
      displayMode: 'all',
      collapsible: false,
      expanded: true,
      layout: 'default',
    }
  )

  const propsMetadata = computed(() => props.metadata)

  const { t } = useI18n()
  const { translateFilterToken } = useFilterToken()

  const sections = computed(() =>
    getItemSearchMetadataSections(propsMetadata.value, props.itemType, {
      editableOnly: props.displayMode === 'editable',
    })
  )

  const previewSections = computed<ItemSearchMetadataDisplaySection[]>(() => {
    const previewFieldSet = new Set(PREVIEW_FIELDS)

    return sections.value
      .map((section) => ({
        ...section,
        fields: section.fields.filter((field) =>
          previewFieldSet.has(field.field)
        ),
      }))
      .filter((section) => section.fields.length > 0)
  })

  const extraSections = computed<ItemSearchMetadataDisplaySection[]>(() => {
    const previewFieldSet = new Set(PREVIEW_FIELDS)

    return sections.value
      .map((section) => ({
        ...section,
        fields: section.fields.filter(
          (field) => !previewFieldSet.has(field.field)
        ),
      }))
      .filter((section) => section.fields.length > 0)
  })

  const hasCollapsedExtraFields = computed(() => extraSections.value.length > 0)

  const showExpandedFields = computed(
    () => !props.collapsible || props.expanded
  )
</script>

<style scoped>
  .attribute-card {
    container-type: inline-size;
    container-name: attribute-card;
  }

  .attribute-card__grid {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }

  @container attribute-card (min-width: 20rem) {
    .attribute-card__grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @container attribute-card (min-width: 34rem) {
    .attribute-card--default .attribute-card__grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  @container attribute-card (min-width: 48rem) {
    .attribute-card--default .attribute-card__grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }
</style>
