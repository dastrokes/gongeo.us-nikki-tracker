<template>
  <div class="max-w-7xl mx-auto space-y-2 sm:space-y-4">
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

    <template v-if="!loading">
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
                :time="new Date(data.effective_date)"
                type="date"
              />
            </div>
          </n-card>
        </div>
      </n-card>

      <n-card
        v-if="!loading"
        size="small"
        class="rounded-xl"
        :class="maximizedChart ? '!mt-0 !mb-0' : ''"
        :style="cardStyle"
      >
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Pulls per Banner Chart -->
          <n-card
            v-show="!maximizedChart || maximizedChart === 'pullsPerBanner'"
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
              <n-select
                v-model:value="selectedBannerType"
                :options="bannerTypeOptions"
                :show-checkmark="false"
                class="absolute top-2 right-12 z-10 w-40"
                size="small"
                @update:value="updatePullsPerBannerChart"
              />
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
                :type="
                  maximizedChart === 'fourStarType2' ? 'primary' : 'default'
                "
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
                :type="
                  maximizedChart === 'fourStarType3' ? 'primary' : 'default'
                "
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

          <!-- First Item Distribution Chart -->
          <n-card
            v-show="
              !maximizedChart || maximizedChart === 'firstItemDistribution'
            "
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
              <n-select
                v-model:value="selectedBannerId"
                :options="bannerOptions"
                :show-checkmark="false"
                class="absolute top-2 right-12 z-10 w-40"
                size="small"
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
        </div>
      </n-card>
    </template>
  </div>
</template>

