<template>
  <div class="landing-page max-w-7xl mx-auto space-y-4 sm:space-y-8">
    <!-- ═══ Hero Section ═══ -->
    <section class="hero-section relative text-center py-4 sm:py-8">
      <div class="flex items-center gap-4 flex-row justify-center mb-4">
        <button
          type="button"
          :aria-label="$t('navigation.title')"
          class="group flex h-12 w-12 shrink-0 cursor-help shadow-md ring-1 ring-purple-200/50 dark:ring-purple-800/20 items-center justify-center rounded-2xl bg-white/60 p-2 backdrop-blur-xs transition-all duration-300 hover:-translate-y-0.5 active:scale-95 sm:h-16 sm:w-16 dark:bg-slate-800/60 dark:shadow-[0_4px_10px_rgba(0,0,0,0.3)]"
          @click="handleHeroLogoClick"
        >
          <NuxtImg
            src="images/logo.webp"
            preset="iconSm"
            fit="cover"
            loading="eager"
            fetchpriority="high"
            class="h-full w-full transition-transform duration-300 group-hover:scale-105"
            :style="heroLogoStyle"
          />
        </button>
        <div class="text-left">
          <p
            class="text-xs font-semibold uppercase tracking-widest text-rose-500/80 dark:text-rose-300/80"
          >
            {{ $t('meta.game_title') }}
          </p>
          <p class="text-2xl sm:text-3xl font-black leading-tight">
            {{ $t('navigation.title') }}
          </p>
        </div>
      </div>
      <h1
        class="text-2xl sm:text-4xl font-extrabold pb-4 whitespace-pre-line bg-linear-to-r from-[#c084fc] via-[#f472b6] to-[#fb923c] bg-clip-text text-transparent dark:from-[#a78bfa] dark:via-[#f9a8d4] dark:to-[#fdba74]"
      >
        {{ $t('navigation.subtitle') }}
      </h1>
      <p
        class="text-gray-600 dark:text-gray-300 text-base sm:text-lg max-w-xl mx-auto mb-6"
      >
        {{ $t('default.description') }}
      </p>
      <div class="flex gap-4 justify-center items-center flex-wrap">
        <n-button
          type="primary"
          size="large"
          round
          strong
          class="shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all relative overflow-hidden after:content-[''] after:absolute after:inset-y-0 after:-left-full after:w-[60%] after:bg-linear-to-r after:from-transparent after:via-white/15 after:to-transparent after:animate-button-shimmer motion-reduce:after:animate-none"
          @click="navigateTo(localePath('/tracker'))"
        >
          <template #icon>
            <n-icon><Book /></n-icon>
          </template>
          {{ $t('default.your_data') }}
        </n-button>
        <n-button
          type="primary"
          size="large"
          round
          strong
          class="shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all relative overflow-hidden after:content-[''] after:absolute after:inset-y-0 after:-left-full after:w-[60%] after:bg-linear-to-r after:from-transparent after:via-white/15 after:to-transparent after:animate-button-shimmer motion-reduce:after:animate-none"
          @click="navigateTo(localePath('/global'))"
        >
          <template #icon>
            <n-icon><Globe /></n-icon>
          </template>
          {{ $t('navigation.global') }}
        </n-button>
      </div>
      <div class="mt-6 flex max-w-full flex-wrap justify-center gap-2">
        <button
          type="button"
          class="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/45 bg-white/55 px-3 py-1 text-xs font-semibold text-slate-700 shadow-xs backdrop-blur-md transform-all duration-200 hover:-translate-y-0.5 hover:bg-white/70 hover:shadow-md dark:border-white/10 dark:bg-slate-950/35 dark:text-slate-100 dark:hover:bg-slate-900/50"
          @click="scrollToSection(bannersSectionRef)"
        >
          <n-icon><CalendarAlt /></n-icon>
          {{ $t('default.current_banners') }}
        </button>
        <button
          type="button"
          class="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/45 bg-white/55 px-3 py-1 text-xs font-semibold text-slate-700 shadow-xs backdrop-blur-md transform-all duration-200 hover:-translate-y-0.5 hover:bg-white/70 hover:shadow-md dark:border-white/10 dark:bg-slate-950/35 dark:text-slate-100 dark:hover:bg-slate-900/50"
          @click="scrollToSection(compendiumSectionRef)"
        >
          <n-icon><ListAlt /></n-icon>
          {{ $t('navigation.compendium') }}
        </button>
        <button
          type="button"
          class="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/45 bg-white/55 px-3 py-1 text-xs font-semibold text-slate-700 shadow-xs backdrop-blur-md transform-all duration-200 hover:-translate-y-0.5 hover:bg-white/70 hover:shadow-md dark:border-white/10 dark:bg-slate-950/35 dark:text-slate-100 dark:hover:bg-slate-900/50"
          @click="scrollToSection(statsSectionRef)"
        >
          <n-icon><Globe /></n-icon>
          {{ $t('default.community_stats') }}
        </button>
      </div>

      <n-modal
        :show="showGongeousEasterEgg"
        class="w-full max-w-sm mx-auto pointer-events-auto"
        :mask-closable="true"
        :auto-focus="false"
        @update:show="handleGongeousModalShow"
      >
        <GongeousCard />
      </n-modal>
    </section>

    <!-- ═══ Current Banners ═══ -->
    <section
      ref="bannersSectionRef"
      class="animate-fade-in-up scroll-mt-16 motion-reduce:animate-none"
      style="animation-delay: 0.24s"
    >
      <n-card
        size="small"
        class="rounded-xl p-0 sm:p-2"
      >
        <div class="text-center mb-4">
          <n-h2 class="m-0 font-bold">
            {{ $t('default.current_banners') }}
          </n-h2>
        </div>
        <div
          v-if="bannerGroups.length > 0"
          class="flex flex-col sm:flex-row gap-4"
        >
          <div
            v-for="group in bannerGroups"
            :key="group.key"
            class="w-full sm:w-1/2 aspect-2/1"
            :class="bannerGroups.length === 1 ? 'sm:mx-auto' : ''"
          >
            <BannerCarousel
              :banners="group.banners"
              :target-time="group.targetTime"
            />
          </div>
        </div>
      </n-card>
    </section>
    <!-- ═══ Compendium Section ═══ -->
    <section
      ref="compendiumSectionRef"
      class="animate-fade-in-up scroll-mt-16 motion-reduce:animate-none"
      style="animation-delay: 0.48s"
    >
      <n-card
        size="small"
        class="rounded-xl p-0 sm:p-2"
      >
        <div class="text-center mb-4">
          <n-h2 class="m-0 font-bold">
            {{ $t('navigation.compendium') }}
          </n-h2>
        </div>

        <!-- Compendium Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <button
            v-for="item in compendiumItems"
            :key="item.key"
            class="flex flex-col items-center justify-center p-6 rounded-xl bg-linear-to-br from-[#e8ddf9]/30 to-[#fce4ec]/30 border border-black/4 cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(244,63,94,0.1)] group dark:from-[#1e1b4b]/40 dark:to-[#581c64]/30 dark:border-white/5 dark:hover:shadow-[0_6px_20px_rgba(168,85,247,0.12)]"
            @click="navigateTo(localePath(item.path))"
          >
            <n-icon
              :size="28"
              class="mb-2 text-rose-500 dark:text-rose-400 group-hover:scale-110 transition-transform"
            >
              <component :is="item.icon" />
            </n-icon>
            <span class="text-sm font-semibold">{{ $t(item.label) }}</span>
          </button>
        </div>

        <!-- Tier List & Quiz Row -->
        <div class="grid grid-cols-2 gap-3">
          <!-- Tier List Preview -->
          <NuxtLinkLocale
            no-prefetch
            class="relative flex items-center justify-center h-36 w-full rounded-lg border border-gray-200/70 dark:border-gray-700/70 bg-linear-to-b from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 overflow-hidden cursor-pointer group"
            :to="'/tierlist'"
          >
            <div
              class="h-full rounded-md backdrop-blur-[1px] p-2 flex flex-col gap-1.5"
            >
              <div
                v-for="(row, rowIndex) in tierPreviewRows"
                :key="`tier-preview-row-${rowIndex}`"
                class="flex items-center"
              >
                <div class="flex-1 flex gap-1.5">
                  <div
                    v-for="(chipClass, chipIndex) in row"
                    :key="`tier-preview-chip-${rowIndex}-${chipIndex}`"
                    class="h-4 w-4 shrink-0 rounded-[3px]"
                    :class="chipClass"
                  />
                </div>
              </div>
            </div>
            <div class="absolute bottom-2 left-2 right-2">
              <div
                class="flex w-full items-center justify-center gap-1 rounded-md border border-white/60 bg-white/80 px-3 py-1.5 text-sm font-medium text-rose-500 shadow-xs backdrop-blur-xs pointer-events-none dark:border-white/10 dark:bg-slate-900/70 dark:text-rose-300"
              >
                <n-icon><SortAmountDown /></n-icon>
                <span>{{ $t('navigation.tierlist') }}</span>
              </div>
            </div>
          </NuxtLinkLocale>

          <!-- Outfit Silhouette Quiz -->
          <NuxtLinkLocale
            no-prefetch
            class="relative flex items-center justify-center h-36 w-full rounded-lg border border-gray-200/70 dark:border-gray-700/70 bg-linear-to-b from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 overflow-hidden cursor-pointer group"
            :to="'/quiz'"
          >
            <div class="h-full aspect-2/3 shrink-0 p-1">
              <NuxtImg
                :src="getImageSrc('outfit', featuredOutfitId)"
                preset="tallSm"
                quality="1"
                fit="cover"
                loading="lazy"
                class="h-full w-full max-w-full object-cover"
                :style="silhouetteStyle"
              />
            </div>
            <div class="absolute bottom-2 left-2 right-2">
              <div
                class="flex w-full items-center justify-center gap-1 rounded-md border border-white/60 bg-white/80 px-3 py-1.5 text-sm font-medium text-rose-500 shadow-xs backdrop-blur-xs pointer-events-none dark:border-white/10 dark:bg-slate-900/70 dark:text-rose-300"
              >
                <n-icon><PuzzlePiece /></n-icon>
                <span>{{ $t('quiz.title') }}</span>
              </div>
            </div>
          </NuxtLinkLocale>
        </div>
      </n-card>
    </section>

    <!-- ═══ Community Stats ═══ -->
    <section
      ref="statsSectionRef"
      class="animate-fade-in-up scroll-mt-16 motion-reduce:animate-none"
      style="animation-delay: 0.96s"
    >
      <n-card
        size="small"
        class="rounded-xl p-0 sm:p-2"
      >
        <div class="text-center mb-4">
          <n-h2 class="m-0 font-bold">
            {{ $t('default.community_stats') }}
          </n-h2>
        </div>
        <div
          class="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)]"
        >
          <div class="flex flex-col gap-3">
            <div class="grid grid-cols-2 gap-3 text-center lg:grid-cols-1">
              <div class="p-3 rounded-xl bg-[#e8ddf9]/15 dark:bg-[#1e1b4b]/25">
                <div class="text-sm text-gray-400 mb-1">
                  {{ $t('common.stats.total_pulls') }}
                </div>
                <div
                  class="text-xl sm:text-2xl font-bold tabular-nums min-h-7 sm:min-h-8"
                >
                  <n-number-animation
                    v-if="globalStats"
                    show-separator
                    :from="0"
                    :to="globalStats.pulls ?? 0"
                    :duration="5000"
                  />
                  <n-skeleton
                    v-else-if="globalStatsStatus !== 'error'"
                    text
                    round
                    class="w-24 sm:w-32 mx-auto"
                  />
                  <span v-else>—</span>
                </div>
              </div>
              <div class="p-3 rounded-xl bg-[#e8ddf9]/15 dark:bg-[#1e1b4b]/25">
                <div class="text-sm text-gray-400 mb-1">
                  {{ $t('global.stats.unique_users') }}
                </div>
                <div
                  class="text-xl sm:text-2xl font-bold tabular-nums min-h-7 sm:min-h-8"
                >
                  <n-number-animation
                    v-if="globalStats"
                    show-separator
                    :from="0"
                    :to="globalStats.users ?? 0"
                    :duration="3000"
                  />
                  <n-skeleton
                    v-else-if="globalStatsStatus !== 'error'"
                    text
                    round
                    class="w-16 sm:w-20 mx-auto"
                  />
                  <span v-else>—</span>
                </div>
              </div>
            </div>
            <div class="flex justify-center">
              <n-button
                type="primary"
                quaternary
                size="medium"
                class="min-w-40"
                @click="navigateTo(localePath('/global'))"
              >
                {{ $t('default.view_all_stats') }} →
              </n-button>
            </div>
          </div>
          <div
            class="rounded-xl bg-[#e8ddf9]/15 p-2 lg:p-4 dark:bg-[#1e1b4b]/25"
          >
            <div
              v-if="globalStats"
              :style="{ height: communityFirstItemChartHeight }"
            >
              <VChart
                :option="communityFirstItemChartOption"
                autoresize
              />
            </div>
            <div
              v-else-if="globalStatsStatus !== 'error'"
              :style="{ height: communityFirstItemChartHeight }"
              class="flex flex-col justify-end"
            >
              <div class="grid flex-1 grid-cols-10 items-end gap-4 lg:gap-8">
                <div
                  v-for="(height, index) in communityFirstItemSkeletonHeights"
                  :key="`community-first-item-skeleton-bar-${index}`"
                  class="flex min-w-0 items-end"
                  :style="{ height: `${height}%` }"
                >
                  <n-skeleton class="h-full w-full rounded-md" />
                </div>
              </div>
            </div>
            <div
              v-else
              class="flex h-40 items-center justify-center text-xl text-gray-400"
            >
              —
            </div>
          </div>
        </div>
      </n-card>
    </section>
  </div>
