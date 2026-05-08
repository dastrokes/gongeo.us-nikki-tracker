<template>
  <div class="space-y-3">
    <div class="flex flex-wrap items-center gap-2">
      <component
        :is="headingTag"
        :class="headingClass"
      >
        {{ itemName }}
      </component>
    </div>

    <div class="flex flex-wrap gap-2">
      <n-tag
        v-if="quality"
        :color="getQualityTextTheme(quality)"
        :bordered="false"
        round
        size="small"
      >
        <span class="flex items-center gap-1">
          {{ quality }}
          <n-icon class="text-xs">
            <Star />
          </n-icon>
        </span>
      </n-tag>
      <n-tag
        v-if="itemTypeLabel"
        type="default"
        :bordered="false"
        round
        size="small"
      >
        {{ itemTypeLabel }}
      </n-tag>
    </div>

    <div
      v-if="styleLabel || labelTags.length > 0"
      class="flex flex-wrap gap-2"
    >
      <n-tag
        v-if="styleLabel"
        size="small"
        :bordered="false"
        type="default"
        :color="getStyleTagTheme(styleKey)"
        class="text-xs font-semibold shadow-[inset_0_-2px_0_rgba(0,0,0,0.18)]"
      >
        {{ styleLabel }}
      </n-tag>
      <n-tag
        v-for="label in labelTags"
        :key="label.key"
        size="small"
        type="default"
        :color="getLabelTagTheme(label.themeValue)"
        round
        class="text-xs font-semibold"
      >
        {{ label.text }}
      </n-tag>
    </div>

    <div
      v-if="versionDisplay || obtainLabel"
      class="flex flex-wrap gap-2"
    >
      <n-tag
        v-if="versionDisplay"
        type="default"
        :bordered="false"
        round
        size="small"
      >
        {{ versionDisplay }}
      </n-tag>
      <n-tag
        v-if="obtainLabel"
        type="default"
        :bordered="false"
        round
        size="small"
      >
        {{ obtainLabel }}
      </n-tag>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { Star } from '@vicons/fa'

  type LabelTag = {
    key: string
    text: string
    themeValue: string | number
  }

  withDefaults(
    defineProps<{
      itemName: string
      quality?: number | null
      itemTypeLabel?: string
      itemType?: string | null
      categoryLabel?: string
      subcategoryLabel?: string
      metadata?: ItemSearchMetadata | null
      styleKey?: string | null
      styleLabel?: string | null
      labelTags?: LabelTag[]
      versionDisplay?: string | null
      obtainLabel?: string | null
      headingTag?: 'h2' | 'h3'
      headingClass?: string
    }>(),
    {
      quality: null,
      itemTypeLabel: '',
      itemType: null,
      categoryLabel: '',
      subcategoryLabel: '',
      metadata: null,
      styleKey: null,
      styleLabel: null,
      labelTags: () => [],
      versionDisplay: null,
      obtainLabel: null,
      headingTag: 'h2',
      headingClass:
        'text-xl leading-tight font-black text-slate-800 dark:text-white',
    }
  )
</script>
