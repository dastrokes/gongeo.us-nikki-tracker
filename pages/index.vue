<template>
  <div class="max-w-7xl mx-auto space-y-2 sm:space-y-4">
    <n-card
      size="small"
      class="rounded-xl p-0 sm:p-2"
      :style="cardStyle"
    >
      <div class="flex flex-col text-center">
        <n-h1 class="font-bold">
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
          size="medium"
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
          size="medium"
          @click="router.push(localePath('/global'))"
        >
          <template #icon>
            <n-icon>
              <Globe />
            </n-icon>
          </template>
          {{ $t('navigation.global') }}
        </n-button>
      </div></n-card
    >
    <n-card
      class="rounded-xl"
      size="small"
      :style="cardStyle"
    >
      <div class="flex justify-center items-center flex-col mb-4 space-y-2">
        <div class="text-2xl font-bold">
          <n-tooltip>
            <template #trigger>
              <n-button
                size="small"
                text
                @click="router.push(localePath('/banner'))"
              >
                <template #icon>
                  <n-icon>
                    <CalendarAlt />
                  </n-icon>
                </template>
              </n-button>
            </template>
            {{ $t('navigation.banner') }}
          </n-tooltip>
          {{ $t('index.current_banners') }}
        </div>
      </div>
      <div
        v-if="leftBanners.length > 0"
        class="flex flex-col sm:flex-row gap-4"
      >
        <div
          class="w-full sm:w-1/2 aspect-[2/1]"
          :class="[rightBanners.length > 0 ? '' : 'sm:mx-auto']"
        >
          <BannerCarousel
            v-model:current-index="indexA"
            :banners="leftBanners"
            :formatted-time="formattedTime"
          />
        </div>
        <div
          v-if="rightBanners.length > 0"
          class="w-full sm:w-1/2 aspect-[2/1]"
        >
          <BannerCarousel
            v-model:current-index="indexB"
            :banners="rightBanners"
            :formatted-time="formattedTime"
          />
        </div>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, watch } from 'vue'
  import { NButton } from 'naive-ui'
  import { useUserStore } from '~/stores/user'
  import { BANNER_DATA } from '~/data/banners'
  import type { Banner } from '~/types/banner'
  import { Book, Globe, CalendarAlt } from '@vicons/fa'

  const { t } = useI18n()
  const userStore = useUserStore()
  const isDark = computed(() => userStore.getCurrentTheme === 'dark')
  const { cardStyle } = useCardStyle()

  const localePath = useLocalePath()
  const router = useRouter()

  const leftBanners = [BANNER_DATA[26], BANNER_DATA[3]] as Banner[]
  const rightBanners = [BANNER_DATA[27], BANNER_DATA[28]] as Banner[]
  const targetTime = new Date('2025-07-29T20:00:00Z')

  const indexA = ref(0)
  const indexB = ref(0)

  let timer: NodeJS.Timeout | null = null
  const timeoutMs = 10000

  function startTimer() {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      indexA.value = (indexA.value + 1) % leftBanners.length
      indexB.value = (indexB.value + 1) % rightBanners.length
      startTimer() // Schedule next update
    }, timeoutMs)
  }

  // Watch for manual index changes
  watch([indexA, indexB], () => {
    startTimer()
  })

  onMounted(() => {
    startTimer()
  })

  onBeforeUnmount(() => {
    if (timer) clearTimeout(timer)
  })

  // Static time calculation
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
