<template>
  <div class="max-w-7xl mx-auto space-y-4">
    <n-card
      size="small"
      class="rounded-xl p-0 sm:p-2"
      :style="cardStyle"
    >
      <div class="flex flex-col">
        <n-h1 class="font-bold font-sans">
          {{ $t('index.title') }}
        </n-h1>
        <n-h2 class="font-bold mt-0">{{ $t('index.subtitle') }}</n-h2>
        <n-h4
          class="mt-0"
          :class="isDark ? 'text-gray-300' : 'text-gray-600'"
        >
          {{ $t('index.description') }}
        </n-h4>
      </div>
      <div class="flex gap-4 opacity-90">
        <n-button
          v-if="status === 'pending' || status === 'idle'"
          type="primary"
          size="large"
          class="w-32"
          loading
        >
          {{ $t('index.loading') }}
        </n-button>
        <n-button
          v-if="status === 'success' && hasData"
          type="primary"
          size="large"
          class="w-32"
          @click="router.push(localePath('/tracker'))"
        >
          {{ $t('index.your_data') }}
        </n-button>
        <n-button
          v-if="(status === 'success' && !hasData) || status === 'error'"
          type="primary"
          size="large"
          class="w-32"
          @click="router.push(localePath('/import'))"
        >
          {{ $t('navigation.import_data') }}
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
      <div
        class="flex flex-col sm:flex-row my-4 items-baseline space-y-4 space-x-4"
      >
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
      <div class="flex flex-col sm:flex-row gap-4 items-center">
        <div class="flex flex-col sm:flex-row gap-4 flex-grow">
          <nuxt-img
            v-for="banner in currentBanners"
            :key="banner.bannerId"
            :src="imageUrl(banner.bannerId)"
            :alt="banner.bannerName"
            class="rounded-lg w-full"
            :provider="imageProvider"
            format="webp"
            width="500"
            height="200"
            fit="cover"
            quality="80"
            loading="eager"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 500px"
          />
        </div>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
  import { NButton } from 'naive-ui'
  import { useRouter } from 'vue-router'
  import { useIndexedDB } from '~/composables/useIndexedDB'
  import { usePullStore } from '~/stores/pull'
  import { computed } from 'vue'
  import { useUserStore } from '~/stores/user'
  import { BANNER_DATA } from '~/data/banners'
  import { HourglassHalf } from '@vicons/fa'
  import { useI18n } from 'vue-i18n'

  const { t } = useI18n()
  const userStore = useUserStore()
  const isDark = computed(() => userStore.getCurrentTheme === 'dark')
  const { cardStyle } = useCardStyle()
  const pullStore = usePullStore()

  const localePath = useLocalePath()
  const router = useRouter()

  const { data, hasData, loadPullData } = useIndexedDB()

  // Use useAsyncData for client-side only data fetching
  const { status } = useAsyncData(
    'pullData',
    async () => {
      try {
        await loadPullData()
        if (data.value) {
          pullStore.processPullsData(data.value)
        }
      } catch (error) {
        console.error('Failed to load pull data:', error)
        throw error
      }
    },
    {
      server: false,
      immediate: import.meta.client,
    }
  )

  const currentBanners = computed(() => {
    return [BANNER_DATA[19], BANNER_DATA[20]]
  })

  const imageUrl = (bannerId: number) => {
    return `/images/banners/${bannerId}.webp`
  }

  const imageProvider = computed(() => {
    return process.env.NODE_ENV === 'development' ? 'ipx' : 'netlify'
  })

  const targetTime: number = new Date('2025-06-04T20:00:00Z').getTime()
  const remaining = ref<number>(targetTime - Date.now())

  const formattedTime = computed<string>(() => {
    if (remaining.value <= 0)
      return `0 ${t('index.days')}, 0 ${t('index.hours')}`

    const days = Math.floor(remaining.value / (1000 * 60 * 60 * 24))
    const hours = Math.floor(
      (remaining.value % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    )

    return `${days} ${t('index.days')} ${hours} ${t('index.hours')}`
  })

  let interval: ReturnType<typeof setInterval>

  onMounted(() => {
    interval = setInterval(() => {
      remaining.value = targetTime - Date.now()
      if (remaining.value <= 0) {
        remaining.value = 0
        clearInterval(interval)
      }
    }, 1000)
  })

  onBeforeUnmount(() => {
    clearInterval(interval)
  })
</script>
