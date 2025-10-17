<template>
  <div class="max-w-7xl mx-auto space-y-2 sm:space-y-4">
    <n-card
      size="small"
      class="rounded-xl p-0 sm:p-2"
      content-class="!p-2 sm:p-4"
    >
      <div class="flex flex-col sm:flex-row gap-4">
        <n-scrollbar x-scrollable>
          <div class="flex flex-row gap-2 min-w-max pb-3">
            <div
              v-for="banner in filteredBanners"
              :key="banner.bannerId"
              class="flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <n-tooltip trigger="hover">
                <template #trigger>
                  <NuxtImg
                    :src="`/images/banners/thumbnails/${banner.bannerId}.webp`"
                    :alt="t(`banner.${banner.bannerId}.name`)"
                    class="w-24 h-12 rounded-lg object-cover"
                    width="100"
                    height="50"
                    loading="lazy"
                    @click="handleBannerClick(banner.bannerId)"
                  />
                </template>
                <span>{{ t(`banner.${banner.bannerId}.name`) }}</span>
              </n-tooltip>
            </div>
          </div>
        </n-scrollbar>

        <div class="flex justify-end items-center gap-2">
          <!-- Banner filters -->
          <n-button-group>
            <n-button
              :type="bannerTypeFilter.show5Star ? 'warning' : 'default'"
              size="small"
              @click="toggleBannerTypeFilter(5)"
            >
              <span class="align-top">5</span>
              <span class="ml-1"
                ><n-icon><Star /></n-icon
              ></span>
            </n-button>
            <n-button
              :type="bannerTypeFilter.show4Star ? 'info' : 'default'"
              size="small"
              @click="toggleBannerTypeFilter(4)"
            >
              <span class="align-top">4</span>
              <span class="ml-1"
                ><n-icon><Star /></n-icon
              ></span>
            </n-button>
          </n-button-group>

          <!-- Sort button -->
          <n-button
            size="small"
            @click="toggleSortOrder"
          >
            <template #icon>
              <n-icon size="16">
                <ArrowUp v-if="sortOrder === 'newest'" />
                <ArrowDown v-else />
              </n-icon>
            </template>
          </n-button>
        </div>
      </div>
    </n-card>

    <n-card
      size="small"
      class="rounded-xl p-0 sm:p-2"
      content-class="!p-2 sm:p-4"
    >
      <n-timeline
        :icon-size="16"
        size="large"
      >
        <n-timeline-item
          v-for="banner in filteredBanners"
          :id="banner.bannerId.toString()"
          :key="banner.bannerId"
          :type="getBannerTypeColor(banner.bannerType)"
        >
          <template #icon>
            <n-button
              text
              :type="getBannerTypeColor(banner.bannerType)"
            >
              <n-icon size="20">
                <Gift />
              </n-icon>
            </n-button>
          </template>
          <template #header>
            <NuxtLink
              no-prefetch
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
              <div class="space-y-2">
                <div
                  v-for="(run, index) in banner.runs"
                  :key="index"
                  class="space-y-2"
                >
                  <div class="flex flex-col gap-1">
                    <div class="flex items-center">
                      <n-tag :bordered="false">
                        {{ t(`season.${getVersion(run.version)}`) }}
                      </n-tag>
                      <n-tag
                        class="ml-1"
                        :bordered="false"
                      >
                        {{ t('banner.version') }}
                        {{ getVersion(run.version) }}
                      </n-tag>
                    </div>
                    <div class="flex items-center gap-1">
                      <n-tag :bordered="false">
                        <template #avatar>
                          <n-icon><CalendarDay /></n-icon>
                        </template>
                        <n-time
                          :time="new Date(run.start + 'T00:00:00')"
                          type="date"
                        />
                        -
                        <n-time
                          :time="new Date(run.end + 'T00:00:00')"
                          type="date"
                        />
                      </n-tag>
                      <n-tag
                        v-if="index > 0"
                        :bordered="false"
                      >
                        {{ t('index.rerun') }}
                      </n-tag>
                    </div>
                  </div>
                </div>
                <n-divider />
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
                  <NuxtLink
                    no-prefetch
                    :to="localePath(`/banner/${banner.bannerId}`)"
                    class="w-full aspect-[2/1] min-h-[140px] sm:min-h-[330px] relative overflow-hidden rounded-lg hover:opacity-95 transition-opacity"
                  >
                    <n-tooltip
                      overlap
                      placement="top-end"
                      class="!rounded-lg !m-1 cursor-pointer"
                      :z-index="10"
                      @click.stop.prevent="
                        router.push(localePath(`/banner/${banner.bannerId}`))
                      "
                    >
                      <template #trigger>
                        <NuxtImg
                          :src="`/images/banners/${banner.bannerId}.webp`"
                          :alt="t(`banner.${banner.bannerId}.name`)"
                          class="absolute inset-0 w-full h-full object-cover"
                          width="1000"
                          height="500"
                          loading="lazy"
                          sizes="400px sm:800px"
                        />
                      </template>
                      <span class="inline-flex items-center gap-2">
                        {{ t('navigation.banner_detail') }}
                        <n-icon><ExternalLinkAlt /></n-icon>
                      </span>
                    </n-tooltip>
                  </NuxtLink>
                </div>
              </div>
            </div>
          </template>
        </n-timeline-item>
      </n-timeline>
    </n-card>
  </div>
