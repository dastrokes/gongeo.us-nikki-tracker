<template>
  <div class="max-w-7xl mx-auto space-y-2 sm:space-y-4">
    <!-- Loading State -->
    <template v-if="loading">
      <n-card
        size="small"
        class="rounded-xl"
        content-class="!p-2 sm:!p-4"
        :style="cardStyle"
      >
        <!-- Summary Cards Skeleton -->
        <div class="grid grid-cols-2 md:grid-cols-6 gap-2">
          <n-card
            v-for="i in 6"
            :key="i"
            size="small"
            class="text-center rounded-md"
            :style="cardStyle"
          >
            <n-skeleton
              height="20px"
              width="80%"
              class="mb-2 mx-auto"
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
        :style="cardStyle"
      >
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Pulls per Banner Chart Skeleton -->
          <n-card
            size="small"
            class="col-span-1 md:col-span-3"
            :style="cardStyle"
          >
            <div class="flex justify-center items-center mb-4">
              <n-skeleton
                height="24px"
                width="160px"
              />
              <n-skeleton
                height="24px"
                width="24px"
              />
            </div>
            <n-skeleton height="280px" />
          </n-card>
        </div>
      </n-card>
      <n-card
        size="small"
        class="rounded-xl"
        :style="cardStyle"
      >
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Distribution Charts Skeleton -->
          <n-card
            v-for="i in 3"
            :key="i"
            size="small"
            :style="cardStyle"
          >
            <div class="flex justify-between items-center mb-4">
              <n-skeleton
                height="24px"
                width="160px"
              />
              <n-skeleton
                height="24px"
                width="24px"
              />
            </div>
            <n-skeleton height="160px" />
          </n-card>
        </div>
      </n-card>
    </template>

    <div v-else>
      <!-- Summary Cards -->
      <n-card
        v-show="!maximizedChart"
        content-class="!p-2 sm:!p-4"
        size="small"
        class="rounded-xl bg-gray-100 dark:bg-gray-800"
        :style="cardStyle"
      >
        <div class="grid grid-cols-2 md:grid-cols-6 gap-2">
          <n-card
            size="small"
            class="text-center rounded-md"
            :style="cardStyle"
          >
            <div class="text-sm text-gray-400">
              {{ $t('global.stats.total_pulls') }}
            </div>
            <div class="text-lg font-medium Cookie mt-1">
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
            class="text-center rounded-md"
            :style="cardStyle"
          >
            <div class="text-sm text-gray-400">
              {{ $t('global.stats.unique_users') }}
            </div>
            <div class="text-lg font-medium Cookie mt-1">
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
            class="text-center rounded-md"
            :style="cardStyle"
          >
            <div class="text-sm text-gray-400">
              {{ $t('global.stats.avg_5star') }}
            </div>
            <div class="text-lg font-medium Cookie mt-1">
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
            class="text-center rounded-md"
            :style="cardStyle"
          >
            <div class="text-sm text-gray-400">
              {{ $t('global.stats.avg_4star_type2') }}
            </div>
            <div class="text-lg font-medium Cookie mt-1">
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
            class="text-center rounded-md"
            :style="cardStyle"
          >
            <div class="text-sm text-gray-400">
              {{ $t('global.stats.avg_4star_type3') }}
            </div>
            <div class="text-lg font-medium Cookie mt-1">
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
            class="text-center rounded-md"
            :style="cardStyle"
          >
            <div class="text-sm text-gray-400">
              {{ $t('global.stats.data_as_of') }}
            </div>
            <div class="text-lg font-medium Cookie mt-1">
              <n-time
                v-if="data?.d"
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
        class="rounded-xl mt-2 sm:mt-4"
        :class="maximizedChart ? '!mt-0 !mb-0' : ''"
        :style="cardStyle"
      >
        <!-- Pulls per Banner Chart -->
        <n-card
          size="small"
          class="transition-all duration-300"
          :class="[
            maximizedChart === 'pullsPerBanner'
              ? 'col-span-1 sm:col-span-3'
              : 'col-span-1 sm:col-span-3',
          ]"
          :style="cardStyle"
        >
          <div
            class="transition-all duration-300"
            :class="[
              maximizedChart === 'pullsPerBanner'
                ? 'h-[calc(100vh-210px)] sm:h-[calc(100vh-160px)]'
                : 'h-[320px]',
            ]"
            :style="cardStyle"
          >
            <div class="absolute top-2 right-16 z-10 flex items-center gap-2">
              <n-switch
                v-model:value="showAllBanners"
                size="small"
                @update:value="updatePullsPerBannerChart"
              >
                <template #checked>
                  {{ $t('global.charts.all_time') }}
                </template>
                <template #unchecked>
                  {{ $t('global.charts.recent_only') }}
                </template>
              </n-switch>
              <n-select
                v-model:value="selectedBannerType"
                :options="bannerTypeOptions"
                :show-checkmark="false"
                class="w-32"
                size="small"
                @update:value="updatePullsPerBannerChart"
              />
            </div>
            <n-button
              size="tiny"
              text
              class="absolute top-4 right-4 z-10"
              :type="
                maximizedChart === 'pullsPerBanner' ? 'primary' : 'default'
              "
              @click="toggleMaximize('pullsPerBanner')"
            >
              <template #icon>
                <n-icon>
                  <component
                    :is="
                      maximizedChart === 'pullsPerBanner'
                        ? CompressAlt
                        : ExpandAlt
                    "
                  />
                </n-icon>
              </template>
            </n-button>
            <VChart
              id="pullsPerBannerChart"
              ref="pullsPerBannerChart"
              :option="pullsPerBannerChartOption"
              :autoresize="true"
              :style="cardStyle"
            />
          </div>
        </n-card>
      </n-card>

      <n-card
        v-show="
          !maximizedChart ||
          maximizedChart === 'fiveStar' ||
          maximizedChart === 'fourStarType2' ||
          maximizedChart === 'fourStarType3'
        "
        size="small"
        class="rounded-xl mt-2 sm:mt-4"
        content-class="grid grid-cols-1 md:grid-cols-3 gap-4"
        :class="maximizedChart ? '!mt-0 !mb-0' : ''"
        :style="cardStyle"
      >
        <!-- 5★ Distribution Chart -->
        <n-card
          v-show="!maximizedChart || maximizedChart === 'fiveStar'"
          size="small"
          class="transition-all duration-300"
          :class="[
            maximizedChart === 'fiveStar' ? 'col-span-1 sm:col-span-3' : '',
          ]"
          :style="cardStyle"
        >
          <div
            class="transition-all duration-300"
            :class="[
              maximizedChart === 'fiveStar'
                ? 'h-[calc(100vh-210px)] sm:h-[calc(100vh-160px)]'
                : 'h-[200px]',
            ]"
            :style="cardStyle"
          >
            <n-button
              size="tiny"
              text
              class="absolute top-4 right-4 z-10"
              :type="maximizedChart === 'fiveStar' ? 'primary' : 'default'"
              @click="toggleMaximize('fiveStar')"
            >
              <template #icon>
                <n-icon>
                  <component
                    :is="
                      maximizedChart === 'fiveStar' ? CompressAlt : ExpandAlt
                    "
                  />
                </n-icon>
              </template>
            </n-button>
            <VChart
              id="fiveStarDistributionChart"
              ref="fiveStarDistributionChart"
              :option="fiveStarDistributionChartOption"
              :autoresize="true"
              :style="cardStyle"
            />
          </div>
        </n-card>

        <!-- 4★ Distribution Type 2 Chart -->
        <n-card
          v-show="!maximizedChart || maximizedChart === 'fourStarType2'"
          size="small"
          class="transition-all duration-300"
          :class="[
            maximizedChart === 'fourStarType2'
              ? 'col-span-1 sm:col-span-3'
              : '',
          ]"
          :style="cardStyle"
        >
          <div
            class="transition-all duration-300"
            :class="[
              maximizedChart === 'fourStarType2'
                ? 'h-[calc(100vh-210px)] sm:h-[calc(100vh-160px)]'
                : 'h-[200px]',
            ]"
            :style="cardStyle"
          >
            <n-button
              size="tiny"
              text
              class="absolute top-4 right-4 z-10"
              :type="maximizedChart === 'fourStarType2' ? 'primary' : 'default'"
              @click="toggleMaximize('fourStarType2')"
            >
              <template #icon>
                <n-icon>
                  <component
                    :is="
                      maximizedChart === 'fourStarType2'
                        ? CompressAlt
                        : ExpandAlt
                    "
                  />
                </n-icon>
              </template>
            </n-button>
            <VChart
              id="fourStarType2Chart"
              ref="fourStarType2Chart"
              :option="fourStarType2ChartOption"
              :autoresize="true"
              :style="cardStyle"
            />
          </div>
        </n-card>

        <!-- 4★ Distribution Type 3 Chart -->
        <n-card
          v-show="!maximizedChart || maximizedChart === 'fourStarType3'"
          size="small"
          class="transition-all duration-300"
          :class="[
            maximizedChart === 'fourStarType3'
              ? 'col-span-1 sm:col-span-3'
              : '',
          ]"
          :style="cardStyle"
        >
          <div
            class="transition-all duration-300"
            :class="[
              maximizedChart === 'fourStarType3'
                ? 'h-[calc(100vh-210px)] sm:h-[calc(100vh-160px)]'
                : 'h-[200px]',
            ]"
            :style="cardStyle"
          >
            <n-button
              size="tiny"
              text
              class="absolute top-4 right-4 z-10"
              :type="maximizedChart === 'fourStarType3' ? 'primary' : 'default'"
              @click="toggleMaximize('fourStarType3')"
            >
              <template #icon>
                <n-icon>
                  <component
                    :is="
                      maximizedChart === 'fourStarType3'
                        ? CompressAlt
                        : ExpandAlt
                    "
                  />
                </n-icon>
              </template>
            </n-button>
            <VChart
              id="fourStarType3Chart"
              ref="fourStarType3Chart"
              :option="fourStarType3ChartOption"
              :autoresize="true"
              :style="cardStyle"
            />
          </div>
        </n-card>
      </n-card>

      <n-card
        v-show="!maximizedChart || maximizedChart === 'firstItemDistribution'"
        size="small"
        class="rounded-xl mt-2 sm:mt-4"
        :class="maximizedChart ? '!mt-0 !mb-0' : ''"
        :style="cardStyle"
      >
        <!-- First Item Distribution Chart -->
        <n-card
          size="small"
          class="transition-all duration-300"
          :class="[
            maximizedChart === 'firstItemDistribution'
              ? 'col-span-1 sm:col-span-3'
              : 'col-span-1 sm:col-span-3',
          ]"
          :style="cardStyle"
        >
          <div
            class="transition-all duration-300"
            :class="[
              maximizedChart === 'firstItemDistribution'
                ? 'h-[calc(100vh-210px)] sm:h-[calc(100vh-160px)]'
                : 'h-[200px]',
            ]"
            :style="cardStyle"
          >
            <n-tooltip
              v-if="checkBannerRuns"
              :width="200"
            >
              <template #trigger>
                <n-button
                  size="tiny"
                  text
                  class="absolute top-4 left-4 z-10"
                >
                  <template #icon>
                    <n-icon>
                      <ExclamationCircle />
                    </n-icon>
                  </template>
                </n-button>
              </template>
              {{ t('global.charts.first_item_distribution_tooltip') }}
            </n-tooltip>
            <n-tree-select
              v-model:value="selectedOutfit"
              v-model:expanded-keys="expandedKeys"
              :consistent-menu-width="false"
              :options="firstItemTreeOptions"
              class="absolute top-2 right-12 z-10 w-40"
              size="small"
              :indent="16"
              :override-default-node-click-behavior="override"
              :render-label="renderLabel"
              @update:show="handleDropdownShow"
              @update:value="updateFirstItemChart"
            />

            <n-button
              size="tiny"
              text
              class="absolute top-4 right-4 z-10"
              :type="
                maximizedChart === 'firstItemDistribution'
                  ? 'primary'
                  : 'default'
              "
              @click="toggleMaximize('firstItemDistribution')"
            >
              <template #icon>
                <n-icon>
                  <component
                    :is="
                      maximizedChart === 'firstItemDistribution'
                        ? CompressAlt
                        : ExpandAlt
                    "
                  />
                </n-icon>
              </template>
            </n-button>
            <VChart
              id="firstItemDistributionChart"
              ref="firstItemDistributionChart"
              :option="firstItemDistributionChartOption"
              :autoresize="true"
              :style="cardStyle"
            />
          </div>
        </n-card>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { TreeSelectOption } from 'naive-ui'
  import { BANNER_DATA } from '~/data/banners'
  import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'
  import { ExpandAlt, CompressAlt, ExclamationCircle } from '@vicons/fa'

  // Type definitions for global data structure
  interface GlobalData {
    t?: number // total pulls
    u?: number // unique users
    a5?: number // average pulls to 5-star
    a4_2?: number // average pulls to 4-star type 2
    a4_3?: number // average pulls to 4-star type 3
    d?: string // date
    p?: Record<string, [number, number, number]> // pulls per banner [3star, 4star, 5star]
    f5?: Record<string, number> // 5-star distribution
    f4_2?: Record<string, number> // 4-star type 2 distribution
    f4_3?: Record<string, number> // 4-star type 3 distribution
    f?: Record<string, { o: number; i: string }[]> // first item distribution
  }

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

  // Initialize stores
  const userStore = useUserStore()

  // Initialize breakpoints
  const breakpoints = useBreakpoints(breakpointsTailwind)
  const isMobile = ref(false)

  function override(info: { option: TreeSelectOption }) {
    if (info.option.children) {
      return 'toggleExpand'
    }
    return 'default'
  }

  onMounted(() => {
    watchEffect(() => {
      loading.value = status.value === 'pending'
      isMobile.value = !breakpoints.greater('sm').value
    })

    watch(
      [data, () => isMobile.value, () => isDark.value],
      () => {
        if (data.value && import.meta.client) {
          initializeCharts()
        }
      },
      { immediate: true }
    )
  })

  // Add isDark computed property
  const isDark = computed(() => userStore.getCurrentTheme === 'dark')

  // Chart text style utility
  const getChartTextStyle = () => {
    return {
      fontFamily:
        "'Noto Sans', ui-sans-serif, system-ui, sans-serif, 'Noto Color Emoji', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'",
      color: isDark.value ? '#e4e5e7' : '#5c5c5e',
    }
  }

  // Initialize i18n
  const { t } = useI18n()
  const localePath = useLocalePath()
  const siteUrl = useRuntimeConfig().public.siteUrl

  useHead({
    title: t('navigation.global') + ' - ' + t('navigation.subtitle'),
    meta: [
      {
        name: 'description',
        content: t('meta.description.global'),
      },
      {
        property: 'og:title',
        content: t('navigation.global') + ' - ' + t('navigation.subtitle'),
      },
      {
        property: 'og:description',
        content: t('meta.description.global'),
      },
      {
        property: 'twitter:title',
        content: t('navigation.global') + ' - ' + t('navigation.subtitle'),
      },
      {
        property: 'twitter:description',
        content: t('meta.description.global'),
      },
    ],
    link: [{ rel: 'canonical', href: `${siteUrl}${localePath('/global')}` }],
  })

  // Data fetching
  const { data: globalData, status } = await useFetch(
    'https://fimzdbqulflilnnopibz.supabase.co/storage/v1/object/public/gongeous/data.json',
    {
      key: 'global-data',
      default: () => null,
    }
  )

  // Use computed for data to maintain reactivity
  const data = computed(() => globalData.value as GlobalData | null)
  const loading = ref(true)

  // Computed values for stats (updated for new data.json)
  const totalPulls = computed(() => data.value?.t || 0)
  const uniqueUserCount = computed(() => data.value?.u || 0)
  const averagePullsTo5Star = computed(() => data.value?.a5 || 0)
  const averagePullsTo4StarType2 = computed(() => data.value?.a4_2 || 0)
  const averagePullsTo4StarType3 = computed(() => data.value?.a4_3 || 0)
  const effectiveDate = computed(() =>
    data.value?.d ? new Date(data.value.d) : new Date()
  )

  const pullsPerBannerChart = ref(null)
  const fiveStarDistributionChart = ref(null)
  const fourStarType2Chart = ref(null)
  const fourStarType3Chart = ref(null)
  const firstItemDistributionChart = ref(null)
  const firstItemDistributionChartOption = ref({})
  const pullsPerBannerChartOption = ref({})
  const fiveStarDistributionChartOption = ref({})
  const fourStarType2ChartOption = ref({})
  const fourStarType3ChartOption = ref({})

  const maximizedChart = ref<string | null>(null)
  const selectedOutfit = ref<string | null>(null)
  const latestBannerId = Number(
    Object.keys(BANNER_DATA)[Object.keys(BANNER_DATA).length - 1]
  )
  const latestBanner = BANNER_DATA[latestBannerId]

  if (
    latestBanner?.outfit5StarId?.length &&
    latestBanner.outfit5StarId.length > 0
  ) {
    selectedOutfit.value = `${latestBannerId}_5_${latestBanner.outfit5StarId[0]}`
  } else if (
    latestBanner?.outfit4StarId?.length &&
    latestBanner.outfit4StarId.length > 0
  ) {
    selectedOutfit.value = `${latestBannerId}_4_${latestBanner.outfit4StarId[0]}`
  }

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
  const bannerTypeOptions = computed(() => [
    { label: t('global.charts.all_banners'), value: 1 },
    { label: t('global.charts.five_star_banners'), value: 2 },
    { label: t('global.charts.four_star_banners'), value: 3 },
  ])

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

  // Add computed property to check if banner has pulls older than 180 days
  const checkBannerRuns = computed(() => {
    if (
      !selectedOutfit.value ||
      !BANNER_DATA[Number((selectedOutfit.value as string).split('_')[0])]
    )
      return false

    const banner =
      BANNER_DATA[Number((selectedOutfit.value as string).split('_')[0])]
    if (!banner?.runs || banner.runs.length === 0) return false

    // Check if any run of this banner started more than 180 days ago
    const daysAgo180 = new Date()
    daysAgo180.setDate(daysAgo180.getDate() - 180)

    // Check each run to see if any of them started more than 180 days ago
    return banner.runs.some((run) => {
      const runStartDate = new Date(run.start)
      return runStartDate < daysAgo180
    })
  })

  // Function to manually update first item chart when outfit selection changes
  const updateFirstItemChart = (newOutfitValue: TreeSelectOption) => {
    if (data.value?.f && newOutfitValue) {
      createFirstItemDistributionChart(data.value.f)
    }
  }

  const { cardStyle } = useCardStyle()

  // initialize all charts
  const initializeCharts = () => {
    try {
      if (data.value?.p) createPullsPerBannerChart(data.value.p)
      if (data.value?.f5) createFiveStarDistributionChart(data.value.f5)
      if (data.value?.f4_2) createFourStarType2Chart(data.value.f4_2)
      if (data.value?.f4_3) createFourStarType3Chart(data.value.f4_3)
      if (data.value?.f && selectedOutfit.value) {
        createFirstItemDistributionChart(data.value.f)
      }
    } catch (error) {
      console.error('Error initializing charts:', error)
    }
  }

  const toggleMaximize = (chartId: string | null) => {
    maximizedChart.value = maximizedChart.value === chartId ? null : chartId
  }

  // Function to manually update pulls per banner chart when banner type selection changes
  const updatePullsPerBannerChart = () => {
    if (data.value?.p && import.meta.client) {
      createPullsPerBannerChart(data.value.p)
    }
  }

  // Helper function to check if a banner is recent (within last 6 months)
  const isBannerRecent = (bannerId: number): boolean => {
    const banner = BANNER_DATA[bannerId]
    if (!banner?.runs || banner.runs.length === 0) return false

    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    // Check if any run of this banner started within the last 6 months
    return banner.runs.some((run) => {
      const runStartDate = new Date(run.start)
      return runStartDate >= sixMonthsAgo
    })
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
                (showAllBanners.value || isBannerRecent(id))
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
                (showAllBanners.value || isBannerRecent(id))
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

    pullsPerBannerChartOption.value = {
      textStyle: textStyle,
      title: {
        text: t('global.charts.pulls_per_banner'),
        left: 'center',
        top: isMobile.value ? 35 : 0,
        textStyle: {
          ...textStyle,
          fontSize: 16,
          fontWeight: 'bold',
        },
      },
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
          return `
                <div style="display: flex; flex-direction: column; align-items: center;">
                  <div style="margin-bottom: 5px; text-align: center; font-weight: bold;">
                    ${banner?.bannerId ? t(`banner.${banner.bannerId}.name`) : ''}
                  </div>
                  <div style="margin-bottom: 5px; text-align: left;">
                    ${banner?.bannerType === 2 ? `<span style="color: rgb(245, 158, 11, 0.8)">★★★★★:</span> <strong>${pullsArr[2]}</strong> (${((pullsArr[2] / total) * 100).toFixed(1)}%)<br>` : ''}
                    <span style="color: rgb(139, 92, 246, 0.8)">★★★★:</span> <strong>${pullsArr[1]}</strong> (${((pullsArr[1] / total) * 100).toFixed(1)}%)<br>
                    <span style="color: rgb(107, 114, 128, 0.8)">★★★:</span> <strong>${pullsArr[0]}</strong> (${((pullsArr[0] / total) * 100).toFixed(1)}%)
                  </div>
                  <div style="margin-top: 5px; text-align: center;">
                    ${t('global.charts.total')}: <strong>${total}</strong>
                  </div>
                  <img
                    src="/images/banners/thumbnails/${bannerId}.webp"
                    alt="${banner?.bannerId ? t(`banner.${banner.bannerId}.name`) : ''}"
                    style="width: 200px; height: 100px; object-fit: cover; border-radius: 4px; margin-top: 8px;"
                  />
                </div>
              `
        },
        backgroundColor: isDark.value
          ? 'rgb(75, 85, 99, 0.9)'
          : 'rgba(255, 255, 255, 0.9)',
        borderColor: isDark.value ? '#555' : '#ddd',
        borderWidth: 1,
        padding: 10,
        textStyle: textStyle,
        extraCssText: isDark.value
          ? 'box-shadow: 0 2px 8px rgba(200, 200, 200, 0.12); border-radius: 8px;'
          : 'box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12); border-radius: 8px;',
      },
      legend: {
        textStyle: {
          fontFamily: '"Segoe UI Symbol", "Courier New", system-ui',
          color: isDark.value ? '#e4e5e7' : '#5c5c5e',
        },
        inactiveColor: isDark.value ? '#5c5c5e' : '#e4e5e7',
        icon: 'roundRect',
        data: ['★★★★★', '★★★★', '★★★'],
        top: isMobile.value ? 60 : 40,
      },
      grid: {
        top: isMobile.value ? 120 : 80,
        bottom: 0,
        left: isMobile.value ? '0%' : '5%',
        right: 0,
      },
      xAxis: {
        type: 'category',
        data: bannerLabels,
        splitLine: {
          show: false,
        },
        axisLabel: {
          margin: 12,
          rotate: isMobile.value ? 90 : 30,
          overflow: 'truncate',
          width: 120,
          formatter: (value: string) => value,
          ...textStyle,
        },
        axisLine: {
          lineStyle: {
            color: isDark.value ? '#5c5c5e' : '#e4e5e7',
          },
        },
      },
      yAxis: {
        type: 'value',
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
          data: data5Star,
          itemStyle: {
            color: 'rgba(245, 158, 11, 0.5)', // amber-500
            borderRadius: [4, 4, 4, 4],
          },
        },
        {
          name: '★★★★',
          type: 'bar',
          stack: 'total',
          data: data4Star,
          itemStyle: {
            color: 'rgba(139, 92, 246, 0.5)', // violet-500
            borderRadius: [4, 4, 4, 4],
          },
        },
        {
          name: '★★★',
          type: 'bar',
          stack: 'total',
          data: data3Star,
          itemStyle: {
            color: 'rgba(20, 184, 166, 0.5)', // teal-500
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

    // For 4-star in 5-star banners only, group 12+ together
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
      title: {
        text:
          chartType === 'fiveStar'
            ? t('global.charts.five_star_distribution')
            : chartType === 'fourStarType2'
              ? t('global.charts.four_star_type2_distribution')
              : t('global.charts.four_star_type3_distribution'),
        left: 'left',
        top: 0,
        textStyle: {
          ...textStyle,
          fontSize: 16,
          fontWeight: 'bold',
        },
      },
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
                    ${t('global.charts.number_of_pulls')}: ${barData.axisValue}
                  </div>
                  <div>
                    ${t('global.charts.occurrences')}: <strong>${barData.value}</strong>
                  </div>
                  <div>
                    ${t('global.charts.probability')}: <strong>${((barData.value / (total as number)) * 100).toFixed(2)}%</strong>
                  </div>
                  <div>
                    ${t('global.charts.cumulative_probability')}: <strong>${lineData.value.toFixed(2)}%</strong>
                  </div>
                </div>
              `
        },
        backgroundColor: isDark.value
          ? 'rgb(75, 85, 99, 0.9)'
          : 'rgba(255, 255, 255, 0.9)',
        borderColor: isDark.value ? '#555' : '#ddd',
        borderWidth: 1,
        padding: 10,
        textStyle: textStyle,
        extraCssText: isDark.value
          ? 'box-shadow: 0 2px 8px rgba(200, 200, 200, 0.12); border-radius: 8px;'
          : 'box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12); border-radius: 8px;',
      },
      grid: {
        top: 35,
        bottom: 0,
        left: 30,
        right: 30,
      },
      xAxis: {
        type: 'category',
        data: labels,
        axisLine: {
          lineStyle: {
            color: isDark.value ? '#5c5c5e' : '#e4e5e7',
          },
        },
        axisLabel: textStyle,
      },
      yAxis: [
        {
          type: 'value',
          name: t('global.charts.number_of_pulls'),
          nameLocation: 'middle',
          nameRotate: 90,
          splitLine: {
            show: false,
          },
          axisLabel: {
            show: false,
          },
        },
        {
          type: 'value',
          name: t('global.charts.probability'),
          nameLocation: 'middle',
          nameRotate: 270,
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
          name: t('global.charts.occurrences'),
          type: 'bar',
          data: values,
          itemStyle: {
            color: color,
            borderRadius: [4, 4, 0, 0],
          },
        },
        {
          name: t('global.charts.cumulative_probability'),
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
      'rgba(245, 158, 11, 0.5)' // amber-500
    )
  }

  const createFourStarType2Chart = (chartData: Record<string, number>) => {
    if (!chartData) return
    fourStarType2ChartOption.value = createDistributionChart(
      chartData,
      'fourStarType2',
      'rgb(139, 92, 246, 0.5)' // violet-500
    )
  }

  const createFourStarType3Chart = (chartData: Record<string, number>) => {
    if (!chartData) return
    fourStarType3ChartOption.value = createDistributionChart(
      chartData,
      'fourStarType3',
      'rgb(139, 92, 246, 0.5)' // violet-500
    )
  }

  const createFirstItemDistributionChart = (
    chartData: Record<string, { o: number; i: string }[]>
  ) => {
    if (!chartData || !selectedOutfit.value) {
      // Clear the chart if no outfit is selected
      firstItemDistributionChartOption.value = {}
      return null
    }

    // Parse the selected outfit value to get banner ID, rarity, and outfit ID
    const [bannerId, rarity, _outfitId] = (
      selectedOutfit.value as string
    ).split('_')
    const bannerIdNum = parseInt(bannerId || '0')

    // For type 2 banners, use the special key format (e.g., "30_4" for banner 30, 4-star)
    // For other banners, use the regular banner ID
    let dataKey = bannerIdNum.toString()
    if (BANNER_DATA[bannerIdNum]?.bannerType === 2 && rarity === '4') {
      dataKey = `${bannerId}_${rarity}`
    }

    if (!chartData[dataKey]) {
      return null
    }

    const bannerItems = chartData[dataKey]
    if (!bannerItems) return null
    // Calculate total for percentage
    const totalOccurrences = bannerItems.reduce(
      (sum: number, item: { o: number }) => sum + item.o,
      0
    )
    const dataArr = bannerItems.map((item: { o: number; i: string }) => ({
      value: item.o,
      percentage: ((item.o / totalOccurrences) * 100).toFixed(2),
      itemId: item.i,
    }))
    // Prepare itemId to item mapping for labels
    const itemsData = bannerItems.map((item: { i: string }) => item.i)
    const richLabels: Record<
      string,
      {
        height: number
        width: number
        backgroundColor: { image: string }
        align: string
      }
    > = {}
    // Get viewport width to detect mobile vs desktop
    const imageSize = isMobile.value ? 36 : 80
    // Create rich label for each item
    itemsData.forEach((itemId: string) => {
      richLabels[`img${itemId}`] = {
        height: imageSize,
        width: imageSize,
        backgroundColor: {
          image: `/images/items/${itemId}.webp`,
        },
        align: 'center',
      }
    })
    const textStyle = getChartTextStyle()
    // Prepare option
    firstItemDistributionChartOption.value = {
      textStyle: textStyle,
      title: {
        text: t('global.charts.first_item_distribution'),
        left: 'center',
        top: isMobile.value ? 35 : 0,
        textStyle: {
          ...textStyle,
          fontSize: 16,
          fontWeight: 'bold',
        },
      },
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
                    ${t('global.charts.type')}: <strong>${t(`items.types.${getItemType(itemId)}`)}</strong>
                  </div>
                  <div>
                    ${t('global.charts.occurrences')}: <strong>${params[0].data.value}</strong>
                  </div>
                  <div>
                    ${t('global.charts.percentage')}: <strong>${params[0].data.percentage}%</strong>
                  </div>
                </div>
              `
        },
        backgroundColor: isDark.value
          ? 'rgba(38, 38, 38, 0.8)'
          : 'rgba(255, 255, 255, 0.9)',
        borderColor: isDark.value ? '#555' : '#ddd',
        borderWidth: 1,
        padding: 10,
        textStyle: textStyle,
        extraCssText:
          'box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2); border-radius: 8px;',
      },
      grid: {
        left: 0,
        right: 0,
        bottom: 0,
        top: isMobile.value ? 60 : 40,
      },
      xAxis: {
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
        axisTick: {
          show: false,
        },
        axisLine: {
          show: false,
        },
      },
      yAxis: {
        type: 'value',
        nameLocation: 'end',
        nameGap: 10,
        nameTextStyle: {
          align: 'right',
        },
        axisLabel: {
          show: false,
        },
        splitLine: {
          show: false,
        },
      },
      series: [
        {
          name: t('global.charts.occurrences'),
          type: 'bar',
          barWidth: '60%',
          data: dataArr,
          itemStyle: {
            color: 'rgb(79, 70, 229, 0.5)', // indigo-600
            borderRadius: [4, 4, 4, 4],
          },
        },
      ],
    }
  }
</script>
