<template>
  <div class="landing-page mx-auto max-w-7xl space-y-4 sm:space-y-8">
    <!-- ═══ Hero Section ═══ -->
    <section class="hero-section relative py-4 text-center sm:py-8">
      <div class="mb-4 flex flex-row items-center justify-center gap-4">
        <button
          type="button"
          :aria-label="$t('navigation.title')"
          class="group flex h-12 w-12 shrink-0 cursor-help items-center justify-center rounded-2xl bg-white/60 p-2 shadow-md ring-1 ring-purple-200/50 backdrop-blur-xs transition-all duration-300 hover:-translate-y-0.5 active:scale-95 sm:h-16 sm:w-16 dark:bg-slate-800/60 dark:shadow-[0_4px_10px_rgba(0,0,0,0.3)] dark:ring-purple-800/20"
          @click="handleHeroLogoClick"
        >
          <NuxtImg
            src="images/logo.webp"
            preset="iconSm"
            fit="cover"
            loading="eager"
            class="h-full w-full transition-transform duration-300 group-hover:scale-105"
            :style="heroLogoStyle"
          />
        </button>
        <div class="text-left">
          <p
            class="text-xs font-semibold tracking-widest text-rose-500/80 uppercase dark:text-rose-300/80"
          >
            {{ $t('meta.game_title') }}
          </p>
          <p class="text-2xl leading-tight font-black sm:text-3xl">
            {{ $t('navigation.title') }}
          </p>
        </div>
      </div>
      <h1
        class="bg-linear-to-r from-[#c084fc] via-[#f472b6] to-[#fb923c] bg-clip-text pb-4 text-2xl font-extrabold whitespace-pre-line text-transparent sm:text-4xl dark:from-[#a78bfa] dark:via-[#f9a8d4] dark:to-[#fdba74]"
      >
        {{ $t('navigation.subtitle') }}
      </h1>
      <p
        class="mx-auto mb-6 max-w-xl text-base text-gray-600 sm:text-lg dark:text-gray-300"
      >
        {{ $t('default.description') }}
      </p>
      <div class="flex flex-wrap items-center justify-center gap-4">
        <n-button
          type="primary"
          size="large"
          round
          strong
          class="after:animate-button-shimmer relative overflow-hidden shadow-sm transition-all after:absolute after:inset-y-0 after:-left-full after:w-[60%] after:bg-linear-to-r after:from-transparent after:via-white/15 after:to-transparent after:content-[''] hover:-translate-y-0.5 hover:shadow-md motion-reduce:after:animate-none"
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
          class="after:animate-button-shimmer relative overflow-hidden shadow-sm transition-all after:absolute after:inset-y-0 after:-left-full after:w-[60%] after:bg-linear-to-r after:from-transparent after:via-white/15 after:to-transparent after:content-[''] hover:-translate-y-0.5 hover:shadow-md motion-reduce:after:animate-none"
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
          class="transform-all inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/45 bg-white/55 px-3 py-1 text-xs font-semibold text-slate-700 shadow-xs backdrop-blur-md duration-200 hover:-translate-y-0.5 hover:bg-white/70 hover:shadow-md dark:border-white/10 dark:bg-slate-950/35 dark:text-slate-100 dark:hover:bg-slate-900/50"
          @click="scrollToSection(bannersSectionRef)"
        >
          <n-icon><CalendarAlt /></n-icon>
          {{ $t('default.current_banners') }}
        </button>
        <button
          type="button"
          class="transform-all inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/45 bg-white/55 px-3 py-1 text-xs font-semibold text-slate-700 shadow-xs backdrop-blur-md duration-200 hover:-translate-y-0.5 hover:bg-white/70 hover:shadow-md dark:border-white/10 dark:bg-slate-950/35 dark:text-slate-100 dark:hover:bg-slate-900/50"
          @click="scrollToSection(compendiumSectionRef)"
        >
          <n-icon><ListAlt /></n-icon>
          {{ $t('navigation.compendium') }}
        </button>
        <button
          type="button"
          class="transform-all inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/45 bg-white/55 px-3 py-1 text-xs font-semibold text-slate-700 shadow-xs backdrop-blur-md duration-200 hover:-translate-y-0.5 hover:bg-white/70 hover:shadow-md dark:border-white/10 dark:bg-slate-950/35 dark:text-slate-100 dark:hover:bg-slate-900/50"
          @click="scrollToStatsSection"
        >
          <n-icon><Globe /></n-icon>
          {{ $t('default.community_stats') }}
        </button>
      </div>

      <n-modal
        :show="showGongeousEasterEgg"
        class="pointer-events-auto mx-auto w-full max-w-sm"
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
      class="scroll-mt-16"
    >
      <n-card
        size="small"
        class="rounded-xl p-0 sm:p-2"
      >
        <div class="mb-4 text-center">
          <n-h2 class="m-0 font-bold">
            {{ $t('default.current_banners') }}
          </n-h2>
        </div>
        <div
          v-if="bannerGroups.length > 0"
          class="flex flex-col gap-4 sm:flex-row"
        >
          <div
            v-for="group in bannerGroups"
            :key="group.key"
            class="aspect-2/1 w-full sm:w-1/2"
            :class="bannerGroups.length === 1 ? 'sm:mx-auto' : ''"
          >
            <BannerCarousel
              :banners="group.banners"
              :target-time="group.targetTime"
              :priority="group.key === primaryBannerGroupKey"
            />
          </div>
        </div>
      </n-card>
    </section>
    <!-- ═══ Compendium Section ═══ -->
    <section
      ref="compendiumSectionRef"
      class="scroll-mt-16"
    >
      <n-card
        size="small"
        class="rounded-xl p-0 sm:p-2"
      >
        <div class="mb-4 text-center">
          <n-h2 class="m-0 font-bold">
            {{ $t('navigation.compendium') }}
          </n-h2>
        </div>

        <!-- Compendium Grid -->
        <div class="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <button
            v-for="item in compendiumItems"
            :key="item.key"
            class="group relative isolate flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-black/4 bg-linear-to-br from-[#e8ddf9]/30 via-white/60 to-[#fce4ec]/40 p-6 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-rose-200/70 hover:shadow-[0_10px_28px_rgba(244,63,94,0.16)] motion-reduce:transform-none motion-reduce:transition-none dark:border-white/5 dark:from-[#1e1b4b]/45 dark:via-[#221834]/55 dark:to-[#581c64]/35 dark:hover:border-fuchsia-300/20 dark:hover:shadow-[0_10px_28px_rgba(168,85,247,0.16)]"
            @click="navigateTo(localePath(item.path))"
          >
            <div
              class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.95),transparent_58%)] opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100 motion-reduce:transition-none dark:bg-[radial-gradient(circle_at_top,rgba(244,114,182,0.18),transparent_58%)]"
            />
            <div
              class="pointer-events-none absolute -top-8 -right-8 h-20 w-20 rounded-full bg-rose-300/25 blur-2xl transition-all duration-300 ease-out group-hover:scale-125 group-hover:bg-amber-300/30 motion-reduce:transition-none dark:bg-fuchsia-500/20 dark:group-hover:bg-rose-400/30"
            />
            <n-icon
              :size="28"
              class="relative mb-2 text-rose-500 transition-all duration-300 ease-out group-hover:-translate-y-0.5 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none dark:text-rose-400"
            >
              <component :is="item.icon" />
            </n-icon>
            <span
              class="relative text-sm font-semibold tracking-[0.02em] transition-all duration-300 ease-out group-hover:tracking-wider group-hover:text-rose-600 motion-reduce:transition-none dark:group-hover:text-rose-200"
            >
              {{ $t(item.label) }}
            </span>
          </button>
        </div>

        <!-- Feature Row -->
        <div
          ref="featureRowRef"
          class="grid grid-cols-2 gap-3 lg:grid-cols-4"
        >
          <!-- Whim Search -->
          <NuxtLinkLocale
            no-prefetch
            class="group relative flex h-36 w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-gray-200/70 bg-linear-to-b from-gray-100 to-gray-200 dark:border-gray-700/70 dark:from-gray-800 dark:to-gray-900"
            :to="'/search'"
          >
            <!-- Decorative Search Interface Background -->
            <div
              v-if="shouldRenderFeatureAssets"
              class="absolute inset-0 flex flex-col items-center justify-start gap-1.5 pt-3 transition-transform duration-500 group-hover:-translate-y-1"
            >
              <!-- Mini Searchbar -->
              <div
                class="relative flex h-7 w-[80%] shrink-0 items-center overflow-hidden rounded-full bg-white shadow-xs ring-1 ring-black/5 dark:bg-slate-900 dark:ring-white/10"
              >
                <n-icon
                  class="ml-2.5 shrink-0 text-rose-400"
                  size="11"
                  ><Search
                /></n-icon>
                <div
                  class="ml-2 h-1.5 w-1/4 rounded-full bg-slate-200 dark:bg-slate-700"
                ></div>
                <div class="ml-auto flex shrink-0 items-center gap-1 pr-1">
                  <!-- Filter button -->
                  <div
                    class="flex h-4 w-4 items-center justify-center rounded-full text-slate-400 dark:text-slate-500"
                  >
                    <n-icon size="8"><Filter /></n-icon>
                  </div>
                  <!-- Search button -->
                  <div
                    class="flex h-5 w-9 items-center justify-center rounded-full bg-rose-500 shadow-sm dark:bg-rose-600"
                  >
                    <div class="h-1 w-3.5 rounded-full bg-white/70"></div>
                  </div>
                </div>
              </div>
              <!-- Mini Results Grid (Item Cards) -->
              <div
                class="grid h-[60%] shrink-0 grid-cols-6 gap-1.5 opacity-70 dark:opacity-80"
              >
                <div
                  v-for="index in 18"
                  :key="`mini-result-${index}`"
                  class="h-6 w-4 rounded-[3px] shadow-xs"
                  :class="
                    ['bg-amber-500/80', 'bg-sky-500/80', 'bg-slate-500/80'][
                      (index - 1) % 3
                    ]
                  "
                ></div>
              </div>
            </div>
            <div
              v-else
              class="absolute inset-x-5 top-5 bottom-12 flex items-center justify-center"
            >
              <n-skeleton class="h-14 w-20 rounded-xl" />
            </div>

            <div class="absolute right-2 bottom-2 left-2 z-10">
              <div
                class="pointer-events-none flex w-full items-center justify-center gap-1 rounded-md border border-white/60 bg-white/80 px-3 py-1.5 text-sm font-medium text-rose-500 shadow-xs backdrop-blur-xs dark:border-white/10 dark:bg-slate-900/70 dark:text-rose-300"
              >
                <n-icon><Search /></n-icon>
                <span>{{ $t('search_page.title') }}</span>
              </div>
            </div>
          </NuxtLinkLocale>

          <!-- Whim-O-Matic -->
          <NuxtLinkLocale
            no-prefetch
            class="group relative flex h-36 w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-gray-200/70 bg-linear-to-b from-gray-100 to-gray-200 dark:border-gray-700/70 dark:from-gray-800 dark:to-gray-900"
            :to="'/random'"
          >
            <!-- GachaponMachineSvg bg -->
            <div
              v-if="shouldRenderFeatureAssets"
              class="absolute h-30 transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-105"
            >
              <LazyGachaponMachineSvg class="h-full w-full drop-shadow-sm" />
            </div>
            <div
              v-else
              class="absolute inset-x-5 top-5 bottom-12 flex items-center justify-center"
            >
              <n-skeleton class="h-14 w-20 rounded-xl" />
            </div>

            <div class="absolute right-2 bottom-2 left-2 z-10">
              <div
                class="pointer-events-none flex w-full items-center justify-center gap-1 rounded-md border border-white/60 bg-white/80 px-3 py-1.5 text-sm font-medium text-rose-500 shadow-xs backdrop-blur-xs dark:border-white/10 dark:bg-slate-900/70 dark:text-rose-300"
              >
                <n-icon><Magic /></n-icon>
                <span>{{ $t('search_page.lucky_machine_title') }}</span>
              </div>
            </div>
          </NuxtLinkLocale>

          <!-- Tier List Preview -->
          <NuxtLinkLocale
            no-prefetch
            class="group relative flex h-36 w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-gray-200/70 bg-linear-to-b from-gray-100 to-gray-200 dark:border-gray-700/70 dark:from-gray-800 dark:to-gray-900"
            :to="'/tierlist'"
          >
            <div
              v-if="shouldRenderFeatureAssets"
              class="flex h-full flex-col gap-1.5 rounded-md p-2 backdrop-blur-[1px] transition-transform duration-500 group-hover:-translate-y-1"
            >
              <div
                v-for="(row, rowIndex) in tierPreviewRows"
                :key="`tier-preview-row-${rowIndex}`"
                class="flex items-center"
              >
                <div class="flex flex-1 gap-1.5">
                  <div
                    v-for="(chipClass, chipIndex) in row"
                    :key="`tier-preview-chip-${rowIndex}-${chipIndex}`"
                    class="h-4 w-4 shrink-0 rounded-[3px]"
                    :class="chipClass"
                  />
                </div>
              </div>
            </div>
            <div
              v-else
              class="absolute inset-x-5 top-5 bottom-12 flex items-center justify-center"
            >
              <n-skeleton class="h-14 w-20 rounded-xl" />
            </div>
            <div class="absolute right-2 bottom-2 left-2">
              <div
                class="pointer-events-none flex w-full items-center justify-center gap-1 rounded-md border border-white/60 bg-white/80 px-3 py-1.5 text-sm font-medium text-rose-500 shadow-xs backdrop-blur-xs dark:border-white/10 dark:bg-slate-900/70 dark:text-rose-300"
              >
                <n-icon><SortAmountDown /></n-icon>
                <span>{{ $t('navigation.tierlist') }}</span>
              </div>
            </div>
          </NuxtLinkLocale>

          <!-- Outfit Silhouette Quiz -->
          <NuxtLinkLocale
            no-prefetch
            class="group relative flex h-36 w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-gray-200/70 bg-linear-to-b from-gray-100 to-gray-200 dark:border-gray-700/70 dark:from-gray-800 dark:to-gray-900"
            :to="'/quiz'"
          >
            <div
              v-if="shouldRenderFeatureAssets"
              class="mb-4 aspect-2/3 h-full shrink-0 p-1 transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-105"
            >
              <LazyNuxtImg
                :src="getImageSrc('outfit', featuredOutfitId)"
                preset="tallSm"
                quality="1"
                fit="cover"
                loading="lazy"
                class="h-full w-full max-w-full object-cover"
                :style="silhouetteStyle"
              />
            </div>
            <div
              v-else
              class="absolute inset-x-5 top-5 bottom-12 flex items-center justify-center"
            >
              <n-skeleton class="h-14 w-20 rounded-xl" />
            </div>
            <div class="absolute right-2 bottom-2 left-2">
              <div
                class="pointer-events-none flex w-full items-center justify-center gap-1 rounded-md border border-white/60 bg-white/80 px-3 py-1.5 text-sm font-medium text-rose-500 shadow-xs backdrop-blur-xs dark:border-white/10 dark:bg-slate-900/70 dark:text-rose-300"
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
      class="scroll-mt-16"
    >
      <LandingCommunityStats
        v-if="shouldRenderStatsSection"
        :featured-current-banners="featuredCurrentBanners"
      />
      <n-card
        v-else
        size="small"
        class="rounded-xl p-0 sm:p-2"
      >
        <div class="mb-4 text-center">
          <n-h2 class="m-0 font-bold">
            {{ $t('default.community_stats') }}
          </n-h2>
        </div>
        <div
          class="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)]"
        >
          <div class="flex flex-col gap-3">
            <div class="grid grid-cols-2 gap-3 text-center lg:grid-cols-1">
              <div class="rounded-xl bg-[#e8ddf9]/15 p-3 dark:bg-[#1e1b4b]/25">
                <div class="mb-1 flex h-5 items-center justify-center">
                  <n-skeleton
                    text
                    round
                    class="w-20"
                  />
                </div>
                <div
                  class="flex min-h-7 items-center justify-center text-xl font-bold tabular-nums sm:min-h-8 sm:text-2xl"
                >
                  <n-skeleton
                    text
                    round
                    class="w-24 sm:w-32"
                  />
                </div>
              </div>
              <div class="rounded-xl bg-[#e8ddf9]/15 p-3 dark:bg-[#1e1b4b]/25">
                <div class="mb-1 flex h-5 items-center justify-center">
                  <n-skeleton
                    text
                    round
                    class="w-20"
                  />
                </div>
                <div
                  class="flex min-h-7 items-center justify-center text-xl font-bold tabular-nums sm:min-h-8 sm:text-2xl"
                >
                  <n-skeleton
                    text
                    round
                    class="w-16 sm:w-20"
                  />
                </div>
              </div>
            </div>
            <div class="flex justify-center">
              <n-skeleton class="h-8 w-40 rounded-full" />
            </div>
          </div>
          <div
            class="flex h-50 items-end gap-4 rounded-xl bg-[#e8ddf9]/15 p-2 lg:gap-8 lg:p-4 dark:bg-[#1e1b4b]/25"
          >
            <n-skeleton
              v-for="(height, index) in communityStatsSkeletonHeights"
              :key="`community-stats-placeholder-${index}`"
              class="flex-1 rounded-md"
              :style="{ height: `${height}%` }"
            />
          </div>
        </div>
      </n-card>
    </section>
  </div>
