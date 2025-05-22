<template>
  <div class="max-w-7xl mx-auto space-y-4">
    <n-card
      size="small"
      class="rounded-xl p-0 sm:p-2"
      :style="cardStyle"
    >
      <div class="flex flex-col text-center">
        <n-h1 class="font-bold font-sans">
          {{ $t('index.title') }}
        </n-h1>
        <n-h2 class="font-bold mt-0">{{ $t('index.subtitle') }}</n-h2>
        <n-h3
          class="mt-0"
          :class="isDark ? 'text-gray-300' : 'text-gray-600'"
        >
          {{ $t('index.description') }}
        </n-h3>
      </div>
      <div class="flex gap-4 opacity-90 justify-center items-center">
        <n-button
          type="primary"
          size="large"
          class="w-36"
          @click="router.push(localePath('/tracker'))"
        >
          <template #icon>
            <n-icon>
              <Book />
            </n-icon>
          </template>
          {{ $t('index.your_data') }}
        </n-button>
        <n-button
          type="primary"
          size="large"
          class="w-36"
          @click="router.push(localePath('/global'))"
        >
          <template #icon>
            <n-icon>
              <Globe />
            </n-icon>
          </template>
          {{ $t('navigation.global_data') }}
        </n-button>
      </div></n-card
    >
    <n-card
      class="rounded-xl"
      size="small"
      :style="cardStyle"
    >
      <div class="flex justify-center items-center flex-col mb-4 space-y-2">
        <div class="text-2xl font-bold font-sans">
          {{ $t('index.current_banners') }}
        </div>
      </div>
      <div class="flex flex-col gap-4">
        <n-carousel
          class="rounded-xl"
          effect="slide"
          :slides-per-view="isMobile ? 1 : 2"
          :space-between="20"
          :show-arrow="false"
          dot-type="dot"
          :show-dots="true"
          dot-placement="left"
          :autoplay="true"
          :interval="10000"
          draggable
        >
          <n-carousel-item
            v-for="banner in allBanners"
            :key="banner.bannerId"
            class="rounded-xl aspect-[2/1]"
          >
            <n-tag
              round
              :bordered="false"
              size="small"
              class="absolute opacity-80 bottom-2 right-2 scale-90 sm:scale-100 origin-bottom-right"
              >{{ $t('index.time_left') }} {{ formattedTime }}
              <template #icon>
                <n-icon
                  size="12"
                  :component="HourglassHalf"
                />
              </template>
            </n-tag>
            <n-tag
              v-if="banner.runs.length > 1"
              round
              :bordered="false"
              size="small"
              class="absolute opacity-80 top-2 left-2 scale-90 sm:scale-100 origin-top-left"
              >{{ $t('index.rerun') }}
            </n-tag>
            <DynamicImg
              :src="`/images/banners/${banner.bannerId}.webp`"
              :alt="banner.bannerId.toString()"
              class="w-full h-full object-cover"
              format="webp"
              width="600"
              height="300"
              fit="cover"
              :quality="100"
              loading="lazy"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 600px"
            />
          </n-carousel-item>
        </n-carousel>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref, onMounted, watch } from 'vue'
  import { NButton } from 'naive-ui'
  import { useUserStore } from '~/stores/user'
  import { BANNER_DATA } from '~/data/banners'
  import { HourglassHalf, Book, Globe } from '@vicons/fa'
  import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'

  const { t } = useI18n()
  const userStore = useUserStore()
  const isDark = computed(() => userStore.getCurrentTheme === 'dark')
  const { cardStyle } = useCardStyle()

  const localePath = useLocalePath()
  const router = useRouter()

  // Initialize breakpoints
  const breakpoints = useBreakpoints(breakpointsTailwind)
  const isMobile = ref(false) // Default to false for SSR

  onMounted(() => {
    // Set up the reactive mobile detection only on client-side
    isMobile.value = !breakpoints.greater('sm').value
    watch(
      () => breakpoints.greater('sm').value,
      (isGreater) => {
        isMobile.value = !isGreater
      }
    )
  })

  const allBanners = computed(() => {
    const now = new Date()
    return Object.values(BANNER_DATA)
      .filter((banner) => {
        if (!banner || !banner.runs || banner.runs.length === 0) return false

        const currentRun = banner.runs[banner.runs.length - 1] // Get the latest run
        const startDate = new Date(currentRun.start)
        const endDate = new Date(currentRun.end)

        return now >= startDate && now <= endDate
      })
      .sort((a, b) => {
        if (a.bannerType !== b.bannerType) {
          return a.bannerType - b.bannerType
        }
        return b.bannerId - a.bannerId
      })
  })

  // Static time calculation
  const targetTime = new Date('2025-06-12T20:00:00Z')
  const now = new Date()
  const diffInHours = Math.max(
    0,
    (targetTime.getTime() - now.getTime()) / (1000 * 60 * 60)
  )
  const days = Math.floor(diffInHours / 24)
  const hours = Math.floor(diffInHours % 24)

  const formattedTime = computed(() => {
    return `${days} ${t('index.days')} ${hours} ${t('index.hours')}`
  })
</script>
