<template>
  <CreationPosterFrame
    :export-mode="exportMode"
    :version="majorVersion"
  >
    <template #title>
      {{ title || t('creation_hub.outfit_card.poster_title') }}
    </template>

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
          class="absolute inset-x-[54px] top-[10px] z-10 truncate text-center text-[30px] leading-[34px] font-bold text-slate-800"
        >
          {{ prompt }}
        </span>
        <div
          v-if="outfitFor(index)"
          class="absolute bottom-[10px] left-1/2 z-10 flex h-[34px] w-max max-w-[calc(100%-36px)] min-w-[150px] -translate-x-1/2 items-center justify-center rounded-xl border border-[#e2d8e6c7] bg-white/90 px-[18px] text-center text-[22px] leading-none font-bold text-slate-800 shadow-[0_2px_8px_rgb(67_44_72/0.10)] backdrop-blur-xs"
        >
          <span class="block min-w-0 truncate">{{
            outfitFor(index)!.name
          }}</span>
        </div>
      </div>
    </div>
  </CreationPosterFrame>
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
      majorVersion?: string
      exportMode?: boolean
    }>(),
    { exportMode: false, title: '', majorVersion: '' }
  )

  const { t } = useI18n()
  const { getImageSrc } = imageProvider()
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
</script>
