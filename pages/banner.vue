<template>
  <div class="max-w-7xl mx-auto space-y-4">
    <n-card
      size="small"
      class="rounded-xl p-0 sm:p-2"
      :style="cardStyle"
    >
      <n-timeline
        :icon-size="20"
        size="large"
      >
        <n-timeline-item
          v-for="banner in sortedBanners"
          :key="banner.bannerId"
          :type="getBannerTypeColor(banner.bannerType)"
          :title="t(`banner.${banner.bannerId}.name`)"
        >
          <template #default>
            <div class="grid grid-cols-1 lg:grid-cols-4 gap-2">
              <div class="lg:col-span-1">
                <div class="mb-2">
                  <n-text
                    depth="3"
                    class="text-sm"
                  >
                    {{ new Date(banner.runs[0].start).toLocaleDateString() }}
                    -
                    {{ new Date(banner.runs[0].end).toLocaleDateString() }}
                  </n-text>
                </div>
                <div class="inline-flex flex-col gap-2 items-start">
                  <div
                    v-for="outfitId in banner.outfit5StarId"
                    :key="outfitId"
                    class="inline-flex flex-col"
                  >
                    <n-tag
                      size="large"
                      type="warning"
                      :bordered="false"
                      round
                    >
                      <span class="align-top"
                        >{{ t(getOutfitName(outfitId)) }} 5</span
                      >
                      <span class="ml-1"
                        ><n-icon><Star /></n-icon
                      ></span>
                    </n-tag>
                  </div>
                  <div
                    v-for="outfitId in banner.outfit4StarId"
                    :key="outfitId"
                    class="inline-flex flex-col"
                  >
                    <n-tag
                      size="large"
                      type="info"
                      :bordered="false"
                      round
                    >
                      <span class="align-top"
                        >{{ t(getOutfitName(outfitId)) }} 4</span
                      >
                      <span class="ml-1"
                        ><n-icon><Star /></n-icon
                      ></span>
                    </n-tag>
                  </div>
                </div>
              </div>
              <div class="lg:col-span-3">
                <div
                  class="flex flex-col items-center space-y-1 max-w-2xl mx-auto"
                >
                  <div
                    class="w-full aspect-[5/2] min-h-[120px] sm:min-h-[200px] relative overflow-hidden rounded-lg"
                  >
                    <DynamicImg
                      :src="imageUrl(banner.bannerId)"
                      :alt="banner.bannerId.toString()"
                      class="absolute inset-0 w-full h-full object-cover"
                      :provider="imageProvider || undefined"
                      format="webp"
                      width="500"
                      height="200"
                      fit="cover"
                      :quality="100"
                      loading="lazy"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 75vw, 500px"
                    />
                  </div>
                </div>
              </div>
            </div>
          </template>
          <template #icon>
            <n-icon>
              <Gift />
            </n-icon>
          </template>
        </n-timeline-item>
      </n-timeline>
    </n-card>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { Gift, Star } from '@vicons/fa'
  import { BANNER_DATA } from '~/data/banners'
  import OUTFIT_DATA from '~/data/outfits'
  import { useCardStyle } from '~/composables/useCardStyle'
  import { useImageProvider } from '~/composables/useImageProvider'

  const { t } = useI18n()
  const { cardStyle } = useCardStyle()
  const { imageProvider, getImageUrl } = useImageProvider()
  // Sort banners by ID in descending order (newest first)
  const sortedBanners = computed(() => {
    return Object.values(BANNER_DATA).sort((a, b) => b.bannerId - a.bannerId)
  })

  // Get banner type color
  const getBannerTypeColor = (type: number) => {
    switch (type) {
      case 1:
        return 'default'
      case 2:
        return 'warning'
      case 3:
        return 'info'
      default:
        return 'default'
    }
  }

  // Get outfit name by ID
  const getOutfitName = (outfitId: string) => {
    return OUTFIT_DATA[outfitId as keyof typeof OUTFIT_DATA]?.name || outfitId
  }

  const imageUrl = (bannerId: number) => {
    return getImageUrl(`/images/banners/${bannerId}.webp`)
  }
</script>
