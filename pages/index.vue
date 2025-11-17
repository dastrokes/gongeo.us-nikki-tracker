<template>
  <div class="max-w-7xl mx-auto space-y-2 sm:space-y-4">
    <div class="flex flex-col lg:flex-row gap-2 sm:gap-4">
      <!-- Main Title and Buttons Card -->
      <n-card
        size="small"
        class="rounded-xl p-0 sm:p-2 flex-1"
        content-class="!flex !flex-col"
      >
        <div class="flex flex-col text-center flex-1">
          <n-h1 class="font-bold">
            {{ $t('index.title') }}
          </n-h1>
          <n-h2 class="font-bold mt-0">{{ $t('index.subtitle') }}</n-h2>
          <n-h3 class="mt-0 text-gray-600 dark:text-gray-300">
            {{ $t('index.description') }}
          </n-h3>
        </div>
        <div
          class="flex gap-4 opacity-90 justify-center items-center flex-wrap mt-4"
        >
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
        </div>
      </n-card>

      <!-- Vote Card -->
      <n-card
        size="small"
        class="rounded-xl p-0 sm:p-2 lg:w-1/3"
        content-class="!flex !flex-col"
      >
        <div class="flex flex-col text-center flex-1">
          <n-h2 class="font-bold">
            {{ $t('navigation.vote') }}
          </n-h2>
          <n-h6 class="mt-0 text-gray-600 dark:text-gray-300">
            {{ $t('vote.description') }}
          </n-h6>
        </div>
        <div
          class="flex gap-4 opacity-90 justify-center items-center flex-wrap mt-4"
        >
          <n-button
            type="primary"
            size="medium"
            @click="router.push(localePath('/vote'))"
          >
            <template #icon>
              <n-icon>
                <Poll />
              </n-icon>
            </template>
            {{ $t('vote.vote') }}
          </n-button>
          <n-button
            type="primary"
            size="medium"
            @click="router.push(localePath('/ranking'))"
          >
            <template #icon>
              <n-icon>
                <ListOl />
              </n-icon>
            </template>
            {{ $t('vote.ranking') }}
          </n-button>
        </div>
      </n-card>
    </div>
    <n-card
      class="rounded-xl"
      size="small"
    >
      <div class="flex justify-center items-center flex-col mb-4 space-y-2">
        <div class="text-2xl font-bold">
          <n-tooltip>
            <template #trigger>
              <n-button
                size="small"
                text
                :aria-label="$t('navigation.banner')"
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
  import { BANNER_DATA } from '~/data/banners'
  import type { Banner } from '~/types/banner'
  import { Book, Globe, CalendarAlt, Poll, ListOl } from '@vicons/fa'

  const { t } = useI18n()

  const localePath = useLocalePath()
  const router = useRouter()

  // TODO: update to current banner id
  const leftBanners = [BANNER_DATA[39]] as Banner[]
  const rightBanners = [BANNER_DATA[40], BANNER_DATA[41]] as Banner[]
  const targetTime = new Date('2025-11-25T20:00:00Z') // UTC

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
