<template>
  <div
    ref="previewFrame"
    class="max-w-full min-w-0 overflow-hidden"
    :class="
      exportMode
        ? 'h-[1440px] w-[1080px] rounded-[40px]'
        : 'aspect-3/4 w-full rounded-xl'
    "
  >
    <article
      class="flex h-[1440px] w-[1080px] origin-top-left flex-col overflow-hidden rounded-[40px] border-2 border-[#DDD2E8] bg-[#fffafb] p-[32px] text-slate-900 shadow-[0_4px_20px_rgb(15_23_42/0.05)]"
      :style="canvasStyle"
    >
      <header class="flex h-[88px] shrink-0 items-center gap-5">
        <div
          class="flex size-[88px] shrink-0 items-center justify-center rounded-[24px] bg-white p-[14px] shadow-sm ring-1 ring-black/5"
        >
          <img
            src="/images/logo.webp"
            alt=""
            class="h-full w-full object-contain"
          />
        </div>
        <div class="min-w-0">
          <p
            class="text-[25px] leading-8 font-semibold tracking-wide text-slate-500"
          >
            gongeo.us · Infinity Nikki
          </p>
          <h2
            class="truncate text-[48px] leading-[1.08] font-bold text-slate-900"
          >
            {{ title || t('creation_hub.outfit_card.poster_title') }}
          </h2>
        </div>
      </header>

      <div class="mt-6 grid min-h-0 flex-1 grid-cols-3 grid-rows-3 gap-3">
        <div
          v-for="(prompt, index) in prompts"
          :key="index"
          class="relative min-h-0 overflow-hidden rounded-[22px] border-2 border-slate-200 bg-slate-100 bg-[url('/images/bg.webp')] bg-cover bg-center shadow-[0_5px_14px_rgb(74_49_80/0.07)]"
          :style="posterCardStyle(index)"
        >
          <div
            v-if="outfitFor(index)"
            class="absolute inset-0"
            :style="posterQualityOverlayStyle(index)"
          />
          <div
            v-if="outfitFor(index)"
            class="absolute inset-x-0 top-[52px] bottom-0 overflow-hidden"
          >
            <NuxtImg
              :src="getImageSrc('outfit', outfitFor(index)!.id)"
              :alt="outfitFor(index)!.name"
              sizes="400px"
              class="relative -top-px h-[calc(100%+1px)] w-full object-contain object-bottom"
            />
          </div>
          <span
            class="absolute top-[15px] left-[15px] z-10 text-xl leading-none font-bold tracking-wide text-slate-400 tabular-nums"
          >
            {{ String(index + 1).padStart(2, '0') }}
          </span>
          <span
            class="absolute inset-x-[54px] top-[10px] z-10 line-clamp-2 text-center text-[30px] leading-[34px] font-bold text-slate-800"
          >
            {{ prompt }}
          </span>
          <div
            v-if="outfitFor(index)"
            class="absolute bottom-[10px] left-1/2 z-10 flex h-[34px] w-max max-w-[calc(100%-36px)] min-w-[150px] -translate-x-1/2 items-center justify-center truncate rounded-xl border border-[#e2d8e6c7] bg-white/92 px-[18px] text-center text-[22px] leading-none font-bold text-slate-800 shadow-[0_2px_8px_rgb(67_44_72/0.10)] backdrop-blur-xs"
          >
            {{ outfitFor(index)!.name }}
          </div>
        </div>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
  const props = withDefaults(
    defineProps<{
      prompts: string[]
      selectedIds: Array<string | number | null>
      outfits: Record<
        string,
        { id: string | number; name: string; quality?: string | number }
      >
      title?: string
      exportMode?: boolean
    }>(),
    { exportMode: false, title: '' }
  )

  const { t } = useI18n()
  const { getImageSrc } = imageProvider()
  const previewFrame = ref<HTMLElement | null>(null)
  const previewScale = ref(props.exportMode ? 1 : 0)
  let resizeObserver: ResizeObserver | null = null

  const canvasStyle = computed(() =>
    props.exportMode
      ? undefined
      : {
          opacity: previewScale.value ? '1' : '0',
          transform: `scale(${previewScale.value})`,
        }
  )

  const outfitFor = (index: number) => {
    const id = props.selectedIds[index]
    return id == null ? null : (props.outfits[String(id)] ?? null)
  }

  const posterCardStyle = (index: number) => {
    const outfit = outfitFor(index)
    return outfit
      ? { borderColor: getQualityTextTheme(Number(outfit.quality)).borderColor }
      : undefined
  }
  const posterQualityOverlayStyle = (index: number) =>
    getQualityOverlayStyle(Number(outfitFor(index)?.quality))

  onMounted(() => {
    if (props.exportMode || !previewFrame.value) return
    const updateScale = () => {
      previewScale.value = (previewFrame.value?.clientWidth ?? 0) / 1080
    }
    updateScale()
    resizeObserver = new ResizeObserver(updateScale)
    resizeObserver.observe(previewFrame.value)
  })

  onBeforeUnmount(() => resizeObserver?.disconnect())
</script>
