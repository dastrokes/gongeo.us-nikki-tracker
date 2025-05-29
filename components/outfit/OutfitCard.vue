<template>
  <div class="space-y-2">
    <div class="flex items-center gap-2">
      <n-tag
        size="small"
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
        v-for="(image, index) in outfitImages"
        :key="index"
        class="relative aspect-[2/3] rounded-lg overflow-hidden transition-all duration-300 ease-in-out ring-1"
        :class="[
          rarity === 5
            ? isDark
              ? 'bg-gradient-to-br from-[#713f12] to-[#451a03] hover:shadow-[0_0_15px_0_rgba(113,63,18,0.5)] ring-amber-900/30 hover:ring-amber-900/60'
              : 'bg-gradient-to-br from-[#fff8e1] to-[#ffcc80] hover:shadow-[0_0_15px_0_rgba(255,204,128,0.5)] ring-amber-200/30 hover:ring-amber-200/80'
            : isDark
              ? 'bg-gradient-to-br from-[#334155] to-[#1e293b] hover:shadow-[0_0_15px_0_rgba(51,65,85,0.5)] ring-slate-400/20 hover:ring-slate-400/40'
              : 'bg-gradient-to-br from-[#e3f2fd] to-[#bbdefb] hover:shadow-[0_0_15px_0_rgba(187,222,251,0.5)] ring-blue-200/30 hover:ring-blue-200/80',
        ]"
      >
        <DynamicImg
          :src="image"
          :alt="`${t(`outfit.${outfitId}.name`)} ${index === 0 ? 'Base' : `LV${index}`}`"
          class="absolute inset-0 w-full h-full object-contain z-10"
          format="webp"
          width="300"
          height="450"
          fit="cover"
          loading="lazy"
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
            {{ t(`banner.outfit.level.${index}`) }}
            <span
              v-if="
                completionData?.completion &&
                getOutfitLevel.includes(index.toString())
              "
            >
              <n-icon><CheckCircle /></n-icon>
            </span>
          </n-tag>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { Star, CheckCircle } from '@vicons/fa'

  interface CompletionData {
    completion: number
    totalPulls: number
  }

  const props = defineProps<{
    outfitId: string
    rarity: 4 | 5
    completionData?: CompletionData
  }>()

  const { t } = useI18n()
  const userStore = useUserStore()
  const isDark = computed(() => userStore.getCurrentTheme === 'dark')

  const getOutfitLevel = computed(() => {
    if (!props.completionData) return []

    const levels = []
    const totalPulls = props.completionData.totalPulls

    if (props.rarity === 5) {
      if (props.completionData.completion >= 1) levels.push('0')
      if (totalPulls >= 180 && props.completionData.completion >= 1)
        levels.push('2')
      if (totalPulls >= 200 && props.completionData.completion >= 1)
        levels.push('3')
      if (totalPulls >= 230 && props.completionData.completion >= 2)
        levels.push('4')
    } else {
      if (props.completionData.completion >= 1) levels.push('0')
      if (props.completionData.completion >= 2) levels.push('2')
    }

    return levels
  })

  const outfitImages = computed(() => {
    const baseImage = `/images/outfits/${props.outfitId}.webp`
    const images = [baseImage]

    // Add level variants based on rarity
    const maxLevel = props.rarity === 5 ? 4 : 2
    for (let i = 1; i <= maxLevel; i++) {
      if (i !== 1) {
        images.push(`/images/outfits/${props.outfitId}_LV${i}.webp`)
      }
    }

    return images
  })
</script>
