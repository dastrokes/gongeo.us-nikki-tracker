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
                <div
                  v-for="(run, index) in banner.runs"
                  :key="index"
                  class="mb-2 flex flex-col gap-1"
                >
                  <n-text depth="3">
                    {{ run.version.slice(0, -2) }}

                    <n-time
                      :time="new Date(run.start)"
                      type="date" />
                    -
                    <n-time
                      :time="new Date(run.end)"
                      type="date"
                  /></n-text>
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
                        >{{ t(`outfit.${outfitId}.name`) }} 5</span
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
                        >{{ t(`outfit.${outfitId}.name`) }} 4</span
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
                    class="w-full aspect-[2/1] min-h-[140px] sm:min-h-[330px] relative overflow-hidden rounded-lg"
                  >
                    <DynamicImg
                      :src="`/images/banners/${banner.bannerId}.webp`"
                      :alt="banner.bannerId.toString()"
                      class="absolute inset-0 w-full h-full object-cover"
                      format="webp"
                      width="500"
                      height="250"
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
  import { useCardStyle } from '~/composables/useCardStyle'

  const { t } = useI18n()
  const { cardStyle } = useCardStyle()

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
</script>
