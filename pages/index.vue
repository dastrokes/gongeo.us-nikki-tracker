<template>
  <div class="max-w-7xl mx-auto space-y-2 sm:space-y-4">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-4">
      <!-- Main Title and Buttons Card -->
      <n-card
        size="small"
        class="rounded-xl p-0 sm:p-2 lg:col-span-1"
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
        <div class="flex flex-col text-center flex-1 mt-2">
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
            </n-button>
          </n-button-group>
        </div>
        <div class="flex justify-center mt-4">
          <ClientOnly>
            <div class="grid grid-cols-2 gap-2 w-full">
              <div
                class="relative inline-flex items-center justify-center h-[clamp(96px,18vh,140px)] w-full rounded-lg border border-gray-200/70 dark:border-gray-700/70 bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 overflow-hidden"
              >
                <div
                  class="h-full rounded-md backdrop-blur-[1px] p-2 flex flex-col gap-1"
                >
                  <div
                    v-for="(row, rowIndex) in tierPreviewRows"
                    :key="`tier-preview-row-${rowIndex}`"
                    class="flex items-center gap-1"
                  >
                    <div class="flex-1 flex gap-1">
                      <div
                        v-for="(chipClass, chipIndex) in row"
                        :key="`tier-preview-chip-${rowIndex}-${chipIndex}`"
                        class="h-3 w-3 shrink-0 rounded-[3px]"
                        :class="chipClass"
                      ></div>
                    </div>
                  </div>
                </div>
                <div class="absolute bottom-2 left-2 right-2">
                  <n-button
                    tertiary
                    type="primary"
                    size="small"
                    class="shadow-sm !w-full"
                    @click="navigateTo(localePath('/tierlist'))"
                  >
                    <template #icon>
                      <n-icon>
                        <SortAmountDown />
                      </n-icon>
                    </template>
                    {{ $t('navigation.tierlist') }}
                  </n-button>
                </div>
              </div>
              <div
                class="relative inline-flex items-center justify-center h-[clamp(96px,18vh,140px)] w-full rounded-lg border border-gray-200/70 dark:border-gray-700/70 bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 overflow-hidden"
              >
                <div class="h-full aspect-[2/3]">
                  <NuxtImg
                    :src="getImageSrc('outfit', featuredOutfitId)"
                    width="160"
                    height="240"
                    fit="cover"
                    preset="tallSm"
                    class="h-full w-full max-w-full"
                    :style="silhouetteStyle"
                  />
                </div>
                <div class="absolute bottom-2 left-2 right-2">
                  <n-button
                    tertiary
                    type="primary"
                    size="small"
                    class="shadow-sm !w-full"
                    @click="navigateTo(localePath('/quiz'))"
                  >
                    <template #icon>
                      <n-icon>
                        <QuestionCircle />
                      </n-icon>
                    </template>
                    {{ $t('quiz.title') }}
                  </n-button>
                </div>
              </div>
            </div>
            <template #fallback>
              <div class="grid grid-cols-2 gap-2 w-full">
                <div
                  class="h-[clamp(96px,18vh,140px)] w-full rounded-lg bg-gray-100 dark:bg-gray-800"
                />
                <div
                  class="h-[clamp(96px,18vh,140px)] w-full rounded-lg bg-gray-100 dark:bg-gray-800"
                />
              </div>
            </template>
          </ClientOnly>
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
  import {
    Book,
    Globe,
    CalendarAlt,
    Tshirt,
    ListAlt,
    QuestionCircle,
    SortAmountDown,
  } from '@vicons/fa'
  import OUTFIT_DATA, { type OutfitKey } from '~/data/outfits'

  const { t } = useI18n()
  const { getImageSrc } = imageProvider()
  const { isDark } = useTheme()
  const localePath = useLocalePath()
  const outfitKeys = Object.keys(OUTFIT_DATA) as OutfitKey[]
  const featuredOutfitId = ref<OutfitKey>(outfitKeys[0] ?? '10001')

  onMounted(() => {
    if (outfitKeys.length === 0) return
    const index = Math.floor(Math.random() * outfitKeys.length)
    featuredOutfitId.value = outfitKeys[index] ?? '10001'
  })

  const silhouetteStyle = computed(() => {
    const glow = isDark.value
      ? 'drop-shadow(0 0 10px rgba(255,255,255,0.28)) drop-shadow(0 0 16px rgba(255,255,255,0.16))'
      : 'drop-shadow(0 0 8px rgba(0,0,0,0.32)) drop-shadow(0 0 14px rgba(0,0,0,0.18))'
    return {
      filter: `brightness(0) saturate(100%) ${glow}`,
    }
  })

  const tierPreviewRows = [
    [
      'bg-red-500/90',
      'bg-red-500/80',
      'bg-red-500/70',
      'bg-red-500/60',
      'bg-red-500/50',
    ],
    [
      'bg-orange-500/90',
      'bg-orange-500/80',
      'bg-orange-500/70',
      'bg-orange-500/60',
      'bg-orange-500/50',
      'bg-orange-500/40',
    ],
    [
      'bg-yellow-500/90',
      'bg-yellow-500/80',
      'bg-yellow-500/70',
      'bg-yellow-500/60',
      'bg-yellow-500/50',
      'bg-yellow-500/40',
      'bg-yellow-500/30',
    ],
    [
      'bg-emerald-500/90',
      'bg-emerald-500/80',
      'bg-emerald-500/70',
      'bg-emerald-500/60',
      'bg-emerald-500/50',
      'bg-emerald-500/40',
    ],
    [
      'bg-cyan-500/90',
      'bg-cyan-500/80',
      'bg-cyan-500/70',
      'bg-cyan-500/60',
      'bg-cyan-500/50',
    ],
    [
      'bg-gray-500/90',
      'bg-gray-500/80',
      'bg-gray-500/70',
      'bg-gray-500/60',
      'bg-gray-500/50',
      'bg-gray-500/40',
    ],
  ] as const

  // SEO
  useSeoMeta({
    title: () => t('meta.title'),
    description: () => t('meta.description.default'),
    ogTitle: () => t('meta.title'),
    ogDescription: () => t('meta.description.default'),
    twitterTitle: () => t('meta.title'),
    twitterDescription: () => t('meta.description.default'),
  })

  // TODO: update to current banner id
  const leftBanners = [BANNER_DATA[49]] as Banner[]
  const rightBanners = [BANNER_DATA[50]] as Banner[]

  const leftTargetTime = new Date('2026-03-02T20:00:00Z') // UTC
  const rightTargetTime = new Date('2026-03-02T20:00:00Z') // UTC

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
