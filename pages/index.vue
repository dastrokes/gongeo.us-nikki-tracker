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
          class="w-32"
          @click="router.push(localePath('/tracker'))"
        >
          {{ $t('index.your_data') }}
        </n-button>
        <n-button
          type="primary"
          size="large"
          class="w-32"
          @click="router.push(localePath('/global'))"
        >
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
        <n-tag
          round
          :bordered="false"
          size="small"
          >{{ $t('index.time_left') }} {{ formattedTime }}
          <template #icon>
            <n-icon
              size="12"
              :component="HourglassHalf"
            />
          </template>
        </n-tag>
      </div>
      <div class="flex flex-col sm:flex-row gap-4">
        <div
          v-for="banner in currentBanners"
          :key="banner.bannerId"
          class="w-full sm:w-1/2 aspect-[5/2] relative overflow-hidden rounded-lg"
        >
          <NuxtImg
            :src="imageUrl(banner.bannerId)"
            :alt="banner.bannerId.toString()"
            class="absolute inset-0 w-full h-full object-cover"
            :provider="imageProvider || undefined"
            format="webp"
            width="500"
            height="200"
            fit="cover"
            quality="100"
            loading="eager"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 75vw, 500px"
          />
        </div>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { NButton } from 'naive-ui'
  import { useUserStore } from '~/stores/user'
  import { BANNER_DATA } from '~/data/banners'
  import { HourglassHalf } from '@vicons/fa'
  import { useImageProvider } from '~/composables/useImageProvider'

  const { t } = useI18n()
  const userStore = useUserStore()
  const isDark = computed(() => userStore.getCurrentTheme === 'dark')
  const { cardStyle } = useCardStyle()
  const { imageProvider, getImageUrl } = useImageProvider()

  const localePath = useLocalePath()
  const router = useRouter()

  const currentBanners = computed(() => {
    return [BANNER_DATA[19], BANNER_DATA[20]]
  })

  const imageUrl = (bannerId: number) => {
    return getImageUrl(`/images/banners/${bannerId}.webp`)
  }

  // Static time calculation
  const targetTime = new Date('2025-06-04T20:00:00Z')
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
