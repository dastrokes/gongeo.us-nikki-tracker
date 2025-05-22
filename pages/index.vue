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
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="w-full sm:w-1/2">
          <n-carousel
            v-model:current-index="indexA"
            class="rounded-xl"
            dot-type="dot"
            show-arrow
            :show-dots="true"
            :loop="true"
            :transition-style="{
              transitionDuration: '1000ms',
              transitionTimingFunction: 'ease-in-out',
            }"
          >
            <n-carousel-item
              v-for="banner in fiveStarBanners"
              :key="banner.bannerId"
              class="rounded-xl aspect-[2/1]"
            >
              <n-tag
                round
                :bordered="false"
                size="small"
                class="absolute opacity-80 top-2 right-2 scale-90 sm:scale-100 origin-top-right"
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
        <div class="w-full sm:w-1/2">
          <n-carousel
            v-model:current-index="indexB"
            class="rounded-xl"
            dot-type="dot"
            show-arrow
            :show-dots="true"
            :loop="true"
            :transition-style="{
              transitionDuration: '1000ms',
              transitionTimingFunction: 'ease-in-out',
            }"
          >
            <n-carousel-item
              v-for="banner in fourStarBanners"
              :key="banner.bannerId"
              class="rounded-xl aspect-[2/1]"
            >
              <n-tag
                round
                :bordered="false"
                size="small"
                class="absolute opacity-80 top-2 right-2 scale-90 sm:scale-100 origin-top-right"
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
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, watch } from 'vue'
  import { NButton } from 'naive-ui'
  import { useUserStore } from '~/stores/user'
  import { BANNER_DATA } from '~/data/banners'
  import { HourglassHalf, Book, Globe } from '@vicons/fa'

  const { t } = useI18n()
  const userStore = useUserStore()
  const isDark = computed(() => userStore.getCurrentTheme === 'dark')
  const { cardStyle } = useCardStyle()

  const localePath = useLocalePath()
  const router = useRouter()

  const fiveStarBanners = [BANNER_DATA[20], BANNER_DATA[19]]
  const fourStarBanners = [BANNER_DATA[21], BANNER_DATA[22], BANNER_DATA[4]]

  const indexA = ref(0)
  const indexB = ref(0)

  let timer = null
  const timeoutMs = 10000

  function startTimer() {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      indexA.value = (indexA.value + 1) % fiveStarBanners.length
      indexB.value = (indexB.value + 1) % fourStarBanners.length
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
