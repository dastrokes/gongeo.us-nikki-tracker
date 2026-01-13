<template>
  <div class="max-w-7xl mx-auto space-y-2 sm:space-y-4">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-4">
      <!-- Main Title and Buttons Card -->
      <n-card
        size="small"
        class="rounded-xl p-0 sm:p-2 lg:col-span-2"
        content-class="!flex !flex-col"
      >
        <div class="flex flex-col text-center flex-1">
          <n-h1 class="font-bold">
            {{ $t('navigation.title') }}
          </n-h1>
          <n-h2 class="font-bold mt-0">
            {{ $t('navigation.subtitle') }}
          </n-h2>
          <n-h3 class="mt-0 text-gray-600 dark:text-gray-300">
            {{ $t('default.description') }}
          </n-h3>
        </div>
        <div
          class="flex gap-4 opacity-90 justify-center items-center flex-wrap mt-4"
        >
          <n-button
            type="primary"
            size="medium"
            @click="navigateTo(localePath('/tracker'))"
          >
            <template #icon>
              <n-icon>
                <Book />
              </n-icon>
            </template>
            {{ $t('default.your_data') }}
          </n-button>
          <n-button
            type="primary"
            size="medium"
            @click="navigateTo(localePath('/global'))"
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

      <n-card
        size="small"
        class="rounded-xl p-0 sm:p-2"
        content-class="!flex !flex-col !justify-center"
      >
        <div class="flex flex-col text-center flex-1 mt-4">
          <n-h2 class="font-bold">
            {{ $t('meta.game_title') }} {{ $t('navigation.compendium') }}
          </n-h2>
        </div>
        <div class="flex flex-col gap-2 items-center">
          <n-button-group>
            <n-button
              tertiary
              type="primary"
              size="medium"
              @click="navigateTo(localePath('/banners'))"
            >
              <template #icon>
                <n-icon>
                  <CalendarAlt />
                </n-icon>
              </template>
              {{ $t('common.banners') }}
            </n-button>
            <n-button
              tertiary
              type="primary"
              size="medium"
              @click="navigateTo(localePath('/outfits'))"
            >
              <template #icon>
                <n-icon>
                  <Tshirt />
                </n-icon>
              </template>
              {{ $t('common.outfits') }}
            </n-button>
            <n-button
              tertiary
              type="primary"
              size="medium"
              @click="navigateTo(localePath('/items'))"
            >
              <template #icon>
                <n-icon>
                  <ListAlt />
                </n-icon>
              </template>
              {{ $t('common.items') }}
            </n-button></n-button-group
          >
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
                @click="navigateTo(localePath('/banners'))"
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
          {{ $t('default.current_banners') }}
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
            :target-time="leftTargetTime"
          />
        </div>
        <div
          v-if="rightBanners.length > 0"
          class="w-full sm:w-1/2 aspect-[2/1]"
        >
          <BannerCarousel
            v-model:current-index="indexB"
            :banners="rightBanners"
            :target-time="rightTargetTime"
          />
        </div>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
  import { BANNER_DATA } from '~/data/banners'
  import type { Banner } from '~/types/banner'
  import { Book, Globe, CalendarAlt, Tshirt, ListAlt } from '@vicons/fa'

  const { t } = useI18n()
  const localePath = useLocalePath()
  const siteUrl = useRuntimeConfig().public.siteUrl

  // SEO
  useSeoMeta({
    title: () => t('meta.title'),
    description: () => t('meta.description.default'),
    ogTitle: () => t('meta.title'),
    ogDescription: () => t('meta.description.default'),
    twitterTitle: () => t('meta.title'),
    twitterDescription: () => t('meta.description.default'),
  })

  useHead(() => ({
    link: [{ rel: 'canonical', href: `${siteUrl}${localePath('/')}` }],
  }))

  // TODO: update to current banner id
  const leftBanners = [BANNER_DATA[46]] as Banner[]
  const rightBanners = [BANNER_DATA[5], BANNER_DATA[11]] as Banner[]

  const leftTargetTime = new Date('2026-01-29T20:00:00Z') // UTC
  const rightTargetTime = new Date('2026-01-19T02:00:00Z') // UTC

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
</script>
