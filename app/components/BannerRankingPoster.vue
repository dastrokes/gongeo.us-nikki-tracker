<template>
  <CreationPosterFrame
    :export-mode="exportMode"
    :version="majorVersion"
  >
    <template #title>
      {{ t('creation_hub.banner_ranking.poster_title') }}
    </template>

    <div class="mt-6 grid min-h-0 flex-1 grid-cols-12 grid-rows-12 gap-3">
      <div
        v-for="(banner, index) in banners"
        :key="banner.bannerId"
        class="relative min-h-0 overflow-hidden rounded-[22px] border-2 border-slate-200 bg-slate-100 shadow-[0_5px_14px_rgb(74_49_80/0.07)]"
        :style="rankPosition(index)"
      >
        <NuxtImg
          :src="getImageSrc('banner', banner.bannerId)"
          :alt="banner.name"
          preset="bannerHero"
          sizes="900px"
          class="absolute inset-0 h-full w-full object-cover"
          :style="getBannerFocalPointStyle(banner.bannerId)"
          @load="applyBannerFocalPoint($event, banner.bannerId)"
        />
        <span
          :data-rank="index + 1"
          class="absolute top-3 left-3 z-20 flex size-[54px] items-center justify-center rounded-xl border-2 text-[30px] font-bold tabular-nums shadow-md"
          :class="rankBadgeClass(index + 1)"
        >
          {{ index + 1 }}
        </span>
        <div
          class="absolute inset-x-0 bottom-0 z-10 bg-linear-to-t from-slate-950/88 via-slate-900/45 to-transparent px-3 pt-[42px] pb-[9px] text-white"
        >
          <span class="block truncate text-2xl font-semibold">
            {{ banner.name }}
          </span>
        </div>
      </div>
    </div>
  </CreationPosterFrame>
</template>

<script setup lang="ts">
  withDefaults(
    defineProps<{
      banners: Array<{ bannerId: number; name: string; image: string }>
      majorVersion?: string
      exportMode?: boolean
    }>(),
    { exportMode: false, majorVersion: '' }
  )

  const { t } = useI18n()
  const { getImageSrc } = imageProvider()
  const positions = [
    { gridColumn: '3 / 11', gridRow: '1 / 4' },
    { gridColumn: '1 / 7', gridRow: '4 / 7' },
    { gridColumn: '7 / 13', gridRow: '4 / 7' },
    { gridColumn: '1 / 5', gridRow: '7 / 10' },
    { gridColumn: '5 / 9', gridRow: '7 / 10' },
    { gridColumn: '9 / 13', gridRow: '7 / 10' },
    { gridColumn: '1 / 4', gridRow: '10 / 13' },
    { gridColumn: '4 / 7', gridRow: '10 / 13' },
    { gridColumn: '7 / 10', gridRow: '10 / 13' },
    { gridColumn: '10 / 13', gridRow: '10 / 13' },
  ]

  const rankPosition = (index: number) => positions[index]
  const rankBadgeClass = (rank: number) => {
    if (rank === 1) return 'border-amber-300 bg-amber-100 text-amber-800'
    if (rank === 2) return 'border-slate-300 bg-slate-100 text-slate-700'
    if (rank === 3) return 'border-orange-300 bg-orange-100 text-orange-800'
    return 'border-rose-200 bg-white/95 text-rose-600'
  }
</script>
