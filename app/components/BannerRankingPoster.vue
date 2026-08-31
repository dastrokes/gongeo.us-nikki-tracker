<template>
  <div
    ref="previewFrame"
    class="max-w-full min-w-0 overflow-hidden"
    :class="
      exportMode
        ? 'h-[1440px] w-[1080px] rounded-[36px]'
        : 'aspect-3/4 w-full rounded-xl'
    "
  >
    <article
      class="flex h-[960px] w-[720px] origin-top-left flex-col overflow-hidden rounded-[24px] border border-[#DDD2E8] bg-[#fffafb] p-5 text-slate-900 shadow-[0_4px_20px_rgb(15_23_42/0.05)]"
      :style="canvasStyle"
    >
      <header class="flex shrink-0 items-center gap-3">
        <div
          class="flex size-14 shrink-0 items-center justify-center rounded-lg bg-white p-2 shadow-sm ring-1 ring-black/5"
        >
          <img
            src="/images/logo.webp"
            alt=""
            class="h-full w-full object-contain"
          />
        </div>
        <div class="min-w-0">
          <p class="text-base font-semibold tracking-wide text-slate-500">
            gongeo.us · Infinity Nikki
          </p>
          <h2 class="truncate text-3xl font-bold text-slate-900">
            {{ t('creation_hub.banner_ranking.poster_title') }}
          </h2>
        </div>
      </header>

      <div class="mt-4 grid min-h-0 flex-1 grid-cols-12 grid-rows-12 gap-2">
        <div
          v-for="(banner, index) in banners"
          :key="banner.bannerId"
          class="relative min-h-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
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
            class="absolute top-2 left-2 z-20 flex size-9 items-center justify-center rounded-lg border text-xl font-bold tabular-nums shadow-md"
            :class="rankBadgeClass(index + 1)"
          >
            {{ index + 1 }}
          </span>
          <div
            class="absolute inset-x-0 bottom-0 z-10 bg-linear-to-t from-slate-950/88 via-slate-900/45 to-transparent px-2 pt-7 pb-1.5 text-white"
          >
            <span class="line-clamp-1 min-w-0 text-base font-semibold">
              {{ banner.name }}
            </span>
          </div>
        </div>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
  const props = withDefaults(
    defineProps<{
      banners: Array<{ bannerId: number; name: string; image: string }>
      exportMode?: boolean
    }>(),
    { exportMode: false }
  )

  const { t } = useI18n()
  const { getImageSrc } = imageProvider()
  const previewFrame = ref<HTMLElement | null>(null)
  const previewScale = ref(props.exportMode ? 1 : 0)
  let resizeObserver: ResizeObserver | null = null
  const canvasStyle = computed(() =>
    props.exportMode
      ? { transform: 'scale(1.5)' }
      : {
          opacity: previewScale.value ? '1' : '0',
          transform: `scale(${previewScale.value})`,
        }
  )

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

  onMounted(() => {
    if (props.exportMode || !previewFrame.value) return
    const updateScale = () => {
      previewScale.value = (previewFrame.value?.clientWidth ?? 0) / 720
    }
    updateScale()
    resizeObserver = new ResizeObserver(updateScale)
    resizeObserver.observe(previewFrame.value)
  })

  onBeforeUnmount(() => resizeObserver?.disconnect())
</script>
