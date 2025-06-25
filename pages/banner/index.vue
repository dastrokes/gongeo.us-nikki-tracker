<template>
  <div class="max-w-7xl mx-auto space-y-2 sm:space-y-4">
    <n-card
      size="small"
      class="rounded-xl p-0 sm:p-2"
      :style="cardStyle"
    >
      <n-timeline
        :icon-size="18"
        size="large"
      >
        <n-timeline-item
          v-for="banner in sortedBanners"
          :id="banner.bannerId.toString()"
          :key="banner.bannerId"
          :type="getBannerTypeColor(banner.bannerType)"
        >
          <template #header>
            <NuxtLink
              :to="localePath(`/banner/${banner.bannerId}`)"
              class="inline w-fit hover:opacity-95 transition-opacity"
            >
              <n-tooltip trigger="hover">
                <template #trigger>
                  <n-gradient-text
                    :size="18"
                    class="m-0 font-medium break-words"
                    :type="banner.bannerType === 2 ? 'warning' : 'info'"
                  >
                    {{ t(`banner.${banner.bannerId}.name`) }}
                  </n-gradient-text>
                </template>
                {{ t('navigation.banner_detail') }}
              </n-tooltip>
            </NuxtLink>
          </template>
          <template #default>
            <div class="grid grid-cols-1 lg:grid-cols-4 gap-2">
              <div class="lg:col-span-1 space-y-2">
                <div
                  v-for="(run, index) in banner.runs"
                  :key="index"
                  class="flex items-center gap-2"
                >
                  <n-tag
                    round
                    size="small"
                    :bordered="false"
                    >{{ t('banner.version') }}
                    {{ run.version.slice(0, -2) }}</n-tag
                  >
                  <n-text depth="3">
                    <n-time
                      :time="new Date(run.start + 'T00:00:00')"
                      type="date"
                    />
                    -
                    <n-time
                      :time="new Date(run.end + 'T00:00:00')"
                      type="date"
                    />
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
                <NuxtLink
                  :to="localePath(`/banner/${banner.bannerId}`)"
                  class="hover:opacity-95 transition-opacity"
                >
                  <div
                    class="flex flex-col items-center space-y-1 max-w-2xl mx-auto"
                  >
                    <div
                      class="w-full aspect-[2/1] min-h-[140px] sm:min-h-[330px] relative overflow-hidden rounded-lg"
                    >
                      <NuxtImg
                        :src="`/images/banners/${banner.bannerId}.webp`"
                        :alt="banner.bannerId.toString()"
                        class="absolute inset-0 w-full h-full object-cover"
                        format="webp"
                        width="500"
                        height="250"
                        fit="cover"
                        :quality="100"
                        loading="lazy"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 800px"
                      />
                    </div>
                  </div>
                </NuxtLink>
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
  import { computed, watchEffect } from 'vue'
  import { Gift, Star } from '@vicons/fa'
  import { BANNER_DATA } from '~/data/banners'
  import { useCardStyle } from '~/composables/useCardStyle'

  const { t } = useI18n()
  const { cardStyle } = useCardStyle()
  const localePath = useLocalePath()
  const siteUrl = useRuntimeConfig().public.siteUrl
  const route = useRoute()

  // Sort banners by ID in descending order (newest first)
  const sortedBanners = computed(() => {
    return Object.values(BANNER_DATA).sort((a, b) => b.bannerId - a.bannerId)
  })

  watchEffect(async () => {
    if (route.hash) {
      const bannerId = route.hash.slice(1)

      await new Promise(requestAnimationFrame)

      const element = document.getElementById(bannerId)
      if (element) {
        element.scrollIntoView({
          behavior: 'instant',
          block: 'center',
        })
      }
    }
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

  useHead({
    title: t('navigation.banner') + ' - ' + t('navigation.subtitle'),
    meta: [
      {
        name: 'description',
        content: t('meta.description.banner'),
      },
      {
        property: 'og:title',
        content: t('navigation.banner') + ' - ' + t('navigation.subtitle'),
      },
      {
        property: 'og:description',
        content: t('meta.description.banner'),
      },
      {
        property: 'twitter:title',
        content: t('navigation.banner') + ' - ' + t('navigation.subtitle'),
      },
      {
        property: 'twitter:description',
        content: t('meta.description.banner'),
      },
    ],
    link: [{ rel: 'canonical', href: `${siteUrl}${localePath('/banner')}` }],
  })
</script>
