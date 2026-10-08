<template>
  <div
    ref="pageRef"
    class="mx-auto max-w-7xl space-y-2 sm:space-y-4"
  >
    <!-- Loading State -->
    <template v-if="loading">
      <n-card
        size="small"
        class="rounded-xl"
        content-class="p-2 sm:p-4"
      >
        <!-- Summary Cards Skeleton -->
        <div class="grid grid-cols-2 gap-2 md:grid-cols-6">
          <n-card
            v-for="i in 6"
            :key="i"
            size="small"
            class="rounded-lg text-center"
          >
            <n-skeleton
              height="20px"
              width="80%"
              class="mx-auto mb-2"
            />
            <n-skeleton
              height="24px"
              width="60%"
              class="mx-auto"
            />
          </n-card>
        </div>
      </n-card>

      <!-- Charts Skeleton -->
      <n-card
        size="small"
        class="rounded-xl"
        content-class="p-2 sm:p-4"
      >
        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <!-- Pulls per Banner Chart Skeleton -->
          <StatsChartPanel
            size="small"
            class="col-span-1 md:col-span-3"
            :title="t('global.charts.pulls_per_banner')"
            loading
            height-class="h-[var(--pulls-per-banner-height)] sm:h-80"
            :style="{ '--pulls-per-banner-height': pullsPerBannerChartHeight }"
          >
            <template #controls>
              <n-skeleton
                height="32px"
                width="180px"
              />
            </template>
            <n-skeleton height="100%" />
          </StatsChartPanel>
        </div>
      </n-card>
      <n-card
        size="small"
        class="rounded-xl"
        content-class="p-2 sm:p-4"
      >
        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <!-- Distribution Charts Skeleton -->
          <StatsChartPanel
            v-for="title in [
              'global.charts.five_star_distribution',
              'global.charts.four_star_type2_distribution',
              'global.charts.four_star_type3_distribution',
            ]"
            :key="title"
            :title="t(title)"
            loading
            height-class="h-56"
          >
            <n-skeleton height="100%" />
          </StatsChartPanel>
        </div>
      </n-card>
      <n-card
        size="small"
        class="rounded-xl"
        content-class="p-2 sm:p-4"
      >
        <StatsChartPanel
          :title="t('global.charts.first_item_distribution')"
          loading
          height-class="h-[var(--item-distribution-height)] sm:h-[280px]"
          :style="{
            '--item-distribution-height': firstItemDistributionChartHeight,
          }"
        >
          <template #title-actions>
            <n-skeleton
              v-for="i in 2"
              :key="i"
              height="16px"
              width="16px"
            />
          </template>
          <template #controls>
            <n-skeleton
              height="32px"
              class="min-w-0 flex-1 @3xl:max-w-56"
            />
          </template>
          <n-skeleton height="100%" />
        </StatsChartPanel>
      </n-card>
    </template>

    <div
      v-else
      class="space-y-2 sm:space-y-4"
    >
      <!-- Summary Cards -->
      <n-card
        v-show="!maximizedChart"
        content-class="p-2 sm:p-4"
        size="small"
        class="rounded-xl"
      >
        <div class="grid grid-cols-2 gap-2 md:grid-cols-6">
          <n-card
            size="small"
            class="rounded-lg text-center"
          >
            <div class="text-sm text-gray-400">
              {{ $t('common.stats.total_pulls') }}
            </div>
            <div class="mt-1 text-lg font-medium tabular-nums">
              <n-number-animation
                show-separator
                :from="0"
                :to="totalPulls"
                :duration="5000"
              />
            </div>
          </n-card>
          <n-card
            size="small"
            class="rounded-lg text-center"
          >
            <div class="text-sm text-gray-400">
              {{ $t('global.stats.unique_users') }}
            </div>
            <div class="mt-1 text-lg font-medium tabular-nums">
              <n-number-animation
                show-separator
                :from="0"
                :to="uniqueUserCount"
                :duration="3000"
              />
            </div>
          </n-card>
          <n-card
            size="small"
            class="rounded-lg text-center"
          >
            <div class="text-sm text-gray-400">
              {{ $t('common.stats.avg_5star') }}
            </div>
            <div class="mt-1 text-lg font-medium tabular-nums">
              <n-number-animation
                :from="0"
                :to="averagePullsTo5Star"
                :duration="2000"
                :precision="2"
              />
            </div>
          </n-card>
          <n-card
            size="small"
            class="rounded-lg text-center"
          >
            <div class="text-sm text-gray-400">
              {{ $t('common.stats.avg_4star_mixed') }}
            </div>
            <div class="mt-1 text-lg font-medium tabular-nums">
              <n-number-animation
                :from="0"
                :to="averagePullsTo4StarType2"
                :duration="2000"
                :precision="2"
              />
            </div>
          </n-card>
          <n-card
            size="small"
            class="rounded-lg text-center"
          >
            <div class="text-sm text-gray-400">
              {{ $t('common.stats.avg_4star_only') }}
            </div>
            <div class="mt-1 text-lg font-medium tabular-nums">
              <n-number-animation
                :from="0"
                :to="averagePullsTo4StarType3"
                :duration="2000"
                :precision="2"
              />
            </div>
          </n-card>
          <n-card
            size="small"
            class="rounded-lg text-center"
          >
            <div class="text-sm text-gray-400">
              {{ $t('global.stats.data_as_of') }}
            </div>
            <div class="mt-1 text-lg font-medium tabular-nums">
              <n-time
                v-if="data?.date"
                :time="effectiveDate"
                type="date"
              />
              <n-time
                v-else
                :time="new Date()"
                type="date"
              />
            </div>
          </n-card>
        </div>
      </n-card>

      <!-- Charts -->
      <n-card
        v-show="!maximizedChart || maximizedChart === 'pullsPerBanner'"
        size="small"
        class="rounded-xl"
        :class="{ 'mt-0 mb-0': Boolean(maximizedChart) }"
        content-class="p-2 sm:p-4"
      >
        <!-- Pulls per Banner Chart -->
        <StatsChartPanel
          v-show="!maximizedChart || maximizedChart === 'pullsPerBanner'"
          :maximized="maximizedChart === 'pullsPerBanner'"
          :title="t('global.charts.pulls_per_banner')"
          height-class="h-[var(--pulls-per-banner-height)] sm:h-80"
          :style="{ '--pulls-per-banner-height': pullsPerBannerChartHeight }"
          @toggle="toggleMaximize('pullsPerBanner')"
        >
          <template #controls>
            <div class="flex min-w-0 flex-wrap items-center gap-2">
              <n-switch
                v-model:value="showAllBanners"
                @update:value="updatePullsPerBannerChart"
              >
                <template #checked>
                  <n-tooltip
                    trigger="hover"
                    :show-arrow="false"
                  >
                    <template #trigger>
                      <n-icon :component="CalendarAlt" />
                    </template>
                    {{ $t('global.charts.all_time') }}
                  </n-tooltip>
                </template>
                <template #unchecked>
                  <n-tooltip
                    trigger="hover"
                    :show-arrow="false"
                  >
                    <template #trigger>
                      <n-icon :component="CalendarDay" />
                    </template>
                    {{ $t('global.charts.recent_only') }}
                  </n-tooltip>
                </template>
              </n-switch>
              <n-button-group class="min-w-max">
                <n-button
                  size="small"
                  :type="selectedBannerType === 1 ? 'primary' : 'default'"
                  class="min-w-10"
                  :aria-pressed="selectedBannerType === 1"
                  @click="setBannerType(1)"
                >
                  {{ t('common.all') }}
                </n-button>
                <n-button
                  v-bind="bannerTypeButtonThemes.star5"
                  size="small"
                  :aria-pressed="selectedBannerType === 2"
                  @click="setBannerType(2)"
                >
                  <span class="flex items-center gap-1">
                    5
                    <n-icon>
                      <Star />
                    </n-icon>
                  </span>
                </n-button>
                <n-button
                  v-bind="bannerTypeButtonThemes.star4"
                  size="small"
                  :aria-pressed="selectedBannerType === 3"
                  @click="setBannerType(3)"
                >
                  <span class="flex items-center gap-1">
                    4
                    <n-icon>
                      <Star />
                    </n-icon>
                  </span>
                </n-button>
              </n-button-group>
            </div>
          </template>
          <StatsChart
            id="pullsPerBannerChart"
            :compact-tooltip="isMobile"
            :option="pullsPerBannerChartOption"
          />
        </StatsChartPanel>
      </n-card>

      <n-card
        v-show="
          !maximizedChart ||
          maximizedChart === 'fiveStar' ||
          maximizedChart === 'fourStarType2' ||
          maximizedChart === 'fourStarType3'
        "
        size="small"
        class="rounded-xl"
        content-class="p-2 sm:p-4 grid grid-cols-1 md:grid-cols-3 gap-4"
        :class="{ 'mt-0 mb-0': Boolean(maximizedChart) }"
      >
        <!-- 5★ Distribution Chart -->
        <StatsChartPanel
          v-show="!maximizedChart || maximizedChart === 'fiveStar'"
          :maximized="maximizedChart === 'fiveStar'"
          :title="t('global.charts.five_star_distribution')"
          height-class="h-56"
          :class="{ 'md:col-span-3': maximizedChart === 'fiveStar' }"
          @toggle="toggleMaximize('fiveStar')"
        >
          <StatsChart
            id="fiveStarDistributionChart"
            :option="fiveStarDistributionChartOption"
          />
        </StatsChartPanel>

        <!-- 4★ Distribution Type 2 Chart -->
        <StatsChartPanel
          v-show="!maximizedChart || maximizedChart === 'fourStarType2'"
          :maximized="maximizedChart === 'fourStarType2'"
          :title="t('global.charts.four_star_type2_distribution')"
          height-class="h-56"
          :class="{ 'md:col-span-3': maximizedChart === 'fourStarType2' }"
          @toggle="toggleMaximize('fourStarType2')"
        >
          <StatsChart
            id="fourStarType2Chart"
            :option="fourStarType2ChartOption"
          />
        </StatsChartPanel>

        <!-- 4★ Distribution Type 3 Chart -->
        <StatsChartPanel
          v-show="!maximizedChart || maximizedChart === 'fourStarType3'"
          :maximized="maximizedChart === 'fourStarType3'"
          :title="t('global.charts.four_star_type3_distribution')"
          height-class="h-56"
          :class="{ 'md:col-span-3': maximizedChart === 'fourStarType3' }"
          @toggle="toggleMaximize('fourStarType3')"
        >
          <StatsChart
            id="fourStarType3Chart"
            :option="fourStarType3ChartOption"
          />
        </StatsChartPanel>
      </n-card>

      <n-card
        v-show="!maximizedChart || maximizedChart === 'firstItemDistribution'"
        size="small"
        class="rounded-xl"
        :class="{ 'mt-0 mb-0': Boolean(maximizedChart) }"
        content-class="p-2 sm:p-4"
      >
        <!-- First Item Distribution Chart -->
        <StatsChartPanel
          v-show="!maximizedChart || maximizedChart === 'firstItemDistribution'"
          :maximized="maximizedChart === 'firstItemDistribution'"
          :title="t('global.charts.first_item_distribution')"
          height-class="h-[var(--item-distribution-height)] sm:h-[280px]"
          :style="{
            '--item-distribution-height': firstItemDistributionChartHeight,
          }"
          @toggle="toggleMaximize('firstItemDistribution')"
        >
          <template #title-actions>
            <n-tooltip
              v-if="showTooltip"
              :width="200"
            >
              <template #trigger>
                <n-button
                  size="tiny"
                  text
                  class="shrink-0"
                >
                  <template #icon>
                    <n-icon :depth="3">
                      <ExclamationCircle />
                    </n-icon>
                  </template>
                </n-button>
              </template>
              {{ t('global.charts.first_item_distribution_tooltip') }}
            </n-tooltip>
            <n-tooltip v-if="bannerStatsPath">
              <template #trigger>
                <n-button
                  size="tiny"
                  text
                  class="shrink-0"
                  @click="goToSelectedBannerStats"
                >
                  <template #icon>
                    <n-icon :depth="3">
                      <ChartLine />
                    </n-icon>
                  </template>
                </n-button>
              </template>
              {{ t('global.banner_stats.title') }}
            </n-tooltip>
          </template>
          <template #controls>
            <n-tree-select
              v-model:value="selectedOutfit"
              v-model:expanded-keys="expandedKeys"
              :consistent-menu-width="false"
              :options="firstItemTreeOptions"
              class="min-w-0 flex-1 @3xl:max-w-56"
              size="small"
              :indent="16"
              :override-default-node-click-behavior="override"
              :render-label="renderLabel"
              filterable
              @update:show="handleDropdownShow"
              @update:value="updateFirstItemChart"
            />
          </template>
          <StatsChart
            id="firstItemDistributionChart"
            preload-images
            :option="firstItemDistributionChartOption"
          />
        </StatsChartPanel>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { TreeSelectOption } from 'naive-ui'
  import { breakpointsTailwind } from '@vueuse/core'
  import { BANNER_DATA } from '~~/data/banners'
  import { LATEST_BANNER_ID } from '~~/data/config'
  import OUTFIT_DATA, { type OutfitKey } from '~~/data/outfits'
  import {
    ExclamationCircle,
    CalendarDay,
    CalendarAlt,
    ChartLine,
    Star,
  } from '@vicons/fa'

  // Type definitions for ECharts formatter parameters
  interface ChartFormatterParams {
    dataIndex: number
    value: number
    axisValue: string
    data?: {
      itemId?: string
      value: number
      percentage: string
    }
  }

  // Initialize breakpoints
  const breakpoints = useBreakpoints(breakpointsTailwind)
  const isMobile = ref(false)

  function override(info: { option: TreeSelectOption }) {
    if (info.option.children) {
      return 'toggleExpand'
    }
    return 'default'
  }

  const { isDark } = useTheme()
  const palette = usePalette()
  const themeVars = useThemeVars()

  const chartTooltipExtraCssText = computed(
    () => `box-shadow: ${themeVars.value.boxShadow2}; border-radius: 8px;`
  )

  // Chart text style utility
  const getChartTextStyle = () => {
    return {
      fontFamily:
        "'Outfit', ui-sans-serif, system-ui, sans-serif, 'Noto Color Emoji', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'",
      color: isDark.value ? palette.textDark : palette.textLight,
    }
  }

  // Initialize i18n
  const { t, locale } = useI18n()
  const localePath = useLocalePath()
  const { getImageSrc } = imageProvider()
  const nuxtImg = useImage()

  useSeoMeta({
    title: () =>
      `${t('navigation.global')} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    description: () => t('meta.description.global'),
    ogTitle: () =>
      `${t('navigation.global')} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    ogDescription: () => t('meta.description.global'),
    twitterTitle: () =>
      `${t('navigation.global')} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    twitterDescription: () => t('meta.description.global'),
  })

  onMounted(() => {
    watchEffect(() => {
      isMobile.value = !breakpoints.greater('sm').value
    })

    watch(
      [data, () => isMobile.value, () => isDark.value, locale],
      () => {
        if (data.value && import.meta.client) {
          initializeCharts()
          loading.value = false
        }
      },
      { immediate: true }
    )

    watch(firstItemData, (distribution) => {
      if (distribution) createFirstItemDistributionChart(distribution)
    })
  })

  const fetchGlobalData = () => getGlobalBootstrapStats(LATEST_BANNER_ID)

  const globalDataOptions = {
    default: () => null,
    server: false,
    lazy: true,
  }

  const { data: globalData } = useAsyncData<GlobalBootstrapData | null>(
    'global-data',
    fetchGlobalData,
    globalDataOptions
  )

  // Use computed for data to maintain reactivity
  const data = computed(() => globalData.value as GlobalBootstrapData | null)
  const firstItemDataByBanner = ref<Record<number, FirstItemDistribution>>({})
  const firstItemData = ref<FirstItemDistribution | null>(null)
  const loading = ref(true)

  // Computed values for stats (updated for new data.json)
  const totalPulls = computed(() => data.value?.pulls || 0)
  const uniqueUserCount = computed(() => data.value?.users || 0)

  // Calculate weighted average from frequency distribution
  const calculateWeightedAverage = (
    freqDist: Record<string, number> | undefined
  ): number => {
    if (!freqDist) return 0

    let totalWeightedSum = 0
    let totalFrequency = 0

    Object.entries(freqDist).forEach(([pullCount, frequency]) => {
      const pulls = parseInt(pullCount)
      totalWeightedSum += pulls * frequency
      totalFrequency += frequency
    })

    return totalFrequency > 0 ? totalWeightedSum / totalFrequency : 0
  }

  const averagePullsTo5Star = computed(() =>
    calculateWeightedAverage(data.value?.fiveStarDistribution)
  )
  const averagePullsTo4StarType2 = computed(() =>
    calculateWeightedAverage(data.value?.fourStarType2Distribution)
  )
  const averagePullsTo4StarType3 = computed(() =>
    calculateWeightedAverage(data.value?.fourStarType3Distribution)
  )

  const effectiveDate = computed(() =>
    data.value?.date ? new Date(data.value.date) : new Date()
  )

  const firstItemDistributionChartOption = ref({})
  const pullsPerBannerChartOption = ref({})
  const pullsPerBannerChartHeight = ref('320px')
  const fiveStarDistributionChartOption = ref({})
  const fourStarType2ChartOption = ref({})
  const fourStarType3ChartOption = ref({})
  const firstItemDistributionCount = ref(0)
  const firstItemDistributionChartHeight = computed(() =>
    isMobile.value
      ? `${Math.max(320, firstItemDistributionCount.value * 48 + 96)}px`
      : '280px'
  )

  const pageRef = ref<HTMLElement | null>(null)
  const { maximizedChart, toggleMaximize } = useStatsChartMaximize(pageRef)
  const selectedOutfit = ref<string | null>(null)
  const storedSelectedScopeValue = useState<string | null>(
    'global-banner-selected-scope',
    () => null
  )

  interface SelectedOutfitDetails {
    bannerId: number
    quality: string
    outfitId?: string
  }

  const parseSelectedOutfitValue = (
    value: string | number | null
  ): SelectedOutfitDetails | null => {
    if (typeof value !== 'string' || value.length === 0) return null

    const [bannerIdRaw, quality, outfitId] = value.split('_')
    if (!bannerIdRaw || !quality) return null

    const bannerId = Number.parseInt(bannerIdRaw, 10)
    if (Number.isNaN(bannerId)) return null

    return {
      bannerId,
      quality,
      outfitId,
    }
  }

  const getSelectedOutfitDetails = (): SelectedOutfitDetails | null =>
    parseSelectedOutfitValue(selectedOutfit.value)

  const bannerStatsPath = computed(() => {
    const outfitDetails = getSelectedOutfitDetails()
    if (!outfitDetails) return null

    const banner = BANNER_DATA[outfitDetails.bannerId]
    if (!banner?.bannerId) return null

    return localePath(`/global/${getBannerSlug(banner.bannerId)}`)
  })

  const hasOutfit = (id: string): id is OutfitKey =>
    Object.prototype.hasOwnProperty.call(OUTFIT_DATA, id)

  const latestBannerId = LATEST_BANNER_ID
  const latestBanner = computed(() => BANNER_DATA[latestBannerId])
  const bootstrapFirstItemBannerId = computed(
    () => data.value?.bannerId ?? latestBannerId
  )

  const seedBootstrapFirstItemData = (
    payload: GlobalBootstrapData | null | undefined
  ) => {
    if (!payload) return
    firstItemDataByBanner.value[payload.bannerId ?? latestBannerId] =
      payload.firstItemDistribution ?? {}
  }

  const setDefaultSelectedOutfit = () => {
    const banner = latestBanner.value
    const bannerId = latestBannerId

    if (banner?.outfit5StarId?.length) {
      selectedOutfit.value = `${bannerId}_5_${banner.outfit5StarId[0]}`
      return
    }

    if (banner?.outfit4StarId?.length) {
      selectedOutfit.value = `${bannerId}_4_${banner.outfit4StarId[0]}`
      return
    }

    selectedOutfit.value = null
  }

  watch(
    data,
    async (payload) => {
      if (!payload) return
      seedBootstrapFirstItemData(payload)

      if (!selectedOutfit.value) {
        setDefaultSelectedOutfit()
      }

      const activeSelection = selectedOutfit.value
      const activeBannerId =
        getSelectedOutfitDetails()?.bannerId ?? latestBannerId
      const distribution = await ensureFirstItemDataForBanner(activeBannerId)

      if (selectedOutfit.value !== activeSelection) return

      const currentBannerId =
        getSelectedOutfitDetails()?.bannerId ?? latestBannerId
      if (currentBannerId !== activeBannerId) return

      firstItemData.value = distribution
      if (!distribution) {
        firstItemDistributionChartOption.value = {}
        firstItemDistributionCount.value = 0
      }
    },
    { immediate: true }
  )

  const expandedKeys = ref([])

  function handleDropdownShow(show: boolean) {
    if (!show) {
      expandedKeys.value = [] // collapse everything when closed
    }
  }

  const renderLabel = ({ option }: { option: TreeSelectOption }) => {
    if (!option.children) {
      return h('span', { class: '-ml-4' }, option.label)
    } else {
      return h('span', option.label)
    }
  }

  const selectedBannerType = ref(1)
  const showAllBanners = ref(false)
  const bannerTypeButtonThemes = computed(() => ({
    star5: getQualityButtonTheme(5, selectedBannerType.value === 2),
    star4: getQualityButtonTheme(4, selectedBannerType.value === 3),
  }))

  const setBannerType = (bannerType: 1 | 2 | 3) => {
    selectedBannerType.value = bannerType
    updatePullsPerBannerChart()
  }

  // Create tree structure for first item distribution chart
  const firstItemTreeOptions = computed(() => {
    const options = Object.entries(BANNER_DATA)
      .filter(([id]) => id !== '1' && Number(id) <= latestBannerId)
      .map(([id, banner]) => {
        const bannerId = Number(id)
        const bannerName = banner?.bannerId
          ? t(`banner.${banner.bannerId}.name`)
          : ''

        // Create children for each outfit in this banner
        const children: TreeSelectOption[] = []

        // Add 5-star outfits
        if (banner.outfit5StarId) {
          banner.outfit5StarId.forEach((outfitId: TreeSelectOption) => {
            children.push({
              label: '5★ ' + t(`outfit.${outfitId}.name`, outfitId),
              value: `${bannerId}_5_${outfitId}`,
              key: `${bannerId}_5_${outfitId}`,
            })
          })
        }

        // Add 4-star outfits
        if (banner.outfit4StarId) {
          banner.outfit4StarId.forEach((outfitId: TreeSelectOption) => {
            children.push({
              label: '4★ ' + t(`outfit.${outfitId}.name`, outfitId),
              value: `${bannerId}_4_${outfitId}`,
              key: `${bannerId}_4_${outfitId}`,
            })
          })
        }

        return {
          label: bannerName,
          value: bannerId,
          key: `banner_${bannerId}`,
          children: children.length > 0 ? children : undefined,
        }
      })
      .reverse()

    return options
  })

  const checkBannerRuns = (bannerId: number): boolean => {
    const banner = BANNER_DATA[bannerId]
    if (!banner?.runs?.length) return false

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 180)
    const cutoffTime = cutoffDate.getTime()

    return banner.runs.every((run) => {
      if (!run.start || run.end.trim().length === 0) return true

      const startTime = getBannerDateTimestamp(run.start)
      if (Number.isNaN(startTime)) return false

      return startTime >= cutoffTime
    })
  }

  const showTooltip = computed(() => {
    const outfitDetails = getSelectedOutfitDetails()
    if (!outfitDetails) return false

    return !checkBannerRuns(outfitDetails.bannerId)
  })

  async function fetchBannerFirstItemData(bannerId: number) {
    return getGlobalBannerSummary(bannerId)
  }

  async function ensureFirstItemDataForBanner(
    bannerId: number
  ): Promise<FirstItemDistribution | null> {
    const cached = firstItemDataByBanner.value[bannerId]
    if (cached) {
      return cached
    }

    if (bannerId === bootstrapFirstItemBannerId.value && data.value) {
      const distribution = data.value.firstItemDistribution ?? {}
      firstItemDataByBanner.value[bannerId] = distribution
      return distribution
    }

    try {
      const bannerData = await fetchBannerFirstItemData(bannerId)
      const distribution = bannerData?.firstItemDistribution ?? {}
      firstItemDataByBanner.value[bannerId] = distribution
      return distribution
    } catch (error) {
      console.error(
        `Failed to fetch first-item data for banner ${bannerId}:`,
        error
      )
      return null
    }
  }

  // Function to manually update first item chart when outfit selection changes
  const updateFirstItemChart = async (outfitValue: string | number | null) => {
    const requestedOutfit = typeof outfitValue === 'string' ? outfitValue : null
    const outfitDetails = parseSelectedOutfitValue(requestedOutfit)
    if (!outfitDetails) {
      firstItemData.value = null
      firstItemDistributionChartOption.value = {}
      firstItemDistributionCount.value = 0
      return
    }

    const bannerData = await ensureFirstItemDataForBanner(
      outfitDetails.bannerId
    )
    if (selectedOutfit.value !== requestedOutfit) return

    const currentBannerId = getSelectedOutfitDetails()?.bannerId
    if (currentBannerId !== outfitDetails.bannerId) return

    firstItemData.value = bannerData
    if (!bannerData) {
      firstItemDistributionChartOption.value = {}
      firstItemDistributionCount.value = 0
      return
    }

    createFirstItemDistributionChart(bannerData)
  }

  // initialize all charts
  const initializeCharts = () => {
    try {
      if (data.value?.pullsPerBanner) {
        createPullsPerBannerChart(data.value.pullsPerBanner)
      }
      if (data.value?.fiveStarDistribution) {
        createFiveStarDistributionChart(data.value.fiveStarDistribution)
      }
      if (data.value?.fourStarType2Distribution) {
        createFourStarType2Chart(data.value.fourStarType2Distribution)
      }
      if (data.value?.fourStarType3Distribution) {
        createFourStarType3Chart(data.value.fourStarType3Distribution)
      }
      if (firstItemData.value) {
        createFirstItemDistributionChart(firstItemData.value)
      }
    } catch (error) {
      console.error('Error initializing charts:', error)
    }
  }

  const goToSelectedBannerStats = () => {
    if (!bannerStatsPath.value) return
    const outfitDetails = getSelectedOutfitDetails()
    if (outfitDetails?.outfitId) {
      storedSelectedScopeValue.value = [
        outfitDetails.bannerId,
        outfitDetails.quality,
        outfitDetails.outfitId,
      ].join(':')
    }

    navigateTo(bannerStatsPath.value)
  }

  // Function to manually update pulls per banner chart when banner type selection changes
  const updatePullsPerBannerChart = () => {
    if (data.value?.pullsPerBanner && import.meta.client) {
      createPullsPerBannerChart(data.value.pullsPerBanner)
    }
  }

  const createPullsPerBannerChart = (
    chartData: Record<string, [number, number, number]>
  ) => {
    if (!chartData) return
    // chartData: { [bannerId]: [3star, 4star, 5star] }
    // Filter banners based on selected type, latest banner, and recent toggle
    const filteredChartData =
      selectedBannerType.value === 1
        ? Object.fromEntries(
            Object.entries(chartData).filter(([bannerId]) => {
              const id = parseInt(bannerId)
              return (
                id <= latestBannerId &&
                (showAllBanners.value || checkBannerRuns(id))
              )
            })
          )
        : Object.fromEntries(
            Object.entries(chartData).filter(([bannerId]) => {
              const id = parseInt(bannerId)
              return (
                id <= latestBannerId &&
                BANNER_DATA[id]?.bannerType ===
                  Number(selectedBannerType.value) &&
                (showAllBanners.value || checkBannerRuns(id))
              )
            })
          )

    const bannerLabels = Object.keys(filteredChartData).map((bannerId) => {
      const banner = BANNER_DATA[parseInt(bannerId)]
      return banner?.bannerId ? t(`banner.${banner.bannerId}.name`) : ''
    })

    // Each value in filteredChartData is expected to be [number, number, number]
    type BannerPulls = [number, number, number]

    const data3Star = Object.values(filteredChartData).map(
      (arr) => (arr as BannerPulls)[0]
    )
    const data4Star = Object.values(filteredChartData).map(
      (arr) => (arr as BannerPulls)[1]
    )
    const data5Star = Object.values(filteredChartData).map(
      (arr) => (arr as BannerPulls)[2]
    )

    const textStyle = getChartTextStyle()

    pullsPerBannerChartHeight.value = getMobileBannerChartHeight(
      bannerLabels.length,
      120,
      28
    )
    pullsPerBannerChartOption.value = {
      textStyle: textStyle,

      tooltip: {
        trigger: 'axis',
        confine: true,
        formatter: function (params: ChartFormatterParams[]) {
          const bannerId =
            Object.keys(filteredChartData)[params[0]?.dataIndex || 0]
          const banner = BANNER_DATA[parseInt(bannerId || '0')]
          const pullsArr = filteredChartData[bannerId || '']
          if (!pullsArr) return ''
          const total = pullsArr.reduce((a: number, b: number) => a + b, 0)
          const imageUrl = nuxtImg(
            getImageSrc('bannerThumb', bannerId ?? ''),
            {},
            {
              preset: 'bannerThumb',
            }
          )
          return `
                <div style="display: flex; flex-direction: column; align-items: center;">
                  <div style="margin-bottom: 5px; text-align: center; font-weight: bold;">
                    ${banner?.bannerId ? t(`banner.${banner.bannerId}.name`) : ''}
                  </div>
                  <div style="margin-bottom: 5px; text-align: left;">
                    ${banner?.bannerType === 2 ? `<span style="color: ${getQualityColor(5)}CC">★★★★★:</span> <strong>${pullsArr[2]}</strong> (${((pullsArr[2] / total) * 100).toFixed(1)}%)<br>` : ''}
                    <span style="color: ${getQualityColor(4)}CC">★★★★:</span> <strong>${pullsArr[1]}</strong> (${((pullsArr[1] / total) * 100).toFixed(1)}%)<br>
                    <span style="color: ${getQualityColor(3)}CC">★★★:</span> <strong>${pullsArr[0]}</strong> (${((pullsArr[0] / total) * 100).toFixed(1)}%)
                  </div>
                  <div style="margin-top: 5px; text-align: center;">
                    ${t('common.total')}: <strong>${total}</strong>
                  </div>
                  <img
                    src="${imageUrl}"
                    alt="${banner?.bannerId ? t(`banner.${banner.bannerId}.name`) : ''}"
                    style="width: ${isMobile.value ? 120 : 200}px; height: ${isMobile.value ? 60 : 100}px; object-fit: cover; border-radius: 4px; margin-top: 8px;"
                  />
                </div>
              `
        },
        backgroundColor: isDark.value ? palette.dark : palette.light,
        borderColor: isDark.value ? '#555' : '#ddd',
        borderWidth: 1,
        padding: 10,
        textStyle: textStyle,
        extraCssText: chartTooltipExtraCssText.value,
      },
      legend: {
        textStyle: {
          ...textStyle,
          fontFamily: "'Segoe UI Symbol', 'Apple Symbols', sans-serif",
          fontSize: 12,
          color: isDark.value ? palette.textDark : palette.textLight,
        },
        inactiveColor: isDark.value ? palette.textLight : palette.textDark,
        icon: 'roundRect',
        itemGap: 16,
        data: ['★★★★★', '★★★★', '★★★'],
        top: 0,
      },
      grid: {
        top: 40,
        bottom: 8,
        left: 8,
        right: 8,
        outerBoundsMode: 'same',
        outerBoundsContain: 'axisLabel',
      },
      xAxis: isMobile.value
        ? {
            type: 'value',
            show: false,
            axisLine: { show: false },
            axisTick: { show: false },
            splitLine: { show: false },
          }
        : {
            type: 'category',
            data: bannerLabels,
            splitLine: {
              show: false,
            },
            axisLabel: {
              fontSize: 12,
              width: 160,
              overflow: 'truncate',
              hideOverlap: true,
              margin: 12,
              rotate: 30,
              ...textStyle,
            },
            axisLine: {
              show: false,
            },
            axisTick: { show: false },
          },
      yAxis: isMobile.value
        ? {
            type: 'category',
            data: bannerLabels,
            inverse: true,
            axisLabel: {
              ...textStyle,
              fontSize: 12,
              width: 100,
              height: 26,
              lineHeight: 13,
              overflow: 'truncate',
              ellipsis: '…',
              interval: 0,
              formatter: createBannerChartLabelFormatter(
                100,
                textStyle.fontFamily
              ),
            },
            axisLine: { show: false },
            axisTick: { show: false },
          }
        : {
            type: 'value',
            show: false,
            splitLine: {
              show: false,
            },
            axisLabel: {
              show: false,
            },
          },
      series: [
        {
          name: '★★★★★',
          type: 'bar',
          stack: 'total',
          barMaxWidth: isMobile.value ? 16 : undefined,
          data: data5Star,
          itemStyle: {
            color: getQualityColor(5) + 'CC',
            borderRadius: [4, 4, 4, 4],
          },
        },
        {
          name: '★★★★',
          type: 'bar',
          stack: 'total',
          barMaxWidth: isMobile.value ? 16 : undefined,
          data: data4Star,
          itemStyle: {
            color: getQualityColor(4) + 'CC',
            borderRadius: [4, 4, 4, 4],
          },
        },
        {
          name: '★★★',
          type: 'bar',
          stack: 'total',
          barMaxWidth: isMobile.value ? 16 : undefined,
          data: data3Star,
          itemStyle: {
            color: getQualityColor(3) + 'CC',
            borderRadius: [4, 4, 4, 4],
          },
        },
      ],
    }
  }

  const createDistributionChart = (
    chartData: Record<string, number>,
    chartType: string,
    color: string
  ) => {
    let labels = Object.keys(chartData)
    let values = Object.values(chartData)

    // Adjust distribution buckets per chart type
    if (chartType === 'fourStarType2') {
      const processedData: Record<string, number> = {}

      Object.entries(chartData).forEach(([pullCount, occurrences]) => {
        const pullNum = parseInt(pullCount)
        if (pullNum >= 12) {
          processedData['12+'] =
            (processedData['12+'] || 0) + (occurrences as number)
        } else {
          processedData[pullCount] = occurrences
        }
      })

      labels = Object.keys(processedData)
      values = Object.values(processedData)
    } else if (chartType === 'fiveStar') {
      const filteredEntries = Object.entries(chartData).filter(
        ([pullCount]) => parseInt(pullCount) <= 20
      )

      labels = filteredEntries.map(([pullCount]) => pullCount)
      values = filteredEntries.map(([, occurrences]) => occurrences as number)
    } else if (chartType === 'fourStarType3') {
      const filteredEntries = Object.entries(chartData).filter(
        ([pullCount]) => parseInt(pullCount) <= 5
      )

      labels = filteredEntries.map(([pullCount]) => pullCount)
      values = filteredEntries.map(([, occurrences]) => occurrences as number)
    }

    const total = values.reduce((sum: number, val: number) => sum + val, 0)

    const cumulativeData = values.map((value, index, array) => {
      const cumulative = array
        .slice(0, index + 1)
        .reduce((sum: number, val: number) => sum + val, 0)
      return ((cumulative as number) / (total as number)) * 100
    })

    const textStyle = getChartTextStyle()

    const chartOption = {
      textStyle: textStyle,

      tooltip: {
        trigger: 'axis',
        confine: true,
        formatter: function (params: ChartFormatterParams[]) {
          const barData = params[0]
          const lineData = params[1]

          if (!barData || !lineData) return ''

          return `
                <div style="display: flex; flex-direction: column;">
                  <div style="font-weight: bold; margin-bottom: 5px;">
                    ${t('common.charts.number_of_pulls')}: ${barData.axisValue}
                  </div>
                  <div>
                    ${t('common.charts.occurrences')}: <strong>${barData.value}</strong>
                  </div>
                  <div>
                    ${t('common.charts.probability')}: <strong>${((barData.value / (total as number)) * 100).toFixed(2)}%</strong>
                  </div>
                  <div>
                    ${t('common.charts.cumulative_probability')}: <strong>${lineData.value.toFixed(2)}%</strong>
                  </div>
                </div>
              `
        },
        backgroundColor: isDark.value ? palette.dark : palette.light,
        borderColor: isDark.value ? '#555' : '#ddd',
        borderWidth: 1,
        padding: 10,
        textStyle: textStyle,
        extraCssText: chartTooltipExtraCssText.value,
      },
      grid: {
        top: 8,
        bottom: 24,
        left: 8,
        right: 8,
        outerBoundsMode: 'same',
        outerBoundsContain: 'axisLabel',
      },
      xAxis: {
        type: 'category',
        data: labels,
        axisLine: {
          show: false,
        },
        axisTick: { show: false },
        axisLabel: { ...textStyle, fontSize: 12, hideOverlap: true },
      },
      yAxis: [
        {
          type: 'value',
          splitLine: {
            show: false,
          },
          axisLabel: {
            show: false,
          },
        },
        {
          type: 'value',
          max: 100,
          splitLine: {
            show: false,
          },
          axisLabel: {
            show: false,
          },
        },
      ],
      series: [
        {
          name: t('common.charts.occurrences'),
          type: 'bar',
          data: values,
          itemStyle: {
            color: color,
            borderRadius: [4, 4, 0, 0],
          },
        },
        {
          name: t('common.charts.cumulative_probability'),
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          data: cumulativeData,
          symbol: 'circle',
          symbolSize: 3,
          lineStyle: {
            color: color.replace('0.5', '0.3'),
          },
          itemStyle: {
            color: color.replace('0.5', '0.3'),
          },
        },
      ],
    }

    return chartOption
  }

  const createFiveStarDistributionChart = (
    chartData: Record<string, number>
  ) => {
    if (!chartData) return
    fiveStarDistributionChartOption.value = createDistributionChart(
      chartData,
      'fiveStar',
      getQualityColor(5) + 'CC'
    )
  }

  const createFourStarType2Chart = (chartData: Record<string, number>) => {
    if (!chartData) return
    fourStarType2ChartOption.value = createDistributionChart(
      chartData,
      'fourStarType2',
      getQualityColor(4) + 'CC'
    )
  }

  const createFourStarType3Chart = (chartData: Record<string, number>) => {
    if (!chartData) return
    fourStarType3ChartOption.value = createDistributionChart(
      chartData,
      'fourStarType3',
      getQualityColor(4) + 'CC'
    )
  }

  const createFirstItemDistributionChart = (
    chartData: FirstItemDistribution
  ) => {
    const parsed = getSelectedOutfitDetails()
    if (!chartData || !parsed) {
      firstItemDistributionChartOption.value = {}
      firstItemDistributionCount.value = 0
      return
    }

    const { bannerId, quality, outfitId } = parsed

    // For type 2 banners, use the special key format (e.g., "30_4" for banner 30, 4-star)
    // For other banners, use the regular banner ID
    let dataKey = bannerId.toString()
    if (BANNER_DATA[bannerId]?.bannerType === 2 && quality === '4') {
      dataKey = `${bannerId}_${quality}`
    }

    const bannerItems = chartData[dataKey]
    if (!bannerItems || bannerItems.length === 0) {
      firstItemDistributionChartOption.value = {}
      firstItemDistributionCount.value = 0
      return
    }

    const outfitItems =
      outfitId && hasOutfit(outfitId) ? OUTFIT_DATA[outfitId].items : []

    const bannerItemsMap = new Map(
      bannerItems.map((item) => [item.itemId, item])
    )
    const outfitItemsSet = new Set(outfitItems)

    const completeBannerItems = outfitItems.length
      ? [
          ...outfitItems.map((itemId) => ({
            users: bannerItemsMap.get(itemId)?.users ?? 0,
            itemId,
          })),
          ...bannerItems.filter((item) => !outfitItemsSet.has(item.itemId)),
        ]
      : [...bannerItems]
    completeBannerItems.sort((a, b) => b.users - a.users)
    firstItemDistributionCount.value = completeBannerItems.length

    // Calculate total for percentage
    const totalOccurrences = completeBannerItems.reduce(
      (sum, item) => sum + item.users,
      0
    )
    const occurrenceValues = completeBannerItems.map((item) => item.users)
    const minOccurrence = Math.min(...occurrenceValues)
    const maxOccurrence = Math.max(...occurrenceValues)
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

    const dataArr = completeBannerItems.map((item) => ({
      value: item.users,
      percentage:
        totalOccurrences > 0
          ? ((item.users / totalOccurrences) * 100).toFixed(2)
          : '0.00',
      itemId: item.itemId,
      itemStyle: {
        color: pickColor(item.users),
      },
    }))
    // Prepare itemId to item mapping for labels
    const itemsData = completeBannerItems.map((item) => item.itemId)
    const richLabels: Record<
      string,
      {
        height: number
        width: number
        backgroundColor: { image: string }
        align: string
        shadowBlur?: number
        shadowColor?: string
        shadowOffsetY?: number
      }
    > = {}
    // Get viewport width to detect mobile vs desktop
    const imageSize = isMobile.value ? 36 : 64
    const imageRequestSize = isMobile.value ? 60 : 120
    // Create rich label for each item
    itemsData.forEach((itemId: string) => {
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
        shadowBlur: isMobile.value ? 8 : 10,
        shadowColor: isDark.value
          ? 'rgba(255, 255, 255, 0.36)'
          : 'rgba(71, 85, 105, 0.26)',
        shadowOffsetY: 1,
      }
    })
    const textStyle = getChartTextStyle()
    // Prepare option
    firstItemDistributionChartOption.value = {
      animationDuration: 500,
      textStyle: textStyle,

      tooltip: {
        trigger: 'axis',
        confine: true,
        formatter: function (params: ChartFormatterParams[]) {
          if (!params[0]?.data?.itemId) return ''
          const itemId = params[0].data.itemId
          return `
                <div style="display: flex; flex-direction: column;">
                  <div style="font-weight: bold; margin-bottom: 5px;">
                    ${t('item.' + itemId + '.name', itemId)}
                  </div>
                  <div>
                    ${t('common.slot')}: <strong>${t(`type.${getItemType(itemId)}`)}</strong>
                  </div>
                  <div>
                    ${t('common.charts.occurrences')}: <strong>${params[0].data.value}</strong>
                  </div>
                  <div>
                    ${t('common.charts.percentage')}: <strong>${params[0].data.percentage}%</strong>
                  </div>
                </div>
              `
        },
        backgroundColor: isDark.value ? palette.dark : palette.light,
        borderColor: isDark.value ? '#555' : '#ddd',
        borderWidth: 1,
        padding: 10,
        textStyle: textStyle,
        extraCssText: chartTooltipExtraCssText.value,
      },
      grid: {
        left: isMobile.value ? 8 : 0,
        right: isMobile.value ? 12 : 0,
        bottom: isMobile.value ? 0 : 12,
        top: 0,
        outerBoundsMode: 'same',
        outerBoundsContain: 'axisLabel',
      },
      xAxis: isMobile.value
        ? {
            type: 'value',
            axisLabel: { show: false },
            axisTick: { show: false },
            axisLine: { show: false },
            splitLine: { show: false },
          }
        : {
            type: 'category',
            data: itemsData,
            axisLabel: {
              show: true,
              formatter: function (value: string) {
                return `{img${value}|}`
              },
              rich: richLabels,
              interval: 0,
              margin: imageSize / 4,
            },
            axisTick: { show: false },
            axisLine: { show: false },
          },
      yAxis: isMobile.value
        ? {
            type: 'category',
            data: itemsData,
            inverse: true,
            axisLabel: {
              show: true,
              formatter: (value: string) => `{img${value}|}`,
              rich: richLabels,
              interval: 0,
              margin: 10,
            },
            axisTick: { show: false },
            axisLine: { show: false },
          }
        : {
            type: 'value',
            nameLocation: 'end',
            nameGap: 10,
            nameTextStyle: { align: 'right' },
            axisLabel: { show: false },
            splitLine: { show: false },
          },
      series: [
        {
          name: t('common.charts.occurrences'),
          type: 'bar',
          barWidth: isMobile.value ? 28 : '60%',
          data: dataArr,
          itemStyle: {
            borderRadius: isMobile.value ? [0, 4, 4, 0] : [4, 4, 4, 4],
          },
        },
      ],
    }
  }
</script>
