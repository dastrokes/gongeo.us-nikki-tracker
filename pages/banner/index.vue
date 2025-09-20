<template>
  <div class="max-w-7xl mx-auto space-y-2 sm:space-y-4">
    <n-card
      size="small"
      class="rounded-xl p-0 sm:p-2"
      content-class="!p-2 sm:p-4"
      :style="cardStyle"
    >
      <n-timeline
        :icon-size="16"
        size="large"
      >
        <n-timeline-item
          v-for="banner in sortedBanners"
          :id="banner.bannerId.toString()"
          :key="banner.bannerId"
          :type="getBannerTypeColor(banner.bannerType)"
        >
          <template #icon>
            <n-popover
              trigger="manual"
              :show="showPopover[banner.bannerId]"
              placement="bottom"
              scrollable
              content-class="!p-1"
              @clickoutside="(e) => handleClickOutside(e, banner.bannerId)"
            >
              <template #trigger>
                <n-button
                  text
                  class="popover-trigger-btn"
                  :type="getBannerTypeColor(banner.bannerType)"
                  @click.stop="togglePopover(banner.bannerId)"
                >
                  <n-icon size="20">
                    <Gift />
                  </n-icon>
                </n-button>
              </template>
              <div class="max-h-48 grid grid-cols-2 sm:grid-cols-3 gap-2 m-1">
                <div
                  v-for="b in sortedBanners"
                  :key="b.bannerId"
                  class="cursor-pointer hover:opacity-80 transition-opacity"
                  @click="handleBannerClick(b.bannerId, banner.bannerId)"
                >
                  <div class="relative w-24 h-12 rounded overflow-hidden">
                    <NuxtImg
                      :src="`/images/banners/${b.bannerId}.webp`"
                      :alt="t(`banner.${b.bannerId}.name`)"
                      class="w-full h-full object-cover"
                      format="webp"
                      width="100"
                      height="50"
                      fit="cover"
                      :quality="100"
                      loading="lazy"
                    />
                  </div>
                </div>
                <div class="h-px col-span-2 sm:col-span-3"></div>
              </div> </n-popover
          ></template>
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
              <div class="space-y-2">
                <div
                  v-for="(run, index) in banner.runs"
                  :key="index"
                  class="space-y-2"
                >
                  <div class="flex flex-col gap-1">
                    <div class="flex items-center">
                      <n-tag :bordered="false">
                        {{ t(`season.${run.version.slice(0, 3)}`) }}
                      </n-tag>
                      <n-tag
                        class="ml-1"
                        :bordered="false"
                      >
                        {{ t('banner.version') }} {{ run.version.slice(0, -2) }}
                      </n-tag>
                    </div>
                    <div>
                      <n-tag :bordered="false">
                        <template #avatar>
                          <n-icon><CalendarAlt /></n-icon>
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
                    </div>
                  </div>
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
                  <NuxtLink
                    :to="localePath(`/banner/${banner.bannerId}`)"
                    class="w-full aspect-[2/1] min-h-[140px] sm:min-h-[330px] relative overflow-hidden rounded-lg hover:opacity-95 transition-opacity"
                  >
                    <n-tooltip
                      :overlap="true"
                      placement="top-end"
                      class="!rounded-lg !m-1 cursor-pointer"
                      @click.stop.prevent="
                        router.push(localePath(`/banner/${banner.bannerId}`))
                      "
                    >
                      <template #trigger>
                        <NuxtImg
                          :src="`/images/banners/${banner.bannerId}.webp`"
                          :alt="t(`banner.${banner.bannerId}.name`)"
                          class="absolute inset-0 w-full h-full object-cover"
                          format="webp"
                          width="500"
                          height="250"
                          fit="cover"
                          :quality="100"
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
  import { Gift, Star, ExternalLinkAlt, CalendarAlt } from '@vicons/fa'
  import { BANNER_DATA } from '~/data/banners'

  const { t } = useI18n()
  const { cardStyle } = useCardStyle()
  const localePath = useLocalePath()
  const siteUrl = useRuntimeConfig().public.siteUrl
  const route = useRoute()
  const router = useRouter()

  // Sort banners by ID in descending order (newest first)
  const sortedBanners = computed(() => {
    return Object.values(BANNER_DATA).sort((a, b) => b.bannerId - a.bannerId)
  })

  // Selected banner ID for popselect
  const selectedBannerId = ref(sortedBanners.value[0]?.bannerId || 0)

  // Popover visibility state for each banner
  const showPopover = reactive<Record<number, boolean>>({})

  // Initialize showPopover for all banners
  watchEffect(() => {
    for (const banner of sortedBanners.value) {
      if (!(banner.bannerId in showPopover)) {
        showPopover[banner.bannerId] = false
      }
    }
  })

  // Helper to toggle popover for a banner
  const togglePopover = (bannerId: number) => {
    // Close all other popovers first
    for (const id in showPopover) {
      if (parseInt(id) !== bannerId) {
        showPopover[id] = false
      }
    }
    // Toggle the clicked popover
    showPopover[bannerId] = !showPopover[bannerId]
  }

  function handleClickOutside(e: MouseEvent, id: number): void {
    const target = e.target as HTMLElement | null
    if (target?.closest('.popover-trigger-btn')) return
    showPopover[id] = false
  }

  function handleBannerClick(bannerId: number, popoverId: number) {
    showPopover[popoverId] = false
    selectedBannerId.value = bannerId
  }

  // Scroll to specific banner
  const scrollToBanner = (bannerId: number) => {
    if (import.meta.client) {
      const element = document.getElementById(bannerId.toString())
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      }
    }
  }

  // Watch for selectedBannerId changes and scroll to the selected banner
  watchEffect(() => {
    if (import.meta.client && selectedBannerId.value) {
      nextTick(() => {
        scrollToBanner(selectedBannerId.value)
      })
    }
  })

  watchEffect(async () => {
    if (import.meta.client && route.hash) {
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