<script setup>
  import { ref, onMounted, computed, watch } from 'vue'
  import { NSkeleton, NNumberAnimation, NButton, NSelect } from 'naive-ui'
  import { BANNER_DATA } from '~/data/banners'
  import { ExpandAlt, CompressAlt, ExclamationCircle } from '@vicons/fa'
  import { useCardStyle } from '~/composables/useCardStyle'
  import { useUserStore } from '~/stores/user'
  import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'

  // Initialize stores
  const userStore = useUserStore()

  // Initialize breakpoints
  const breakpoints = useBreakpoints(breakpointsTailwind)
  const isMobile = ref(false) // Default to false for SSR

  onMounted(() => {
    // Set up the reactive mobile detection only on client-side
    isMobile.value = !breakpoints.greater('sm').value
    watch(
      () => breakpoints.greater('sm').value,
      (isGreater) => {
        isMobile.value = !isGreater
      }
    )
  })

  // Add isDark computed property
  const isDark = computed(() => userStore.getCurrentTheme === 'dark')

  // Create a minimal global chart text style
  const getChartTextStyle = () => ({
    fontFamily: getComputedStyle(document.documentElement).getPropertyValue(
      '--font-family-default'
    ),
    color: isDark.value ? '#e4e5e7' : '#5c5c5e',
  })

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

  const loading = ref(true)
  const data = ref(null)
  const totalPulls = ref(0)
  const uniqueUserCount = ref(0)
  const averagePullsTo5Star = ref(0)
  const averagePullsTo4StarType2 = ref(0)
  const averagePullsTo4StarType3 = ref(null)

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

  const maximizedChart = ref(null)

  // Add banner selector related refs
  const selectedBannerId = ref(
    Number(Object.keys(BANNER_DATA)[Object.keys(BANNER_DATA).length - 1])
  )
  const selectedBannerType = ref('all')
  const bannerTypeOptions = computed(() => [
    { label: t('global.charts.all_banners'), value: 'all' },
    { label: t('global.charts.five_star_banners'), value: 2 },
    { label: t('global.charts.four_star_banners'), value: 3 },
  ])
  const bannerOptions = computed(() => {
    return Object.entries(BANNER_DATA)
      .filter(([id]) => id !== '1')
      .map(([id, banner]) => ({
        label: t(`banner.${banner.bannerId}.name`),
        value: Number(id),
      }))
      .reverse()
  })

  // Add computed property to check if banner has pulls older than 180 days
  const checkBannerRuns = computed(() => {
    if (!selectedBannerId.value || !BANNER_DATA[selectedBannerId.value])
      return false

    const banner = BANNER_DATA[selectedBannerId.value]
    if (!banner.runs || banner.runs.length === 0) return false

    // Check if any run of this banner started more than 180 days ago
    const daysAgo180 = new Date()
    daysAgo180.setDate(daysAgo180.getDate() - 180)

    // Check each run to see if any of them started more than 180 days ago
    return banner.runs.some((run) => {
      const runStartDate = new Date(run.start)
      return runStartDate < daysAgo180
    })
  })

  // Function to manually update first item chart when banner selection changes
  const updateFirstItemChart = (newBannerId) => {
    if (data.value?.first_item_distribution && newBannerId) {
      createFirstItemDistributionChart(data.value.first_item_distribution)
    }
  }

  const { cardStyle } = useCardStyle()

  const fetchGlobalData = async () => {
    try {
      const response = await fetch('/api/data')

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`)
      }

      const responseData = await response.json()

      if (!responseData) {
        throw new Error('No data received from API')
      }

      data.value = responseData

      // Update reactive values
      totalPulls.value = data.value.total_pulls
      uniqueUserCount.value = data.value.unique_user_count
      averagePullsTo5Star.value = data.value.average_pulls_to_obtain_5star
      averagePullsTo4StarType2.value =
        data.value.average_pulls_to_obtain_4star_banner_type_2
      averagePullsTo4StarType3.value =
        data.value.average_pulls_to_obtain_4star_banner_type_3

      // Initialize all charts after data is loaded
      initializeCharts()
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      loading.value = false
    }
  }

  // New method to initialize all charts at once
  const initializeCharts = () => {
    if (!data.value) return

    try {
      createPullsPerBannerChart(data.value.pulls_per_banner)
      createFiveStarDistributionChart(data.value.five_star_pulls_distribution)
      createFourStarType2Chart(
        data.value.four_star_pulls_distribution_banner_type_2
      )
      createFourStarType3Chart(
        data.value.four_star_pulls_distribution_banner_type_3
      )

      // Add first item distribution chart
      if (data.value.first_item_distribution && selectedBannerId.value) {
        createFirstItemDistributionChart(data.value.first_item_distribution)
      }
    } catch (error) {
      console.error('Error initializing charts:', error)
    }
  }

  const toggleMaximize = (chartId) => {
    maximizedChart.value = maximizedChart.value === chartId ? null : chartId
  }

  // Function to manually update pulls per banner chart when banner type selection changes
  const updatePullsPerBannerChart = () => {
    if (data.value?.pulls_per_banner) {
      createPullsPerBannerChart(data.value.pulls_per_banner)
    }
  }

  const createPullsPerBannerChart = (chartData) => {
    // Filter banners based on selected type
    const filteredChartData =
      selectedBannerType.value === 'all'
        ? chartData
        : Object.fromEntries(
            Object.entries(chartData).filter(
              ([bannerId]) =>
                BANNER_DATA[parseInt(bannerId)].bannerType ===
                selectedBannerType.value
            )
          )

    const bannerLabels = Object.keys(filteredChartData).map((bannerId) => {
      const banner = BANNER_DATA[parseInt(bannerId)]
      return t(`banner.${banner.bannerId}.name`)
    })

    const data3Star = Object.entries(filteredChartData).map(
      ([_, pulls]) => pulls['3_star']
    )
    const data4Star = Object.entries(filteredChartData).map(
      ([_, pulls]) => pulls['4_star']
    )
    const data5Star = Object.entries(filteredChartData).map(
      ([_, pulls]) => pulls['5_star']
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
        formatter: function (params) {
          const bannerId = Object.keys(filteredChartData)[params[0].dataIndex]
          const banner = BANNER_DATA[parseInt(bannerId)]
          const bannerData = filteredChartData[bannerId]

          return `
              <div style="display: flex; flex-direction: column; align-items: center;">
                <div style="margin-bottom: 5px; text-align: center; font-weight: bold;">
                  ${t(`banner.${banner.bannerId}.name`)}
                </div>
                <div style="margin-bottom: 5px; text-align: left;">
                  ${bannerData['5_star'] ? `<span style="color: rgb(245, 158, 11, 0.5)">★★★★★:</span> <strong>${bannerData['5_star']}</strong> (${((bannerData['5_star'] / bannerData.total) * 100).toFixed(1)}%)<br>` : ''}
                  ${bannerData['4_star'] ? `<span style="color: rgb(139, 92, 246, 0.5)">★★★★:</span> <strong>${bannerData['4_star']}</strong> (${((bannerData['4_star'] / bannerData.total) * 100).toFixed(1)}%)<br>` : ''}
                  ${bannerData['3_star'] ? `<span style="color: rgb(107, 114, 128, 0.5)">★★★:</span> <strong>${bannerData['3_star']}</strong> (${((bannerData['3_star'] / bannerData.total) * 100).toFixed(1)}%)` : ''}
                </div>
                <div style="margin-top: 5px; text-align: center;">
                  ${t('global.charts.total')}: <strong>${bannerData.total}</strong>
                </div>
                <img
                  src="/images/banners/thumbnails/${bannerId}.webp"
                  alt="${t(`banner.${banner.bannerId}.name`)}"
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
        textStyle: textStyle,
        inactiveColor: isDark.value ? '#5c5c5e' : '#e4e5e7',
        icon: 'circle',
        data: ['★★★★★', '★★★★', '★★★'],
        top: isMobile.value ? 60 : 40,
      },
      grid: {
        top: isMobile.value ? 80 : 60,
        bottom: 0,
        left: isMobile.value ? '0%' : '5%',
        right: 0,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: bannerLabels,
        splitLine: {
          show: false,
        },
        axisLabel: {
          margin: 12,
          interval: 0,
          rotate: isMobile.value ? 90 : 30,
          formatter: function (value, index) {
            if (
              isMobile.value &&
              selectedBannerType.value === 'all' &&
              BANNER_DATA[parseInt(index) + 2].bannerType === 3
            )
              return ''
            return value
          },
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

  const createDistributionChart = (chartData, chartType, color) => {
    const labels = Object.keys(chartData)
    const values = Object.values(chartData)

    const total = values.reduce((sum, val) => sum + val, 0)

    const cumulativeData = values.map((value, index, array) => {
      const cumulative = array
        .slice(0, index + 1)
        .reduce((sum, val) => sum + val, 0)
      return (cumulative / total) * 100
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
        formatter: function (params) {
          const barData = params[0]
          const lineData = params[1]

          return `
              <div style="display: flex; flex-direction: column;">
                <div style="font-weight: bold; margin-bottom: 5px;">
                  ${t('global.charts.number_of_pulls')}: ${barData.axisValue}
                </div>
                <div>
                  ${t('global.charts.occurrences')}: <strong>${barData.value}</strong>
                </div>
                <div>
                  ${t('global.charts.probability')}: <strong>${((barData.value / total) * 100).toFixed(2)}%</strong>
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
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: labels,
        axisLine: {
          lineStyle: {
            color: isDark.value ? '#5c5c5e' : '#e4e5e7',
          },
        },
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

  const createFiveStarDistributionChart = (chartData) => {
    fiveStarDistributionChartOption.value = createDistributionChart(
      chartData,
      'fiveStar',
      'rgba(245, 158, 11, 0.5)' // amber-500
    )
  }

  const createFourStarType2Chart = (chartData) => {
    fourStarType2ChartOption.value = createDistributionChart(
      chartData,
      'fourStarType2',
      'rgb(139, 92, 246, 0.5)' // violet-500
    )
  }

  const createFourStarType3Chart = (chartData) => {
    fourStarType3ChartOption.value = createDistributionChart(
      chartData,
      'fourStarType3',
      'rgb(139, 92, 246, 0.5)' // violet-500
    )
  }

  const createFirstItemDistributionChart = (chartData) => {
    if (
      !chartData ||
      !selectedBannerId.value ||
      !chartData[selectedBannerId.value]
    ) {
      return null
    }

    const bannerItems = chartData[selectedBannerId.value]

    // Calculate total for percentage
    const totalOccurrences = bannerItems.reduce(
      (sum, item) => sum + item.occurrences,
      0
    )

    // Prepare data
    const data = bannerItems.map((item) => ({
      value: item.occurrences,
      percentage: ((item.occurrences / totalOccurrences) * 100).toFixed(2),
      itemId: item.first_item_id,
    }))

    // Prepare itemId to item mapping for labels
    const itemsData = bannerItems.map((item) => item.first_item_id)
    const richLabels = {}

    // Get viewport width to detect mobile vs desktop
    const imageSize = isMobile.value ? 36 : 80

    // Create rich label for each item with loading image initially
    itemsData.forEach((itemId) => {
      richLabels[`img${itemId}`] = {
        height: imageSize,
        width: imageSize,
        borderRadius: 8,
        backgroundColor: {
          image: `/images/loading.webp`,
        },
        align: 'center',
      }

      // Preload the actual image
      const img = new Image()
      img.onload = () => {
        // Update the chart with the loaded image
        if (richLabels[`img${itemId}`]) {
          richLabels[`img${itemId}`].backgroundColor.image =
            `/images/items/${itemId}.webp`
          // Force chart update
          if (firstItemDistributionChart.value) {
            firstItemDistributionChart.value.setOption({
              xAxis: {
                axisLabel: {
                  rich: richLabels,
                },
              },
            })
          }
        }
      }
      img.src = `/images/items/${itemId}.webp`
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
        formatter: function (params) {
          return `
              <div style="display: flex; flex-direction: column;">
                <div style="font-weight: bold; margin-bottom: 5px;">
                  ${t('item.' + params[0].data.itemId + '.name', params[0].data.itemId)}
                </div>
                <div>
                  ${t('global.charts.type')}: <strong>${t(`items.types.${getItemType(params[0].data.itemId)}`)}</strong>
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
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: itemsData,
        axisLabel: {
          show: true,
          formatter: function (value) {
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
        name: t('global.charts.occurrences'),
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
          data: data,
          itemStyle: {
            color: 'rgb(79, 70, 229, 0.5)', // indigo-600
            borderRadius: [4, 4, 4, 4],
          },
        },
      ],
    }
  }

  // Watch for theme changes to update charts
  watch(isDark, () => {
    if (data.value && !loading.value) {
      initializeCharts()
    }
  })

  // Watch for breakpoint changes to update responsive charts
  watch(isMobile, () => {
    if (data.value?.first_item_distribution && selectedBannerId.value) {
      createFirstItemDistributionChart(data.value.first_item_distribution)
    }

    if (data.value?.pulls_per_banner) {
      createPullsPerBannerChart(data.value.pulls_per_banner)
    }
  })

  onMounted(() => {
    fetchGlobalData()
  })
</script>
