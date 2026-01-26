<template>
  <div class="space-y-2">
    <div class="flex items-center gap-2">
      <NuxtLinkLocale
        no-prefetch
        :to="`/outfits/${outfitId}`"
        class="cursor-pointer hover:opacity-80 transition-opacity"
      >
        <n-tag
          :color="getQualityTextTheme(quality)"
          :bordered="false"
          round
          class="cursor-pointer"
        >
          <span class="align-top"
            >{{ t(`outfit.${outfitId}.name`) }} {{ quality }}</span
          >
          <span class="ml-1"
            ><n-icon><Star /></n-icon
          ></span>
        </n-tag>
      </NuxtLinkLocale>
    </div>
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <NuxtLinkLocale
        v-for="(image, index) in Array.from(outfitImages.entries())"
        :key="index"
        no-prefetch
        :to="`/outfits/${outfitId}`"
        class="relative aspect-[2/3] rounded-lg overflow-hidden transition-all duration-300 ease-in-out cursor-pointer"
        :class="cardGradient"
      >
        <NuxtImg
          :src="image[1]"
          :alt="`${t(`outfit.${outfitId}.name`)} ${image[0] === 0 ? 'Base' : `LV${image[0]}`}`"
          class="absolute inset-0 w-full h-full object-cover z-10"
          preset="tallLg"
          width="300"
          height="450"
          fit="cover"
          loading="lazy"
          sizes="300px"
        />
        <div
          class="absolute top-1 right-1 scale-90 sm:scale-100 origin-top-right z-20"
        >
          <n-tag
            round
            size="small"
            :bordered="false"
            :color="getQualityTextTheme(quality)"
          >
            {{ t(`banner.outfit.level.${image[0] === 0 ? '1' : image[0]}`) }}
            <span v-if="getOutfitLevel.includes(image[0].toString())">
              <n-icon><CheckCircle /></n-icon>
            </span>
          </n-tag>
        </div>
      </NuxtLinkLocale>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { Star, CheckCircle } from '@vicons/fa'

  interface CompletionData {
    completion: number
    totalPulls: number
  }

  const props = defineProps<{
    bannerId: number
    outfitId: string
    quality: 4 | 5
    completionData?: CompletionData
  }>()

  const { t } = useI18n()
  const pullStore = usePullStore()
  const { getImageSrc } = imageProvider()
  const OUTFIT_CARD_GRADIENTS = {
    fiveStar:
      'bg-gradient-to-br from-[#fff8e1] to-[#ffcc80] hover:brightness-105 dark:from-[#713f12] dark:to-[#451a03]',
    fourStar:
      'bg-gradient-to-br from-[#e3f2fd] to-[#bbdefb] hover:brightness-105 dark:from-[#334155] dark:to-[#1e293b]',
  } as const
  const cardGradient = computed(() =>
    props.quality === 5
      ? OUTFIT_CARD_GRADIENTS.fiveStar
      : OUTFIT_CARD_GRADIENTS.fourStar
  )

  const getOutfitLevel = computed(() => {
    if (!props.completionData) return []

    const levels = []
    const totalPulls = props.completionData.totalPulls
    const manualEvoLevel = pullStore.getOutfitEvoLevel(
      props.bannerId,
      props.outfitId
    )

    if (props.quality === 5) {
      if (props.completionData.completion >= 1) {
        levels.push('0')
      }
      if (
        (totalPulls >= 180 || manualEvoLevel >= 2) &&
        props.completionData.completion >= 1
      ) {
        levels.push('2')
      }
      if (
        (totalPulls >= 230 || manualEvoLevel >= 3) &&
        props.completionData.completion >= 1
      ) {
        levels.push('3')
      }
      if (props.completionData.completion >= 2) {
        levels.push('4')
      }
    } else {
      if (props.completionData.completion >= 1) levels.push('0')
      if (props.completionData.completion >= 2) levels.push('2')
    }

    return levels
  })

  const outfitImages = computed(() => {
    const images = new Map<number, string>()
    images.set(0, getImageSrc('outfit', props.outfitId))

    // Add level variants based on quality
    const maxLevel = props.quality === 5 ? 4 : 2
    for (let i = 2; i <= maxLevel; i++) {
      const levelNum = i.toString().padStart(2, '0')
      images.set(i, getImageSrc('outfit', `${props.outfitId}${levelNum}`))
    }

    return images
  })
</script>