</template>

<script setup lang="ts">
  import { BANNER_DATA } from '~~/data/banners'
  import { CURRENT_BANNER_GROUPS } from '~~/data/config'
  import type { OutfitKey } from '~~/data/outfits'
  import {
    Book,
    Globe,
    CalendarAlt,
    Tshirt,
    ListAlt,
    PuzzlePiece,
    SortAmountDown,
    Search,
    Magic,
    Filter,
    PaintBrush,
  } from '@vicons/fa'

  const { t } = useI18n()
  const { getImageSrc } = imageProvider()
  const { isDark } = useTheme()
  const localePath = useLocalePath()
  const bannersSectionRef = ref<HTMLElement | null>(null)
  const compendiumSectionRef = ref<HTMLElement | null>(null)
  const featureRowRef = ref<HTMLElement | null>(null)
  const statsSectionRef = ref<HTMLElement | null>(null)
  const { shouldRender: shouldRenderFeatureAssets } = useDeferredSectionRender(
    featureRowRef,
    {
      rootMargin: '300px',
    }
  )
  const { shouldRender: shouldRenderStatsSection, renderNow: renderStatsNow } =
    useDeferredSectionRender(statsSectionRef, {
      rootMargin: '500px',
    })
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

  const scrollToStatsSection = () => {
    renderStatsNow()
    scrollToSection(statsSectionRef.value)
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
      key: 'makeups',
      path: '/makeups',
      icon: PaintBrush,
      label: 'common.makeups',
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
  const primaryBannerGroupKey = bannerGroups[0]?.key ?? null

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
  const communityStatsSkeletonHeights = [
    80, 80, 80, 80, 60, 60, 60, 60, 40, 40,
  ] as const

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
