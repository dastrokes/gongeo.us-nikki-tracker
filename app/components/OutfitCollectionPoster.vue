<template>
  <CreationPosterFrame
    :export-mode="exportMode"
    :version="version"
  >
    <template #title>
      {{ t(showProgress ? 'navigation.wardrobe' : 'navigation.outfit') }}
      <template v-if="titleHighlight">
        · <span class="text-rose-700">{{ titleHighlight }}</span>
      </template>
    </template>
    <template
      v-if="pageCount > 1"
      #aside
    >
      <span
        class="inline-flex rounded-xl border border-[#DDD2E8] bg-white/90 px-4 py-2 text-[24px] font-semibold text-slate-600 tabular-nums"
      >
        {{ page }} / {{ pageCount }}
      </span>
    </template>

    <div
      class="mt-6 grid min-h-0 flex-1 justify-center gap-3"
      :style="gridStyle"
    >
      <div
        v-for="{ entry, badge } in tiles"
        :key="entry.id"
        class="relative flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[22px] border-2 bg-slate-100 bg-[url('/images/bg.webp')] bg-cover bg-center shadow-[0_5px_14px_rgb(74_49_80/0.07)]"
        :style="{ borderColor: getQualityTextTheme(entry.quality).borderColor }"
      >
        <div
          class="absolute inset-0"
          :style="getQualityOverlayStyle(entry.quality)"
        />
        <NuxtImg
          :src="getImageSrc('outfit', entry.id)"
          :alt="entry.name"
          sizes="200px"
          loading="eager"
          class="relative min-h-0 w-full flex-1 object-contain object-bottom"
          :class="
            showProgress &&
            entry.progress?.status === 'missing' &&
            !entry.evoLevel
              ? 'opacity-45 grayscale'
              : ''
          "
          @error="emit('image-error')"
        />
        <span
          v-if="badge"
          class="absolute top-2 left-2 max-w-[calc(100%-16px)] truncate rounded-lg border px-2 py-1 text-[22px] leading-none font-semibold tabular-nums"
          :class="badge.color"
        >
          {{ badge.label }}
        </span>
        <div
          class="relative mx-2 mb-2 rounded-xl border border-[#e2d8e6c7] bg-white/90 px-2 py-1 text-center text-[23px] leading-tight font-bold text-slate-800 shadow-[0_2px_8px_rgb(67_44_72/0.10)]"
        >
          <span class="block truncate">{{ entry.name }}</span>
        </div>
      </div>
    </div>
  </CreationPosterFrame>
</template>

<script setup lang="ts">
  import type { OutfitCollectionPosterEntry } from '~/utils/outfitCollectionPoster'

  const props = defineProps<{
    entries: readonly OutfitCollectionPosterEntry[]
    titleHighlight: string | null
    version: string | null
    page: number
    pageCount: number
    showProgress: boolean
    exportMode?: boolean
  }>()
  const emit = defineEmits<{ 'image-error': [] }>()
  const { t } = useI18n()
  const { getImageSrc } = imageProvider()

  const getBadge = ({ evoLevel, progress }: OutfitCollectionPosterEntry) => {
    if (evoLevel === 1 || evoLevel === 2 || evoLevel === 3) {
      return {
        label: t(`banner.outfit.level.${evoLevel + 1}`),
        color:
          evoLevel === 3
            ? 'border-amber-300 bg-amber-100 text-amber-900'
            : 'border-indigo-200 bg-indigo-50 text-indigo-800',
      }
    }
    if (progress?.status === 'owned') {
      return {
        label: t('compendium.image.stage_complete'),
        color: 'border-emerald-200 bg-emerald-50 text-emerald-800',
      }
    }
    if (progress?.status === 'partial') {
      return {
        label: `${progress.owned}/${progress.total}`,
        color: 'border-[#DDD2E8] bg-white text-slate-800',
      }
    }
    return null
  }
  const tiles = computed(() =>
    props.entries.map((entry) => ({
      entry,
      badge: props.showProgress ? getBadge(entry) : null,
    }))
  )

  const gridStyle = computed(() => {
    const count = Math.max(1, props.entries.length)
    const columns = Math.min(count, 6, Math.ceil(Math.sqrt(count * 1.25)))
    return {
      gridTemplateColumns: `repeat(${columns}, minmax(0, ${columns <= 3 ? '320px' : '1fr'}))`,
      gridTemplateRows: `repeat(${Math.ceil(count / columns)}, minmax(0, 1fr))`,
    }
  })
</script>
