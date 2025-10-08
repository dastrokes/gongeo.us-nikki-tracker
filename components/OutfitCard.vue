<template>
  <div class="space-y-2">
    <div class="flex items-center gap-2">
      <n-tag
        :type="rarity === 5 ? 'warning' : 'info'"
        :bordered="false"
        round
      >
        {{ t(`outfit.${outfitId}.name`) }} {{ rarity
        }}<n-icon class="ml-1"><Star /></n-icon>
      </n-tag>
    </div>
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div
        v-for="(image, index) in Array.from(outfitImages.entries())"
        :key="index"
        class="relative aspect-[2/3] rounded-lg overflow-hidden transition-all duration-300 ease-in-out"
        :class="[
          rarity === 5
            ? isDark
              ? 'bg-gradient-to-br from-[#713f12] to-[#451a03] hover:brightness-105'
              : 'bg-gradient-to-br from-[#fff8e1] to-[#ffcc80] hover:brightness-105'
            : isDark
              ? 'bg-gradient-to-br from-[#334155] to-[#1e293b] hover:brightness-105'
              : 'bg-gradient-to-br from-[#e3f2fd] to-[#bbdefb] hover:brightness-105',
        ]"
      >
        <NuxtImg
          :src="image[1]"
          :alt="`${t(`outfit.${outfitId}.name`)} ${image[0] === 0 ? 'Base' : `LV${image[0]}`}`"
          class="absolute inset-0 w-full h-full object-contain z-10"
          format="webp"
          width="300"
          height="450"
          fit="cover"
          :quality="100"
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
            :type="rarity === 5 ? 'warning' : 'info'"
          >
            {{ t(`banner.outfit.level.${image[0] === 0 ? '1' : image[0]}`) }}
            <span v-if="getOutfitLevel.includes(image[0].toString())">
              <n-icon><CheckCircle /></n-icon>
            </span>
          </n-tag>
        </div>
      </div>
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
    rarity: 4 | 5
    completionData?: CompletionData
  }>()

  const { t } = useI18n()
  const userStore = useUserStore()
  const pullStore = usePullStore()
  const isDark = computed(() => userStore.getCurrentTheme === 'dark')

  const getOutfitLevel = computed(() => {
    if (!props.completionData) return []

    const levels = []
    const totalPulls = props.completionData.totalPulls
    const manualEvoLevel = pullStore.getOutfitEvoLevel(
      props.bannerId,
      props.outfitId
    )

    if (props.rarity === 5) {
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
    images.set(0, `/images/outfits/${props.outfitId}.webp`)

    // Add level variants based on rarity
    const maxLevel = props.rarity === 5 ? 4 : 2
    for (let i = 2; i <= maxLevel; i++) {
      images.set(i, `/images/outfits/${props.outfitId}_LV${i}.webp`)
    }

    return images
  })
</script>
