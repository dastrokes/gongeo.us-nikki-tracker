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
          <span class="flex items-center gap-1">
            {{ $t(`outfit.${outfitId}.name`) }} {{ quality }}
            <n-icon>
              <Star />
            </n-icon>
          </span>
        </n-tag>
      </NuxtLinkLocale>
    </div>
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <NuxtLinkLocale
        v-for="(image, index) in Array.from(outfitImages.entries())"
        :key="index"
        no-prefetch
        :to="`/outfits/${outfitId}`"
        class="relative aspect-[2/3] rounded-lg overflow-hidden transition-all duration-300 ease-in-out cursor-pointer hover:shadow-lg"
      >
        <div
          class="absolute inset-0 bg-[url('/images/bg.webp')] bg-cover bg-center bg-slate-100 dark:bg-slate-300"
        ></div>
        <!-- Tint overlay -->
        <div
          class="absolute inset-0"
          :style="getQualityOverlayStyle(quality)"
        ></div>
        <NuxtImg
          :src="image[1]"
          :alt="`${$t(`outfit.${outfitId}.name`)} ${image[0] === 0 ? 'Base' : `LV${image[0]}`}`"
          class="absolute inset-0 w-full h-full object-cover z-10"
          preset="tallLg"
          width="200"
          height="300"
          fit="cover"
          loading="lazy"
          sizes="200px"
        />
        <div
          class="absolute top-1 right-1 scale-90 sm:scale-100 origin-top-right z-20"
        >
          <n-tag
            round
            size="small"
            :bordered="false"
            :color="getQualityTextTheme(quality)"
            ><span class="flex items-center gap-1">
              {{ $t(`banner.outfit.level.${image[0] === 0 ? '1' : image[0]}`) }}
              <n-icon v-if="getOutfitLevel.includes(image[0].toString())"
                ><CheckCircle
              /></n-icon>
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

  const pullStore = usePullStore()
  const { getImageSrc } = imageProvider()

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
