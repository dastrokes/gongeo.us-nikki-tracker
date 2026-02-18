<template>
  <div class="max-w-7xl mx-auto space-y-2 sm:space-y-4">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-4">
      <!-- Main Title and Buttons Card -->
      <n-card
        size="small"
        class="rounded-xl p-0 sm:p-2"
      >
        <div class="flex flex-1 flex-col gap-4 items-center text-center">
          <div class="flex items-center gap-4 flex-row">
            <div
              class="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/80 p-2 shadow-sm ring-1 ring-sky-200/70 dark:bg-slate-800/80 dark:ring-slate-600/70"
            >
              <NuxtImg
                src="images/logo.webp"
                width="64"
                height="64"
                fit="cover"
                class="h-full w-full"
              />
            </div>
            <div>
              <p
                class="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600/80 dark:text-cyan-200/80"
              >
                {{ $t('meta.game_title') }}
              </p>
              <n-h2 class="m-1 text-2xl font-black leading-tight">
                {{ $t('navigation.title') }}
              </n-h2>
            </div>
          </div>
          <n-h2 class="!m-0 font-bold">
            {{ $t('navigation.subtitle') }}
          </n-h2>
          <n-h3 class="!m-0 text-gray-600 dark:text-gray-300">
            {{ $t('default.description') }}
          </n-h3>
        </div>
        <div
          class="flex gap-4 opacity-90 justify-center items-center flex-wrap mt-8"
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
      >
        <div class="text-center">
          <n-h2 class="!m-0 font-bold">
            {{ $t('meta.game_title') }} {{ $t('navigation.compendium') }}
          </n-h2>
        </div>
        <div class="flex flex-col gap-2 items-center mt-2">
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
                class="relative inline-flex items-center justify-center h-36 w-full rounded-lg border border-gray-200/70 dark:border-gray-700/70 bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 overflow-hidden"
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
                class="relative inline-flex items-center justify-center h-36 w-full rounded-lg border border-gray-200/70 dark:border-gray-700/70 bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 overflow-hidden"
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
                  class="h-36 w-full rounded-lg bg-gray-100 dark:bg-gray-800"
                />
                <div
                  class="h-36 w-full rounded-lg bg-gray-100 dark:bg-gray-800"
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
  const leftBanners = [BANNER_DATA[49], BANNER_DATA[50]] as Banner[]
  const rightBanners = [BANNER_DATA[51], BANNER_DATA[52]] as Banner[]

  const leftTargetTime = new Date('2026-03-02T20:00:00Z') // UTC
  const rightTargetTime = new Date('2026-03-02T20:00:00Z') // UTC

  const indexA = ref(0)
  const indexB = ref(0)

  let timer: NodeJS.Timeout | null = null
  let isAutoAdvancing = false
  const timeoutMs = 10000

  function startTimer() {
    if (timer) clearTimeout(timer)
    if (leftBanners.length === 0 || rightBanners.length === 0) return

    timer = setTimeout(() => {
      isAutoAdvancing = true
      try {
        indexA.value = (indexA.value + 1) % leftBanners.length
        indexB.value = (indexB.value + 1) % rightBanners.length
      } finally {
        isAutoAdvancing = false
      }

      startTimer()
    }, timeoutMs)
  }

  // Watch for manual index changes
  watch([indexA, indexB], () => {
    if (isAutoAdvancing) return
    startTimer()
  })

  onMounted(() => {
    startTimer()
  })

  onBeforeUnmount(() => {
    if (timer) clearTimeout(timer)
  })
</script>