</template>

<script setup lang="ts">
  import { breakpointsTailwind } from '@vueuse/core'
  import { BANNER_DATA } from '~~/data/banners'
  import { CURRENT_BANNER_GROUPS } from '~~/data/config'
  import OUTFIT_DATA, { type OutfitKey } from '~~/data/outfits'
  import {
    Book,
    Globe,
    CalendarAlt,
    AlignRight,
    Tshirt,
    ListAlt,
    PuzzlePiece,
    SortAmountDown,
  } from '@vicons/fa'

  const { t } = useI18n()
  const { getImageSrc } = imageProvider()
  const nuxtImg = useImage()
  const { isDark } = useTheme()
  const palette = usePalette()
  const themeVars = useThemeVars()
  const breakpoints = useBreakpoints(breakpointsTailwind)
  const localePath = useLocalePath()
  const bannersSectionRef = ref<HTMLElement | null>(null)
  const compendiumSectionRef = ref<HTMLElement | null>(null)
  const statsSectionRef = ref<HTMLElement | null>(null)
  const heroLogoColorStep = ref(0)
  const heroLogoClickStreak = ref(0)
  const showGongeousEasterEgg = ref(false)

  const heroLogoHueSteps = [0, 90, 180, 270] as const

  const heroLogoStyle = computed(() => {
    const hue = heroLogoHueSteps[heroLogoColorStep.value]

    return {
      filter: `hue-rotate(${hue}deg) saturate(${hue === 0 ? 1 : 1.45})`,
    }
  })

  const showGongeous = () => {
    showGongeousEasterEgg.value = true
  }

  const handleGongeousModalShow = (value: boolean) => {
    showGongeousEasterEgg.value = value
  }

  const handleHeroLogoClick = () => {
    const nextClickStreak = (heroLogoClickStreak.value + 1) % 5
    const nextColorStep =
      nextClickStreak === 0
        ? 0
        : (heroLogoColorStep.value + 1) % heroLogoHueSteps.length

    heroLogoColorStep.value = nextColorStep
    heroLogoClickStreak.value = nextClickStreak

    if (nextClickStreak === 0) {
      showGongeous()
    }
  }

  const scrollToSection = (sectionElement: HTMLElement | null) => {
    if (!import.meta.client || !sectionElement) return

    sectionElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  const chartTooltipExtraCssText = computed(
    () => `box-shadow: ${themeVars.value.boxShadow2}; border-radius: 8px;`
  )

  const getChartTextStyle = () => {
    return {
      fontFamily:
        "'Outfit', ui-sans-serif, system-ui, sans-serif, 'Noto Color Emoji', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'",
      color: isDark.value ? palette.textDark : palette.textLight,
    }
  }

  // ── Compendium items ───────────────────────────
  const compendiumItems = [
    {
      key: 'banners',
      path: '/banners',
      icon: CalendarAlt,
      label: 'common.banners',
    },
    { key: 'outfits', path: '/outfits', icon: Tshirt, label: 'common.outfits' },
    { key: 'items', path: '/items', icon: ListAlt, label: 'common.items' },
    {
      key: 'timeline',
      path: '/timeline',
      icon: AlignRight,
      label: 'navigation.timeline',
    },
  ] as const

  // ── Current banners ────────────────────────────
  interface BannerGroup {
    key: string
    banners: Banner[]
    targetTime: Date
  }

  const createBannerGroup = (
    key: string,
    bannerIds: number[],
    targetTime: string
  ): BannerGroup => ({
    key,
    banners: bannerIds
      .map((bannerId) => BANNER_DATA[bannerId])
      .filter((banner): banner is Banner => Boolean(banner)),
    targetTime: new Date(targetTime),
  })

  const bannerGroups: BannerGroup[] = CURRENT_BANNER_GROUPS.map((group) =>
    createBannerGroup(group.key, group.bannerIds, group.targetTime)
  ).filter((group) => group.banners.length > 0)

  const currentBanners = bannerGroups.flatMap((group) => group.banners)
  const newCurrentBanners = currentBanners.filter(
    (banner) => banner.runs.length === 1
  )
  const featuredCurrentBanners =
    newCurrentBanners.length > 0 ? newCurrentBanners : currentBanners

  // ── Outfit silhouette ──────────────────────────
  const outfitKeys = featuredCurrentBanners.flatMap((banner) => [
    ...banner.outfit5StarId,
    ...banner.outfit4StarId,
  ]) as OutfitKey[]

  const featuredOutfitId = useState<OutfitKey>(
    'landing-featured-outfit-id',
    () => {
      const index = Math.floor(Math.random() * outfitKeys.length)
      return outfitKeys[index] as OutfitKey
    }
  )

  const silhouetteStyle = computed(() => {
    const glow = isDark.value
      ? 'drop-shadow(0 0 10px rgba(255,255,255,0.28)) drop-shadow(0 0 16px rgba(255,255,255,0.16))'
      : 'drop-shadow(0 0 8px rgba(0,0,0,0.32)) drop-shadow(0 0 14px rgba(0,0,0,0.18))'
    return {
      filter: `brightness(0) saturate(100%) ${glow}`,
    }
  })

  // ── Tier preview ───────────────────────────────
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

  // ── Community stats (from /api/global) ─────────
  interface ChartFormatterParam {
    data?: {
      itemId?: string
      value: number
      percentage: string
    }
  }

  interface SelectedBannerOutfit {
    quality: '4' | '5'
    outfitId: OutfitKey
  }

  const communityFirstItemSkeletonHeights = [
    80, 80, 80, 80, 60, 60, 60, 60, 40, 40,
  ] as const
  const gameVersionHeaders = getGameVersionRequestHeaders()

  const fetchGlobalData = () =>
    $fetch<GlobalBootstrapData | null>('/api/global', {
      headers: gameVersionHeaders,
    })

  const globalDataOptions = {
    default: () => null,
    server: false,
    lazy: true,
  }

  const { data: globalStats, status: globalStatsStatus } =
    useAsyncData<GlobalBootstrapData | null>(
      'global-data',
      fetchGlobalData,
      globalDataOptions
    )

  const hasOutfit = (id: string): id is OutfitKey =>
    Object.prototype.hasOwnProperty.call(OUTFIT_DATA, id)

  const communityFirstItemBanner = computed(() => {
    const bootstrapBannerId = globalStats.value?.bannerId
    if (bootstrapBannerId) {
      const matchingBanner = featuredCurrentBanners.find(
        (banner) => banner.bannerId === bootstrapBannerId
      )
      if (matchingBanner) return matchingBanner

      const bootstrapBanner = BANNER_DATA[bootstrapBannerId]
      if (bootstrapBanner) return bootstrapBanner
    }

    return featuredCurrentBanners[0] ?? null
  })

  const communitySelectedOutfit = computed<SelectedBannerOutfit | null>(() => {
    const banner = communityFirstItemBanner.value
    if (!banner) return null

    const firstFiveStarId = banner.outfit5StarId[0]
    if (firstFiveStarId && hasOutfit(firstFiveStarId)) {
      return {
        quality: '5',
        outfitId: firstFiveStarId,
      }
    }

    const firstFourStarId = banner.outfit4StarId[0]
    if (firstFourStarId && hasOutfit(firstFourStarId)) {
      return {
        quality: '4',
        outfitId: firstFourStarId,
      }
    }

    return null
  })

  const communityFirstItemEntries = computed<FirstItemDistribution[string]>(
    () => {
      const banner = communityFirstItemBanner.value
      const selectedOutfit = communitySelectedOutfit.value
      const distribution = globalStats.value?.f

      if (!banner || !selectedOutfit || !distribution) return []

      let dataKey = banner.bannerId.toString()
      if (banner.bannerType === 2 && selectedOutfit.quality === '4') {
        dataKey = `${banner.bannerId}_4`
      }

      const bannerItems = distribution[dataKey]
      if (!bannerItems || bannerItems.length === 0) return []

      const outfitItems = OUTFIT_DATA[selectedOutfit.outfitId].items
      const bannerItemsMap = new Map(bannerItems.map((item) => [item.i, item]))
      const outfitItemsSet = new Set(outfitItems)

      const completeBannerItems = outfitItems.length
        ? [
            ...outfitItems.map((itemId) => ({
              o: bannerItemsMap.get(itemId)?.o ?? 0,
              i: itemId,
            })),
            ...bannerItems.filter((item) => !outfitItemsSet.has(item.i)),
          ]
        : [...bannerItems]

      completeBannerItems.sort((a, b) => b.o - a.o)
      return completeBannerItems
    }
  )

  const communityFirstItemImageSize = computed(() =>
    breakpoints.greater('sm').value ? 60 : 32
  )
  const communityFirstItemImageRequestSize = computed(() =>
    breakpoints.greater('sm').value ? 120 : 60
  )

  const communityFirstItemChartHeight = computed(() => '200px')

  const communityFirstItemChartOption = computed(() => {
    const chartItems = communityFirstItemEntries.value
    if (chartItems.length === 0) return {}

    const textStyle = getChartTextStyle()
    const imageSize = communityFirstItemImageSize.value
    const imageRequestSize = communityFirstItemImageRequestSize.value
    const occurrenceValues = chartItems.map((item) => item.o)
    const minOccurrence = Math.min(...occurrenceValues)
    const maxOccurrence = Math.max(...occurrenceValues)
    const totalOccurrences = chartItems.reduce((sum, item) => sum + item.o, 0)
    const colorShades = isDark.value
      ? ['#6366F1', '#818CF8', '#A5B4FC']
      : ['#4338CA', '#4F46E5', '#8B5CF6']
    const pickColor = (value: number) => {
      const ratio =
        maxOccurrence === minOccurrence
          ? 0.5
          : (value - minOccurrence) / (maxOccurrence - minOccurrence)
      const index = Math.round(ratio * (colorShades.length - 1))
      return `${colorShades[index]}80`
    }

    const dataArr = chartItems.map((item) => ({
      value: item.o,
      percentage:
        totalOccurrences > 0
          ? ((item.o / totalOccurrences) * 100).toFixed(2)
          : '0.00',
      itemId: item.i,
      itemStyle: {
        color: pickColor(item.o),
      },
    }))
    const itemsData = chartItems.map((item) => item.i)
    const richLabels: Record<
      string,
      {
        height: number
        width: number
        backgroundColor: { image: string }
        align: string
      }
    > = {}

    itemsData.forEach((itemId) => {
      richLabels[`img${itemId}`] = {
        height: imageSize,
        width: imageSize,
        backgroundColor: {
          image: nuxtImg(
            getImageSrc('itemIcon', itemId),
            {},
            {
              preset: imageRequestSize === 60 ? 'iconSm' : 'iconLg',
            }
          ),
        },
        align: 'center',
      }
    })

    return {
      animationDuration: 500,
      textStyle,
      tooltip: {
        trigger: 'axis',
        confine: true,
        formatter: (params: ChartFormatterParam[]) => {
          const itemId = params[0]?.data?.itemId
          if (!itemId) return ''

          return `
                <div style="display: flex; flex-direction: column;">
                  <div style="font-weight: bold; margin-bottom: 5px;">
                    ${t(`item.${itemId}.name`, itemId)}
                  </div>
                  <div>
                    ${t('common.charts.occurrences')}: <strong>${params[0]?.data?.value ?? 0}</strong>
                  </div>
                  <div>
                    ${t('common.charts.percentage')}: <strong>${params[0]?.data?.percentage ?? '0.00'}%</strong>
                  </div>
                </div>
              `
        },
        backgroundColor: isDark.value ? palette.dark : palette.light,
        borderColor: isDark.value ? '#555' : '#ddd',
        borderWidth: 1,
        padding: 10,
        textStyle,
        extraCssText: chartTooltipExtraCssText.value,
      },
      grid: {
        left: 0,
        right: 0,
        bottom: 0,
        top: 0,
      },
      xAxis: {
        type: 'category',
        data: itemsData,
        axisLabel: {
          show: true,
          formatter: (value: string) => `{img${value}|}`,
          rich: richLabels,
          interval: 0,
          margin: imageSize / 4,
        },
        axisTick: {
          show: false,
        },
        axisLine: {
          show: false,
        },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          show: false,
        },
        axisTick: {
          show: false,
        },
        axisLine: {
          show: false,
        },
        splitLine: {
          show: false,
        },
      },
      series: [
        {
          type: 'bar',
          barWidth: '60%',
          data: dataArr,
          itemStyle: {
            borderRadius: [4, 4, 4, 4],
          },
        },
      ],
    }
  })

  // ── SEO ────────────────────────────────────────
  useSeoMeta({
    title: () => t('meta.title'),
    description: () => t('meta.description.default'),
    ogTitle: () => t('meta.title'),
    ogDescription: () => t('meta.description.default'),
    twitterTitle: () => t('meta.title'),
    twitterDescription: () => t('meta.description.default'),
  })
</script>
