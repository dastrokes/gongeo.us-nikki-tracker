<template>
  <div class="space-y-2">
    <div class="flex items-center gap-2">
      <NuxtLinkLocale
        no-prefetch
        :to="`/outfits/${outfitId}`"
        class="cursor-pointer transition-opacity hover:opacity-80"
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
    <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <NuxtLinkLocale
        v-for="level in outfitLevels"
        :key="level"
        no-prefetch
        :to="`/outfits/${getVariantId(level)}`"
        class="group block cursor-pointer"
      >
        <div class="relative">
          <OutfitCard
            :outfit-id="getVariantId(level)"
            :quality="quality"
            :name="`${$t(`outfit.${outfitId}.name`)} ${level === 0 ? 'Base' : `LV${level}`}`"
            :show-info="false"
            class="transition-all duration-300 ease-in-out group-hover:scale-[1.02] group-hover:shadow-lg"
          />
          <div
            class="pointer-events-none absolute top-1 right-1 z-20 origin-top-right scale-90 sm:scale-100"
          >
            <n-tag
              round
              size="small"
              :bordered="false"
              :color="getQualityTextTheme(quality)"
              ><span class="flex items-center gap-1">
                {{ $t(`banner.outfit.level.${level === 0 ? '1' : level}`) }}
                <n-icon v-if="getOutfitLevel.includes(level.toString())"
                  ><CheckCircle
                /></n-icon>
              </span>
            </n-tag>
          </div>
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

  const getVariantId = (level: number) =>
    level === 0
      ? props.outfitId
      : `${props.outfitId}${level.toString().padStart(2, '0')}`

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

  const outfitLevels = computed(() => {
    const levels = [0]
    const maxLevel = props.quality === 5 ? 4 : 2
    for (let i = 2; i <= maxLevel; i++) {
      levels.push(i)
    }
    return levels
  })
</script>
