<template>
  <CreationPosterFrame
    :export-mode="exportMode"
    :version="version"
  >
    <template #title>
      {{
        title ?? t(showProgress ? 'navigation.wardrobe' : 'navigation.outfit')
      }}
      <template v-if="titleHighlight">
        · <span class="text-rose-700">{{ titleHighlight }}</span>
      </template>
    </template>
    <template
      v-if="pageCount > 1"
      #aside
    >
      <span
        class="inline-flex rounded-full bg-[#f5f0fa] px-4 py-2 text-[24px] font-semibold text-slate-600 tabular-nums"
      >
        {{ page }} / {{ pageCount }}
      </span>
    </template>

    <div class="[container-type:size] mt-6 min-h-0 flex-1">
      <div
        class="flex h-full flex-col justify-center"
        :style="layout.style"
      >
        <div
          v-for="(row, index) in layout.rows"
          :key="index"
          class="flex shrink-0 justify-center gap-[inherit]"
        >
          <div
            v-for="{ entry, status, surface, frameStyle } in row"
            :key="entry.id"
            class="[container-type:inline-size] relative w-(--outfit-tile-width) min-w-0 flex-none overflow-hidden rounded-2xl"
            :class="
              status?.stage === 'evo3'
                ? 'shadow-[0_0_12px_rgb(245_158_11/0.22)]'
                : ''
            "
            :style="surface"
          >
            <NuxtImg
              :src="getImageSrc('outfit', entry.id)"
              :alt="entry.name"
              :sizes="entries.length <= 4 ? '400px' : '200px'"
              loading="eager"
              class="absolute inset-0 size-full object-contain"
              :class="status?.stage === 'missing' ? 'opacity-75 grayscale' : ''"
              @error="emit('image-error')"
            />
            <div
              aria-hidden="true"
              class="pointer-events-none absolute inset-0 rounded-2xl"
              :class="status ? stageStyles[status.stage].frame : 'border-2'"
              :style="frameStyle"
            />
            <span
              v-if="status && status.stage !== 'missing'"
              class="absolute inset-x-0 bottom-2 mx-auto w-max min-w-max rounded-full px-[0.35em] py-[0.16em] text-[min(22cqw,clamp(32px,19cqw,40px))] leading-none font-semibold whitespace-nowrap tabular-nums"
              :class="stageStyles[status.stage].badge"
            >
              {{ status.label }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </CreationPosterFrame>
</template>

<script setup lang="ts">
  import type { OutfitCollectionPosterEntry } from '~/utils/outfitCollectionPoster'

  const props = defineProps<{
    entries: readonly OutfitCollectionPosterEntry[]
    title?: string
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
  const outfitArtAspect = 448 / 656

  const stageStyles = {
    missing: {
      frame: 'shadow-[inset_0_0_8px_1px_rgb(100_116_139/0.24)]',
    },
    partial: {
      frame: 'border-2 border-dashed border-slate-400',
      badge: 'border-[1.5px] border-[#a99fab] bg-white/95 text-slate-700',
    },
    complete: {
      frame: 'border-2 border-emerald-400',
      badge: 'border-[1.5px] border-[#6ee7b7] bg-emerald-100 text-emerald-900',
    },
    evo1: {
      frame: 'border-[3px] border-sky-400',
      badge: 'border-[1.5px] border-[#38bdf8] bg-sky-100 text-sky-900',
    },
    evo2: {
      frame: 'border-[3px] border-violet-400',
      badge: 'border-[1.5px] border-[#a78bfa] bg-violet-100 text-violet-900',
    },
    evo3: {
      frame: 'border-[3px] border-amber-500',
      badge: 'bg-[linear-gradient(135deg,#fde68a,#f59e0b)] text-[#5b3a06]',
    },
  } as const

  type PosterStatus =
    | { stage: 'missing' }
    | { stage: Exclude<keyof typeof stageStyles, 'missing'>; label: string }

  const getStatus = ({
    evoLevel,
    progress,
  }: OutfitCollectionPosterEntry): PosterStatus | null => {
    if (evoLevel === 1 || evoLevel === 2 || evoLevel === 3) {
      return {
        stage: `evo${evoLevel}`,
        label: t(`banner.outfit.level.${evoLevel + 1}`),
      }
    }
    if (progress?.status === 'owned') {
      return {
        stage: 'complete',
        label: t('banner.outfit.level.1'),
      }
    }
    if (progress?.status === 'partial') {
      return {
        stage: 'partial',
        label: `${progress.owned}/${progress.total}`,
      }
    }
    if (progress?.status === 'missing') {
      return { stage: 'missing' }
    }
    return null
  }
  const tiles = computed(() =>
    props.entries.map((entry) => {
      const status = props.showProgress ? getStatus(entry) : null
      const rarity = getQualityColor(entry.quality)
      const missing = status?.stage === 'missing'
      return {
        entry,
        status,
        surface: {
          aspectRatio: outfitArtAspect,
          backgroundColor: missing
            ? '#f1f5f9'
            : getQualityBackgroundColor(entry.quality),
          backgroundImage: missing
            ? `linear-gradient(155deg, ${rarity}0A, ${rarity}1A)`
            : undefined,
        },
        frameStyle: status ? undefined : { borderColor: `${rarity}40` },
      }
    })
  )

  const layout = computed(() => {
    const count = tiles.value.length
    const columns = Math.max(
      1,
      Math.ceil(Math.sqrt(count)),
      Math.ceil(count / 6)
    )
    const rowCount = Math.ceil(count / columns)
    const gap = 12
    const widthFit = `(100cqw - ${(columns - 1) * gap}px) / ${columns}`
    const rows = Array.from({ length: rowCount }, (_, row) =>
      tiles.value.slice(row * columns, (row + 1) * columns)
    )
    const heightFit = `(100cqh - ${(rowCount - 1) * gap}px) / ${rowCount || 1}`
    return {
      rows,
      style: {
        gap: `${gap}px`,
        '--outfit-tile-width': `min(calc(${widthFit}), calc(${heightFit} * ${outfitArtAspect}))`,
      },
    }
  })
</script>
