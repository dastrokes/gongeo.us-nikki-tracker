<template>
  <div class="max-w-7xl mx-auto space-y-2 sm:space-y-4">
    <n-card
      size="small"
      class="rounded-xl p-0 sm:p-2"
      content-class="!p-2 sm:p-4"
    >
      <div
        class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
      >
        <div class="order-2 min-w-0 sm:order-1 sm:flex-1">
          <n-scrollbar
            x-scrollable
            class="pb-2"
          >
            <div class="flex min-w-max flex-row gap-2 pb-2">
              <div
                v-for="banner in filteredBanners"
                :key="banner.bannerId"
                class="flex-shrink-0 cursor-pointer transition-opacity hover:opacity-80"
              >
                <n-tooltip trigger="hover">
                  <template #trigger>
                    <NuxtImg
                      :src="getImageSrc('bannerThumb', banner.bannerId)"
                      :alt="$t(`banner.${banner.bannerId}.name`)"
                      class="h-16 w-32 rounded-lg object-cover"
                      preset="bannerThumb"
                      fit="cover"
                      loading="lazy"
                      sizes="200px"
                      @click="handleBannerClick(banner.bannerId)"
                    />
                  </template>
                  <span>{{ t(`banner.${banner.bannerId}.name`) }}</span>
                </n-tooltip>
              </div>
            </div>
          </n-scrollbar>
        </div>

        <div class="order-1 flex flex-col gap-2 sm:order-2 sm:items-end">
          <div class="flex items-start justify-end gap-2">
            <n-button
              size="small"
              secondary
              @click="navigateTo(localePath('/timeline'))"
            >
              <template #icon>
                <n-icon size="16">
                  <AlignRight />
                </n-icon>
              </template>
              {{ t('navigation.timeline') }}
            </n-button>

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
                    @click="goToTierlist"
                  >
                    <template #icon>
                      <n-icon size="16">
                        <SortAmountDown />
                      </n-icon>
                    </template>
                    {{ t('navigation.tierlist') }}
                  </n-button>
                </div>
              </template>
              {{
                t('tierlist.over_limit.description', {
                  max: TIER_ENTRY_LIMIT,
                })
              }}
            </n-tooltip>
          </div>

          <div class="flex items-start justify-end gap-2">
            <div class="min-w-0 overflow-x-auto pb-1">
              <div class="flex min-w-max items-center justify-end gap-2">
                <n-button-group class="min-w-max">
                  <n-button
                    size="small"
                    :type="qualityFilter === null ? 'primary' : 'default'"
                    class="min-w-[40px]"
                    @click="qualityFilter = null"
                  >
                    {{ t('common.all') }}
                  </n-button>
                  <n-button
                    v-bind="qualityButtonThemes.star5"
                    size="small"
                    @click="qualityFilter = 5"
                  >
                    <span class="flex items-center gap-1">
                      5
                      <n-icon>
                        <Star />
                      </n-icon>
                    </span>
                  </n-button>
                  <n-button
                    v-bind="qualityButtonThemes.star4"
                    size="small"
                    @click="qualityFilter = 4"
                  >
                    <span class="flex items-center gap-1">
                      4
                      <n-icon>
                        <Star />
                      </n-icon>
                    </span>
                  </n-button>
                </n-button-group>

                <n-select
                  v-model:value="versionFilter"
                  :options="versionOptions"
                  :render-label="renderVersionOptionLabel"
                  size="small"
                  class="w-48 min-w-0"
                  clearable
                  filterable
                  :show-checkmark="false"
                  :placeholder="t('compendium.filter_version')"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </n-card>

    <n-card
      size="small"
      class="rounded-xl p-0 sm:p-2"
      content-class="!p-2 sm:p-4"
    >
      <n-timeline
        :icon-size="16"
        size="large"
      >
        <n-timeline-item
          v-for="banner in displayedBanners"
          :id="banner.bannerId.toString()"
          :key="banner.bannerId"
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
            <NuxtLinkLocale
              no-prefetch
              :to="`/banners/${banner.bannerId}`"
              class="inline w-fit hover:opacity-95 transition-opacity"
            >
              <n-gradient-text
                :size="18"
                class="m-0 font-medium break-words"
                :type="banner.bannerType === 2 ? 'warning' : 'info'"
              >
                {{ $t(`banner.${banner.bannerId}.name`) }}
              </n-gradient-text>
            </NuxtLinkLocale>
          </template>
          <template #default>
            <div class="grid grid-cols-1 lg:grid-cols-4 gap-2">
              <div class="space-y-2">
                <div
                  v-for="(run, index) in banner.runs"
                  :key="index"
                  class="space-y-2"
                >
                  <div class="flex flex-col gap-1">
                    <div class="flex items-center gap-1">
                      <NuxtLinkLocale
                        :to="
                          getBannerVersionListLocation(getVersion(run.version))
                        "
                        class="hover:opacity-80 transition-opacity"
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
                          getBannerVersionListLocation(getVersion(run.version))
                        "
                        class="hover:opacity-80 transition-opacity"
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
                        <n-time
                          :time="getRunStartTime(run)"
                          type="date"
                        />
                        -
                        <n-time
                          :time="getRunEndTime(run)"
                          type="date"
                        />
                      </n-tag>
                      <n-tag
                        v-if="index > 0"
                        :bordered="false"
                      >
                        {{ t('default.rerun') }}
                      </n-tag>
                    </div>
                  </div>
                </div>
                <n-divider />
                <div class="inline-flex flex-col gap-2 items-start">
                  <div
                    v-for="outfitId in banner.outfit5StarId"
                    :key="outfitId"
                    class="inline-flex flex-col"
                  >
                    <NuxtLinkLocale
                      no-prefetch
                      :to="`/outfits/${outfitId}`"
                      class="inline w-fit hover:opacity-80 transition-opacity cursor-pointer"
                    >
                      <n-tag
                        size="large"
                        :color="qualityTextTheme5"
                        :bordered="false"
                        round
                        class="cursor-pointer"
                      >
                        <span class="flex items-center gap-1">
                          {{ t(`outfit.${outfitId}.name`) }} 5
                          <n-icon>
                            <Star />
                          </n-icon>
                        </span>
                      </n-tag>
                    </NuxtLinkLocale>
                  </div>
                  <div
                    v-for="outfitId in banner.outfit4StarId"
                    :key="outfitId"
                    class="inline-flex flex-col"
                  >
                    <NuxtLinkLocale
                      no-prefetch
                      :to="`/outfits/${outfitId}`"
                      class="inline w-fit hover:opacity-80 transition-opacity cursor-pointer"
                    >
                      <n-tag
                        size="large"
                        :color="qualityTextTheme4"
                        :bordered="false"
                        round
                        class="cursor-pointer"
                      >
                        <span class="flex items-center gap-1">
                          {{ t(`outfit.${outfitId}.name`) }} 4
                          <n-icon>
                            <Star />
                          </n-icon>
                        </span>
                      </n-tag>
                    </NuxtLinkLocale>
                  </div>
                </div>
              </div>
              <div class="lg:col-span-3">
                <div
                  class="flex flex-col items-center space-y-1 max-w-2xl mx-auto"
                >
                  <NuxtLinkLocale
                    no-prefetch
                    :to="`/banners/${banner.bannerId}`"
                    class="w-full aspect-[2/1] min-h-[140px] sm:min-h-[330px] relative overflow-hidden rounded-lg hover:opacity-95 transition-opacity"
                  >
                    <NuxtImg
                      :src="getImageSrc('banner', banner.bannerId)"
                      :alt="t(`banner.${banner.bannerId}.name`)"
                      class="absolute inset-0 w-full h-full object-cover"
                      preset="bannerHero"
                      fit="cover"
                      sizes="400px sm:800px"
                      :loading="
                        banner.bannerId === firstDisplayedBannerId
                          ? 'eager'
                          : 'lazy'
                      "
                    />
                    <n-tooltip
                      overlap
                      placement="top-end"
                      class="!rounded-lg !m-2 !px-2 !py-1 text-xs cursor-pointer"
                      :z-index="10"
                      @click.stop.prevent="
                        navigateTo(localePath(`/banners/${banner.bannerId}`))
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
    ExternalLinkAlt,
    CalendarDay,
    SortAmountDown,
    AlignRight,
  } from '@vicons/fa'
  import { BANNER_DATA } from '~~/data/banners'

  const { t } = useI18n()
  const localePath = useLocalePath()
  const route = useRoute()
  const router = useRouter()
  const { getImageSrc } = imageProvider()
  const siteUrl = useRuntimeConfig().public.siteUrl

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
    sortVersionsDesc(
      Array.from(
        new Set(
          Object.values(BANNER_DATA)
            .flatMap((banner) => banner.runs)
            .map((run) => getVersion(run.version))
            .filter(isExactVersion)
        )
      )
    )
  )
  const availableVersionFilters = computed(() =>
    getVersionFilters(availableVersions.value)
  )

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

  const resolveSelectedBannerQuality = (): number | null => {
    return resolveSeoBannerQualitySlug(qualityFilter.value) !== null
      ? qualityFilter.value
      : null
  }
  const getBannerQualityLabel = (quality: number) => `${quality}★`
  const getVersionFilterLabel = (version?: string | null) => {
    if (!version) return null
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
    ogImage: `${siteUrl}/og-banners.png`,
    twitterTitle: () => pageTitle.value,
    twitterDescription: () => description.value,
    twitterImage: `${siteUrl}/og-banners.png`,
  })

  const qualityTextTheme5 = getQualityTextTheme(5)
  const qualityTextTheme4 = getQualityTextTheme(4)
  const qualityButtonThemes = computed(() => ({
    star5: getQualityButtonTheme(5, qualityFilter.value === 5),
    star4: getQualityButtonTheme(4, qualityFilter.value === 4),
  }))

  // Sort banners by ID descending (newest first)
  const sortedBanners = computed(() => {
    return [...Object.values(BANNER_DATA)].sort(
      (a, b) => b.bannerId - a.bannerId
    )
  })

  // Selected banner ID for popselect
  const selectedBannerId = ref(0)

  // Filtered banners based on active filters
  const filteredBanners = computed(() => {
    let banners = sortedBanners.value

    // Filter by banner quality
    banners = banners.filter((banner) => {
      const is5Star = banner.bannerType === 1 || banner.bannerType === 2 // permanent and limited 5★
      const is4Star = banner.bannerType === 3 // limited 4★

      if (qualityFilter.value === 5) return is5Star
      if (qualityFilter.value === 4) return is4Star

      return true
    })

    const selectedVersion = versionFilter.value
    if (selectedVersion) {
      banners = banners.filter((banner) =>
        banner.runs.some((run: BannerRun) =>
          matchesVersionFilter(run.version, selectedVersion)
        )
      )
    }

    return banners
  })
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
    ...(primaryFilter !== 'version' &&
      versionFilter.value && { version: versionFilter.value }),
  })

  const buildTierlistQuery = () => {
    const quality = resolveTierlistBannerQuality()
    return {
      mode: 'banners',
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
    })

  const firstDisplayedBannerId = computed(
    () => displayedBanners.value[0]?.bannerId
  )

  // Watch filter changes with debouncing
  watchDebounced(
    () => [qualityFilter.value, versionFilter.value],
    () => {
      reset()
      syncListingRoute()
      if (import.meta.client) {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    },
    { debounce: 300 }
  )

  onMounted(() => {
    syncListingRoute()
  })

  watch(routeQualityFilter, (quality) => {
    if (quality !== qualityFilter.value) {
      qualityFilter.value = quality
    }
  })

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

  const getRunStartTime = (run: BannerRun) => new Date(`${run.start}T00:00:00`)
  const getRunEndTime = (run: BannerRun) => new Date(`${run.end}T00:00:00`)

  const getBannerVersionListLocation = (version: string) => {
    const slug = resolveSeoBannerVersionSlug(version)
    return slug
      ? `/banners/version/${slug}`
      : {
          path: '/banners',
          query: { version },
        }
  }

  const versionOptions = computed(() =>
    createVersionFilterOptions(
      availableVersions.value,
      (version) => getVersionFilterLabel(version) ?? version
    )
  )
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
</script>