</template>

<script setup lang="ts">
  import {
    Gift,
    Star,
    ExternalLinkAlt,
    CalendarDay,
    ArrowUp,
    ArrowDown,
  } from '@vicons/fa'
  import { BANNER_DATA } from '~/data/banners'

  const { t } = useI18n()

  const localePath = useLocalePath()
  const siteUrl = useRuntimeConfig().public.siteUrl
  const route = useRoute()
  const router = useRouter()

  const bannerTypeFilter = ref({
    show5Star: true,
    show4Star: true,
  })
  const sortOrder = ref<string>('newest')
  const showBannerSelector = ref(false)
  // Sort banners based on selected order
  const sortedBanners = computed(() => {
    const banners = Object.values(BANNER_DATA)

    if (sortOrder.value === 'oldest') {
      return banners.sort((a, b) => a.bannerId - b.bannerId)
    } else {
      // newest (default)
      return banners.sort((a, b) => b.bannerId - a.bannerId)
    }
  })

  // Selected banner ID for popselect
  const selectedBannerId = ref(0)

  // Toggle banner type filter
  const toggleBannerTypeFilter = (starType: number) => {
    if (starType === 5) {
      // Prevent turning off 5★ if 4★ is already off
      if (
        !bannerTypeFilter.value.show5Star ||
        bannerTypeFilter.value.show4Star
      ) {
        bannerTypeFilter.value.show5Star = !bannerTypeFilter.value.show5Star
      }
    } else if (starType === 4) {
      // Prevent turning off 4★ if 5★ is already off
      if (
        !bannerTypeFilter.value.show4Star ||
        bannerTypeFilter.value.show5Star
      ) {
        bannerTypeFilter.value.show4Star = !bannerTypeFilter.value.show4Star
      }
    }
  }

  // Toggle sort order
  const toggleSortOrder = () => {
    sortOrder.value = sortOrder.value === 'newest' ? 'oldest' : 'newest'
  }

  // Filtered banners based on active filters
  const filteredBanners = computed(() => {
    let banners = sortedBanners.value

    // Filter by banner type based on toggle states
    banners = banners.filter((banner) => {
      const is5Star = banner.bannerType === 1 || banner.bannerType === 2 // permanent and limited 5★
      const is4Star = banner.bannerType === 3 // limited 4★

      // Show banner if its type is enabled
      if (is5Star && bannerTypeFilter.value.show5Star) return true
      if (is4Star && bannerTypeFilter.value.show4Star) return true

      return false
    })

    return banners
  })

  function handleBannerClick(bannerId: number) {
    showBannerSelector.value = false
    selectedBannerId.value = bannerId
  }

  type ScrollWait = 'none' | 'next-tick' | 'frame'
  interface ScrollOptions {
    behavior?: ScrollBehavior
    wait?: ScrollWait
  }

  const scrollToBanner = async (
    bannerId: number,
    { behavior = 'smooth', wait = 'none' }: ScrollOptions = {}
  ) => {
    if (!import.meta.client) return

    if (wait === 'next-tick') {
      await nextTick()
    } else if (wait === 'frame') {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve())
      })
    }

    const element = document.getElementById(bannerId.toString())
    if (!element) return

    element.scrollIntoView({
      behavior,
      block: 'center',
    })
  }

  watch(selectedBannerId, async (bannerId) => {
    if (!bannerId) return
    await scrollToBanner(bannerId, {
      behavior: 'smooth',
      wait: 'next-tick',
    })
  })

  watch(
    () => route.hash,
    async (hash: string | null) => {
      if (!hash) return
      const bannerId = Number(hash.slice(1))
      if (isNaN(bannerId)) return
      await scrollToBanner(bannerId, {
        behavior: 'instant',
        wait: 'frame',
      })
    },
    { immediate: true }
  )

  const getVersion = (version: string) => {
    // Extract major.minor version for season lookup (e.g., "1.10" from "1.10.1")
    const parts = version.split('.')
    return parts.length >= 2 ? `${parts[0]}.${parts[1]}` : version
  }

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

  useHead(() => ({
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
        name: 'twitter:title',
        content: t('navigation.banner') + ' - ' + t('navigation.subtitle'),
      },
      {
        name: 'twitter:description',
        content: t('meta.description.banner'),
      },
    ],
    link: [{ rel: 'canonical', href: `${siteUrl}${localePath('/banner')}` }],
    script: [
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'ItemPage',
          name: t('navigation.banner') + ' - ' + t('navigation.subtitle'),
          description: t('meta.description.banner'),
          url: `${siteUrl}${localePath(`/banner`)}`,
        }),
      },
    ],
  }))
</script>
