<template>
  <div class="container mx-auto px-4 py-8">
    <n-card
      class="rounded-xl"
      :style="cardStyle"
    >
      <n-timeline
        :icon-size="30"
        size="large"
      >
        <n-timeline-item
          v-for="banner in sortedBanners"
          :key="banner.bannerId"
          :type="getBannerTypeColor(banner.bannerType)"
          :title="banner.bannerName"
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
                <div>
                  <div class="flex flex-wrap gap-2">
                    <div
                      v-for="outfitId in banner.outfit5StarId"
                      :key="outfitId"
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
              </div>
              <div class="lg:col-span-3">
                <div
                  class="flex flex-col items-center space-y-1 min-h-[150px] sm:min-h-[180px] lg:min-h-[200px] max-w-2xl mx-auto"
                >
                  <nuxt-img
                    :src="imageUrl(banner.bannerId)"
                    :alt="banner.bannerName"
                    class="rounded-lg w-full"
                    :provider="imageProvider"
                    format="webp"
                    width="500"
                    height="200"
                    fit="cover"
                    quality="80"
                    loading="lazy"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 75vw, 500px"
                  />
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
  import { BANNER_DATA } from '~/data/banners'
  import { Gift, Star } from '@vicons/fa'
  import OUTFIT_DATA from '~/data/outfits'
  import { computed } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useCardStyle } from '~/composables/useCardStyle'

  const { t } = useI18n()

  const { cardStyle } = useCardStyle()

  // Sort banners by ID in descending order (newest first)
  const sortedBanners = computed(() => {
    return Object.values(BANNER_DATA)
      .filter((banner) => banner.bannerId !== 1) // Exclude permanent banner
      .sort((a, b) => b.bannerId - a.bannerId)
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
    return `/images/banners/${bannerId}.webp`
  }

  const imageProvider = computed(() => {
    return process.env.NODE_ENV === 'development' ? 'ipx' : 'netlify'
  })
</script>
