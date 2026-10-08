<template>
  <div class="mx-auto max-w-7xl space-y-2 sm:space-y-4">
    <n-card
      size="small"
      class="rounded-xl"
      content-class="p-2 sm:p-4"
    >
      <BannerWishlistToolbar
        v-model:value="wishlistOnly"
        class="mb-2 sm:mb-3"
      >
        <n-tooltip :show-arrow="false">
          <template #trigger>
            <n-button
              size="small"
              secondary
              :aria-label="t('navigation.timeline')"
              @click="goToTimeline"
            >
              <template #icon>
                <n-icon size="16"><AlignRight /></n-icon>
              </template>
              {{ t('navigation.timeline') }}
            </n-button>
          </template>
          {{ t('navigation.timeline') }}
        </n-tooltip>
        <n-tooltip
          :disabled="!isTierlistDisabled"
          trigger="hover"
        >
          <template #trigger>
            <div class="shrink-0">
              <n-button
                size="small"
                type="primary"
                :disabled="isTierlistDisabled"
                :aria-label="t('navigation.tierlist')"
                @click="goToTierlist"
              >
                <template #icon>
                  <n-icon size="16"><SortAmountDown /></n-icon>
                </template>
                {{ t('navigation.tierlist') }}
              </n-button>
            </div>
          </template>
          {{ t('tierlist.over_limit.description', { max: TIER_ENTRY_LIMIT }) }}
        </n-tooltip>
        <template #filters>
          <div class="flex flex-wrap items-center gap-2 sm:justify-end">
            <div class="w-40 shrink-0">
              <CompendiumQualityFilter
                v-model:value="qualityFilter"
                :quality-options="[5, 4]"
                :unavailable-qualities="bannerUnavailableQualities"
              />
            </div>
            <n-select
              v-model:value="versionFilter"
              :options="versionOptions"
              :render-label="renderVersionOptionLabel"
              size="small"
              class="min-w-40 flex-1 sm:w-48 sm:flex-none"
              clearable
              filterable
              :show-checkmark="false"
              :placeholder="t('compendium.filter_version')"
            />
          </div>
        </template>
      </BannerWishlistToolbar>
      <div
        class="min-w-0"
        @focusin="revealBannerRail"
        @pointerenter="revealBannerRail"
        @touchstart.passive="revealBannerRail"
      >
        <n-scrollbar
          x-scrollable
          class="pb-2"
        >
          <div class="flex min-w-max flex-row gap-2 pb-2">
            <template
              v-for="(banner, bannerIndex) in displayedRailBanners"
              :key="banner.bannerId"
            >
              <div
                v-if="banner.bannerId === firstRerunBannerId"
                aria-hidden="true"
                class="mx-1 h-12 w-px shrink-0 self-center rounded-full bg-gray-300/70 dark:bg-gray-600/70"
              ></div>
              <div
                class="shrink-0 cursor-pointer transition-opacity hover:opacity-80"
              >
                <n-tooltip trigger="hover">
                  <template #trigger>
                    <a
                      :href="`#${banner.bannerId}`"
                      class="block rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
                      @click.prevent="handleBannerClick(banner.bannerId)"
                    >
                      <NuxtImg
                        :src="getImageSrc('bannerThumb', banner.bannerId)"
                        :alt="$t(`banner.${banner.bannerId}.name`)"
                        class="h-16 w-32 rounded-lg object-cover"
                        preset="bannerThumb"
                        fit="cover"
                        :loading="
                          getListingImageLoading(
                            bannerIndex,
                            BANNER_RAIL_INITIAL_IMAGE_COUNT
                          )
                        "
                        fetchpriority="low"
                        sizes="200px"
                      />
                    </a>
                  </template>
                  <span>{{ t(`banner.${banner.bannerId}.name`) }}</span>
                </n-tooltip>
              </div>
            </template>
          </div>
        </n-scrollbar>
      </div>
    </n-card>

    <n-card
      size="small"
      class="rounded-xl p-0 sm:p-2"
      content-class="p-2 sm:p-4"
    >
      <div
        v-if="wishlistOnly && !wishlistReady && !wishlistError"
        class="p-6 text-center text-sm text-slate-500"
        role="status"
      >
        {{ t('common.loading') }}
      </div>
      <n-empty
        v-else-if="
          wishlistOnly && wishlistReady && filteredBanners.length === 0
        "
        class="py-8"
      >
        <template #icon
          ><n-icon><HeartRegular /></n-icon
        ></template>
        <template #default>
          <p class="text-sm font-medium text-slate-700 dark:text-slate-200">
            {{ t(wishCount ? 'wishlist.no_matches' : 'wishlist.empty') }}
          </p>
        </template>
        <template #extra>
          <n-button
            size="small"
            secondary
            type="primary"
            @click="resetWishlistFilters"
            >{{ t(wishCount ? 'common.clear' : 'banner.browse') }}</n-button
          >
        </template>
      </n-empty>
      <n-timeline
        v-else
        :icon-size="16"
        size="large"
      >
        <template
          v-for="(banner, bannerIndex) in displayedBanners"
          :key="banner.bannerId"
        >
          <n-timeline-item
            v-if="banner.bannerId === firstRerunBannerId"
            type="warning"
          >
            <template #icon>
              <n-icon size="20">
                <History />
              </n-icon>
            </template>
            <template #header>
              <h2
                class="text-lg font-semibold text-gray-800 dark:text-gray-100"
              >
                {{ t('banner.reruns') }}
              </h2>
            </template>
            <template #default>
              <p class="pb-6 text-sm text-gray-500 dark:text-gray-400">
                {{ getVersionFilterLabel(versionFilter) }}
              </p>
            </template>
          </n-timeline-item>
          <n-timeline-item
            :id="banner.bannerId.toString()"
            :type="getBannerTypeColor(banner.bannerType)"
          >
            <template #icon>
              <n-button
                text
                :type="getBannerTypeColor(banner.bannerType)"
              >
                <n-icon size="20">
                  <Gift />
                </n-icon>
              </n-button>
            </template>
            <template #header>
              <div class="flex items-center justify-between gap-3">
                <NuxtLinkLocale
                  no-prefetch
                  :to="getBannerDetailPath(banner.bannerId)"
                  class="min-w-0 flex-1 transition-opacity hover:opacity-95"
                >
                  <n-gradient-text
                    :size="18"
                    class="m-0 font-medium wrap-break-word whitespace-normal!"
                    :type="banner.bannerType === 2 ? 'warning' : 'info'"
                  >
                    {{ $t(`banner.${banner.bannerId}.name`) }}
                  </n-gradient-text>
                </NuxtLinkLocale>
                <BannerWishButton :banner-id="banner.bannerId" />
              </div>
            </template>
            <template #default>
              <div
                aria-hidden="true"
                class="pointer-events-none absolute top-5 bottom-0 left-1.75 z-1 w-0.5 rounded-full bg-linear-to-b"
                :class="
                  banner.bannerType === 2
                    ? 'from-amber-400/70 to-amber-400/20'
                    : banner.bannerType === 3
                      ? 'from-cyan-400/70 to-cyan-400/20'
                      : 'from-violet-400/70 to-violet-400/20'
                "
              ></div>
              <div class="grid grid-cols-1 gap-2 lg:grid-cols-4">
                <div class="space-y-2">
                  <div
                    v-for="run in getDisplayedRuns(banner)"
                    :key="`${run.version}-${run.start}`"
                    class="space-y-2"
                  >
                    <div class="flex flex-col gap-1">
                      <div class="flex items-center gap-1">
                        <NuxtLinkLocale
                          :to="
                            getBannerVersionListLocation(
                              getVersion(run.version)
                            )
                          "
                          class="transition-opacity hover:opacity-80"
                        >
                          <n-tag
                            :bordered="false"
                            class="cursor-pointer"
                          >
                            {{ $t(`version.${getVersion(run.version)}`) }}
                          </n-tag>
                        </NuxtLinkLocale>
                        <NuxtLinkLocale
                          :to="
                            getBannerVersionListLocation(
                              getVersion(run.version)
                            )
                          "
                          class="transition-opacity hover:opacity-80"
                        >
                          <n-tag
                            :bordered="false"
                            class="cursor-pointer"
                          >
                            {{ $t('banner.version') }}
                            {{ getVersion(run.version) }}
                          </n-tag>
                        </NuxtLinkLocale>
                      </div>
                      <div class="flex items-center gap-1">
                        <n-tag :bordered="false">
                          <template #avatar>
                            <n-icon><CalendarDay /></n-icon>
                          </template>
                          <NuxtTime
                            :datetime="getBannerDateTime(run.start)"
                            :locale="bannerDateLocale"
                            year="numeric"
                            month="short"
                            day="numeric"
                          />
                          -
                          <NuxtTime
                            :datetime="getBannerDateTime(run.end)"
                            :locale="bannerDateLocale"
                            year="numeric"
                            month="short"
                            day="numeric"
                          />
                        </n-tag>
                        <n-tag
                          v-if="run !== banner.runs[0]"
                          type="warning"
                          :bordered="false"
                        >
                          {{ t('default.rerun') }}
                        </n-tag>
                      </div>
                    </div>
                  </div>
                  <div v-if="getBannerStatsPath(banner)">
                    <NuxtLinkLocale
                      no-prefetch
                      :to="getBannerStatsPath(banner)!"
                      class="inline-flex items-center gap-2 rounded-lg border border-gray-200/80 bg-white/50 px-3 py-1.5 text-sm leading-none font-medium text-gray-600 shadow-xs focus-visible:ring-2 focus-visible:ring-violet-300/50 focus-visible:ring-offset-2 focus-visible:outline-hidden dark:border-gray-700/80 dark:bg-gray-900/40 dark:text-gray-300 dark:focus-visible:ring-offset-gray-900"
                    >
                      <n-icon size="14">
                        <ChartLine />
                      </n-icon>
                      <span>{{ t('global.banner_stats.title') }}</span>
                    </NuxtLinkLocale>
                  </div>
                  <div class="grid max-w-sm grid-cols-2 gap-1 lg:grid-cols-1">
                    <NuxtLinkLocale
                      v-for="outfitId in banner.outfit5StarId.concat(
                        banner.outfit4StarId
                      )"
                      :key="outfitId"
                      no-prefetch
                      :to="getOutfitDetailPath(outfitId)"
                      class="group focus-visible:outline-primary flex min-w-0 items-center gap-2 rounded-lg p-1 transition-colors hover:bg-gray-100/70 focus-visible:outline-2 focus-visible:outline-offset-2 dark:hover:bg-gray-800/70"
                    >
                      <div
                        class="relative h-20 w-14 shrink-0 overflow-hidden rounded-md border border-gray-200/70 bg-slate-100 bg-[url('/images/bg.webp')] bg-cover bg-center sm:h-24 sm:w-16 dark:border-gray-700/70"
                      >
                        <NuxtImg
                          :src="getImageSrc('outfit', outfitId)"
                          :alt="t(`outfit.${outfitId}.name`)"
                          class="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                          preset="tallSm"
                          fit="cover"
                          loading="lazy"
                          fetchpriority="low"
                          sizes="100px"
                        />
                      </div>
                      <div class="min-w-0 flex-1">
                        <p
                          class="line-clamp-2 text-sm leading-snug font-medium text-gray-700 dark:text-gray-200"
                        >
                          {{ t(`outfit.${outfitId}.name`) }}
                        </p>
                        <n-tag
                          size="small"
                          :bordered="false"
                          :color="
                            getQualityTextTheme(
                              banner.outfit5StarId.includes(outfitId) ? 5 : 4
                            )
                          "
                          round
                          class="mt-1"
                        >
                          <span class="flex items-center gap-1">
                            {{
                              banner.outfit5StarId.includes(outfitId) ? 5 : 4
                            }}
                            <n-icon><Star /></n-icon>
                          </span>
                        </n-tag>
                      </div>
                    </NuxtLinkLocale>
                  </div>
                </div>
                <div class="lg:col-span-3">
                  <div
                    class="mx-auto flex max-w-2xl flex-col items-center space-y-1"
                  >
                    <NuxtLinkLocale
                      no-prefetch
                      :to="getBannerDetailPath(banner.bannerId)"
                      class="relative aspect-2/1 min-h-35 w-full overflow-hidden rounded-lg transition-opacity hover:opacity-95 sm:min-h-82.5"
                    >
                      <NuxtImg
                        :src="getImageSrc('banner', banner.bannerId)"
                        :alt="t(`banner.${banner.bannerId}.name`)"
                        class="absolute inset-0 h-full w-full object-cover"
                        preset="bannerHero"
                        fit="cover"
                        sizes="300px sm:600px"
                        :loading="getListingImageLoading(bannerIndex, 1)"
                        :fetchpriority="
                          getListingImageFetchPriority(bannerIndex)
                        "
                      />
                      <n-tooltip
                        overlap
                        placement="top-end"
                        class="m-2 cursor-pointer rounded-lg px-2 py-1 text-xs"
                        :z-index="10"
                        @click.stop.prevent="
                          navigateTo(
                            localePath(getBannerDetailPath(banner.bannerId))
                          )
                        "
                      >
                        <template #trigger>
                          <div class="absolute inset-0" />
                        </template>
                        <span class="inline-flex items-center gap-2">
                          {{ t('navigation.banner_detail') }}
                          <n-icon><ExternalLinkAlt /></n-icon>
                        </span>
                      </n-tooltip>
                    </NuxtLinkLocale>
                  </div>
                </div>
              </div>
            </template>
          </n-timeline-item>
        </template>
        <span
          aria-hidden="true"
          class="hidden"
        ></span>
      </n-timeline>

      <!-- Observer target for infinite scroll -->
      <div
        ref="observerTarget"
        class="h-1"
      ></div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
  import {
    Gift,
    Star,
    HeartRegular,
    ExternalLinkAlt,
    CalendarDay,
    SortAmountDown,
    AlignRight,
    ChartLine,
    History,
  } from '@vicons/fa'
  import { BANNER_DATA } from '~~/data/banners'
  import { LATEST_BANNER_ID } from '~~/data/config'

  definePageMeta({
    key: 'banners-listing',
  })

  const { t } = useI18n()
  const localePath = useLocalePath()
  const bannerDateLocale = useIntlLocale()
  const route = useRoute()
  const router = useRouter()
  const { getImageSrc } = imageProvider()
  const wishlistOnly = ref(route.query.wishlist === '1')
  const {
    count: wishCount,
    isSaved,
    ready: wishlistReady,
    error: wishlistError,
  } = useBannerWishlist()
  const resetWishlistFilters = () => {
    if (!wishCount.value) {
      wishlistOnly.value = false
      return
    }
    qualityFilter.value = null
    versionFilter.value = null
  }

  const routeSeoFilter = computed(() =>
    getSeoListRouteFilter(route.path, 'banners')
  )
  const routeQualityFilter = computed(() =>
    routeSeoFilter.value?.kind === 'quality'
      ? Number(routeSeoFilter.value.value)
      : null
  )
  const routeVersionFilter = computed(() =>
    routeSeoFilter.value?.kind === 'version'
      ? String(routeSeoFilter.value.value)
      : null
  )

  const getVersion = toMajorMinorVersion

  type BannerListingPrimaryFilter = 'quality' | 'version' | null

  const availableVersions = computed(() =>
    getFirstRunVersions(Object.values(BANNER_DATA).map((banner) => banner.runs))
  )
  const availableVersionFilters = computed(() => [
    ...getVersionFilters(availableVersions.value),
    LISTING_MISSING_FILTER_VALUE,
  ])

  const resolveVersion = (value?: string | null) =>
    resolveVersionFilter(value, availableVersionFilters.value)

  const resolveRouteVersionFilter = () =>
    resolveVersion(routeVersionFilter.value ?? route.query.version?.toString())

  const qualityFilter = ref<number | null>(
    resolveSeoBannerQualitySlug(routeQualityFilter.value) !== null
      ? routeQualityFilter.value
      : null
  )
  const versionFilter = ref<string | null>(resolveRouteVersionFilter())
  const TIER_ENTRY_LIMIT = 200
  const BANNER_LOAD_BATCH_SIZE = 4

  const resolveSelectedBannerQuality = (): number | null => {
    return resolveSeoBannerQualitySlug(qualityFilter.value) !== null
      ? qualityFilter.value
      : null
  }
  const getBannerQualityLabel = (quality: number) => `${quality}★`
  const getVersionFilterLabel = (version?: string | null) => {
    if (!version) return null
    if (isListingMissingFilterValue(version)) {
      return t('compendium.missing_value')
    }
    const key = `version.${version}`
    const translated = t(key)
    return translated !== key ? `${version} - ${translated}` : version
  }
  const activeListFilterLabel = computed(() => {
    const selectedQuality = resolveSelectedBannerQuality()
    if (selectedQuality) return getBannerQualityLabel(selectedQuality)
    return getVersionFilterLabel(versionFilter.value)
  })
  const pageTitle = computed(() => {
    const title = activeListFilterLabel.value
      ? `${t('navigation.banner')} - ${activeListFilterLabel.value}`
      : t('navigation.banner')
    return `${title} - ${t('meta.game_title')} - ${t('navigation.title')}`
  })
  const description = computed(() => {
    const baseDescription = t('meta.description.banner')
    return activeListFilterLabel.value
      ? `${activeListFilterLabel.value} - ${baseDescription}`
      : baseDescription
  })

  useSeoMeta({
    title: () => pageTitle.value,
    description: () => description.value,
    ogTitle: () => pageTitle.value,
    ogDescription: () => description.value,
    twitterTitle: () => pageTitle.value,
    twitterDescription: () => description.value,
  })

  // Sort banners by ID descending (newest first)
  const sortedBanners = computed(() => {
    return [...Object.values(BANNER_DATA)].sort(
      (a, b) => b.bannerId - a.bannerId
    )
  })

  // Selected banner ID for popselect
  const selectedBannerId = ref(0)

  const matchesBannerQuality = (banner: Banner, quality: number) =>
    quality === 5
      ? banner.bannerType === 1 || banner.bannerType === 2
      : quality === 4 && banner.bannerType === 3
  const matchesBannerVersion = (banner: Banner, version: string) => {
    if (isListingMissingFilterValue(version)) {
      return (
        banner.runs.length === 0 ||
        banner.runs.some((run) => isListingFieldMissing(run.version))
      )
    }
    return isExactVersion(version)
      ? banner.runs.some((run) => matchesVersionFilter(run.version, version))
      : matchesFirstRunVersionFilter(banner.runs, version)
  }
  const bannerUnavailableQualities = computed(() =>
    [5, 4].filter(
      (quality) =>
        !sortedBanners.value.some(
          (banner) =>
            matchesBannerQuality(banner, quality) &&
            (!wishlistOnly.value || isSaved(banner.bannerId)) &&
            (!versionFilter.value ||
              matchesBannerVersion(banner, versionFilter.value))
        )
    )
  )

  // Filtered banners based on active filters
  const filteredBanners = computed(() => {
    let banners = sortedBanners.value
    if (wishlistOnly.value)
      banners = banners.filter((banner) => isSaved(banner.bannerId))

    // Filter by banner quality
    banners = banners.filter((banner) => {
      if (qualityFilter.value) {
        return matchesBannerQuality(banner, qualityFilter.value)
      }

      return true
    })

    const selectedVersion = versionFilter.value
    if (selectedVersion) {
      banners = banners.filter((banner) => {
        return matchesBannerVersion(banner, selectedVersion)
      })
    }

    return banners
  })
  const getDisplayedRuns = (banner: Banner) => {
    const selectedVersion = versionFilter.value
    if (!selectedVersion) return banner.runs
    if (isListingMissingFilterValue(selectedVersion)) {
      return banner.runs.filter((run) => isListingFieldMissing(run.version))
    }
    if (!isExactVersion(selectedVersion)) return banner.runs.slice(0, 1)
    return banner.runs.filter((run) =>
      matchesVersionFilter(run.version, selectedVersion)
    )
  }
  const isRerunForSelectedVersion = (banner: Banner) => {
    const selectedVersion = versionFilter.value
    return (
      !!selectedVersion &&
      !isListingMissingFilterValue(selectedVersion) &&
      isExactVersion(selectedVersion) &&
      !matchesVersionFilter(banner.runs[0]?.version ?? '', selectedVersion)
    )
  }
  const isBannerRailExpanded = ref(false)
  const displayedRailBanners = computed(() =>
    isBannerRailExpanded.value
      ? filteredBanners.value
      : filteredBanners.value.slice(0, BANNER_RAIL_INITIAL_IMAGE_COUNT)
  )
  const revealBannerRail = () => {
    isBannerRailExpanded.value = true
  }
  const isTierlistDisabled = computed(
    () => filteredBanners.value.length > TIER_ENTRY_LIMIT
  )

  const resolveTierlistBannerQuality = (): number | null => {
    return resolveSelectedBannerQuality()
  }
  const currentListingPath = computed(() => {
    const slug = resolveSeoBannerQualitySlug(resolveSelectedBannerQuality())
    if (slug) {
      return {
        path: `/banners/quality/${slug}`,
        primaryFilter: 'quality' as BannerListingPrimaryFilter,
      }
    }

    const versionSlug = resolveSeoBannerVersionSlug(versionFilter.value)
    if (versionSlug) {
      return {
        path: `/banners/version/${versionSlug}`,
        primaryFilter: 'version' as BannerListingPrimaryFilter,
      }
    }

    return {
      path: '/banners',
      primaryFilter: null,
    }
  })

  const buildListingQuery = (
    primaryFilter: BannerListingPrimaryFilter = null
  ) => ({
    ...(wishlistOnly.value && { wishlist: '1' }),
    ...(primaryFilter !== 'version' &&
      versionFilter.value && { version: versionFilter.value }),
  })

  const buildTierlistQuery = () => {
    const quality = resolveTierlistBannerQuality()
    return {
      mode: 'banners',
      ...(wishlistOnly.value && { wishlist: '1' }),
      ...(quality !== null && { quality }),
      ...(versionFilter.value && { version: versionFilter.value }),
    }
  }

  const goToTierlist = () => {
    if (isTierlistDisabled.value) return
    navigateTo(
      localePath({
        path: '/tierlist',
        query: buildTierlistQuery(),
      })
    )
  }

  const goToTimeline = () =>
    navigateTo(
      localePath({
        path: '/timeline',
        query: wishlistOnly.value ? { wishlist: '1' } : {},
      })
    )

  const syncListingRoute = () => {
    const listingPath = currentListingPath.value
    router.replace({
      path: localePath(listingPath.path),
      query: buildListingQuery(listingPath.primaryFilter),
    })
  }

  // Initialize banner loading composable
  const { displayedBanners, reset, loadUntilBanner, observerTarget } =
    useBannerLoad({
      allBanners: filteredBanners,
      batchSize: BANNER_LOAD_BATCH_SIZE,
      initialBatchSize: 2,
    })
  const firstRerunBannerId = computed(
    () =>
      filteredBanners.value.find(isRerunForSelectedVersion)?.bannerId ?? null
  )

  watch(
    () => filteredBanners.value.map((banner) => banner.bannerId).join(','),
    () => {
      isBannerRailExpanded.value = false
      reset()
    }
  )

  watch([qualityFilter, versionFilter, wishlistOnly], () => {
    syncListingRoute()
    if (import.meta.client) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  })

  onMounted(() => {
    syncListingRoute()
  })

  watch(routeQualityFilter, (quality) => {
    if (quality !== qualityFilter.value) {
      qualityFilter.value = quality
    }
  })

  watch(
    () => route.query.wishlist,
    (value) => {
      wishlistOnly.value = value === '1'
    }
  )

  watch([routeVersionFilter, () => route.query.version], () => {
    const nextVersion = resolveRouteVersionFilter()
    if (nextVersion !== versionFilter.value) {
      versionFilter.value = nextVersion
    }
  })

  async function handleBannerClick(bannerId: number) {
    // Check if banner is already loaded
    const isLoaded = displayedBanners.value.some(
      (banner) => banner.bannerId === bannerId
    )

    if (!isLoaded) {
      // Load banners up to the target banner
      await loadUntilBanner(bannerId)
    }

    selectedBannerId.value = bannerId
  }

  type ScrollWait = 'none' | 'next-tick' | 'frame'
  interface ScrollOptions {
    behavior?: ScrollBehavior
    wait?: ScrollWait
  }

  const scrollToBanner = async (
    bannerId: number,
    { behavior = 'smooth', wait = 'none' }: ScrollOptions = {}
  ) => {
    if (!import.meta.client) return

    if (wait === 'next-tick') {
      await nextTick()
    } else if (wait === 'frame') {
      await new Promise((resolve) => requestAnimationFrame(resolve))
    }

    const element = document.getElementById(bannerId.toString())
    if (!element) return

    element.scrollIntoView({
      behavior,
      block: 'center',
    })
  }

  watch(selectedBannerId, async (bannerId) => {
    if (!bannerId) return
    await scrollToBanner(bannerId, {
      behavior: 'smooth',
      wait: 'next-tick',
    })
  })

  watch(
    () => route.hash,
    async (hash: string | null) => {
      if (!hash) return
      const bannerId = Number(hash.slice(1))
      if (isNaN(bannerId)) return

      // Load banners up to the target banner
      await loadUntilBanner(bannerId)

      // Then scroll to it
      await scrollToBanner(bannerId, {
        behavior: 'instant',
        wait: 'frame',
      })
    },
    { immediate: true }
  )

  const getBannerVersionListLocation = (version: string) => {
    const slug = resolveSeoBannerVersionSlug(version)
    return slug
      ? `/banners/version/${slug}`
      : {
          path: '/banners',
          query: { version },
        }
  }

  const versionOptions = computed(() => [
    ...createVersionFilterOptions(
      availableVersions.value,
      (version) => getVersionFilterLabel(version) ?? version
    ).map((option) => ({
      ...option,
      class: listingFacetOptionClass(
        sortedBanners.value.some(
          (banner) =>
            (!qualityFilter.value ||
              matchesBannerQuality(banner, qualityFilter.value)) &&
            matchesBannerVersion(banner, String(option.value))
        )
      ),
    })),
    ...(SHOW_LISTING_MISSING_FILTER_OPTIONS
      ? [
          {
            label: t('compendium.missing_value'),
            value: LISTING_MISSING_FILTER_VALUE,
          },
        ]
      : []),
  ])
  const renderVersionOptionLabel = (option: {
    label?: string | number
    value?: string | number
    isMajor?: boolean
  }) => {
    const label = String(option.label ?? option.value ?? '')
    if (!option.isMajor) return label

    return h(
      'span',
      {
        style: {
          fontWeight: '700',
        },
      },
      label
    )
  }

  // Get banner type color
  const getBannerTypeColor = (type: number) => {
    switch (type) {
      case 1:
        return 'default'
      case 2:
        return 'warning'
      case 3:
        return 'info'
      default:
        return 'default'
    }
  }

  const getBannerStatsPath = (banner: {
    bannerId: number
    bannerType: number
  }) => {
    if (banner.bannerType === 1 || banner.bannerId > LATEST_BANNER_ID)
      return null
    return `/global/${getBannerSlug(banner.bannerId)}`
  }
</script>
