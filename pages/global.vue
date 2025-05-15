<template>
  <div class="max-w-7xl mx-auto space-y-4">
    <n-card
      v-if="loading"
      size="small"
      class="rounded-xl"
      :style="cardStyle"
    >
      <!-- Summary Cards Skeleton -->
      <div class="grid grid-cols-2 md:grid-cols-6 gap-2 mb-2">
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
            height="28px"
            width="60%"
            class="mx-auto"
          />
        </n-card>
      </div>

      <!-- Charts Skeleton -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Main Chart Skeleton -->
        <n-card
          size="small"
          class="col-span-1 md:col-span-3 rounded-lg"
          :style="cardStyle"
        >
          <div class="flex justify-between items-center mb-2">
            <n-skeleton
              height="24px"
              width="200px"
            />
            <n-skeleton
              height="24px"
              width="24px"
            />
          </div>
          <n-skeleton height="300px" />
        </n-card>

        <!-- Distribution Charts Skeleton -->
        <n-card
          v-for="i in 3"
          :key="i"
          size="small"
          class="rounded-lg"
          :style="cardStyle"
        >
          <div class="flex justify-between items-center mb-2">
            <n-skeleton
              height="24px"
              width="200px"
            />
            <n-skeleton
              height="24px"
              width="24px"
            />
          </div>
          <n-skeleton height="200px" />
        </n-card>
      </div>
    </n-card>

    <n-card
      v-else
      size="small"
      class="rounded-xl"
      :style="cardStyle"
    >
      <!-- Summary Cards -->
      <div
        v-show="!maximizedChart"
        class="grid grid-cols-2 md:grid-cols-6 gap-2 mb-2"
      >
        <n-card
          size="small"
          class="text-center rounded-md"
          :style="cardStyle"
        >
          <div class="text-sm text-gray-400">
            {{ $t('global.stats.total_pulls') }}
          </div>
          <div class="text-xl font-medium mt-1">
            <n-number-animation
              :from="0"
              :to="totalPulls"
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
            {{ $t('global.stats.unique_users') }}
          </div>
          <div class="text-xl font-medium mt-1">
            <n-number-animation
              :from="0"
              :to="uniqueUserCount"
              :duration="2000"
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
          <div class="text-xl font-medium mt-1">
            <n-number-animation
              :from="0"
              :to="averagePullsTo5Star"
              :duration="1000"
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
          <div class="text-xl font-medium mt-1">
            <n-number-animation
              :from="0"
              :to="averagePullsTo4StarType2"
              :duration="1000"
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
          <div class="text-xl font-medium mt-1">
            <n-number-animation
              :from="0"
              :to="averagePullsTo4StarType3"
              :duration="1000"
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
          <div class="text-xl font-medium mt-1">
            {{ new Date(data.effective_date).toLocaleDateString() }}
          </div>
        </n-card>
      </div>

      <!-- Charts -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Pulls per Banner Chart -->
        <n-card
          v-show="!maximizedChart || maximizedChart === 'pullsPerBanner'"
          size="small"
          :class="[
            'transition-all duration-300',
            maximizedChart === 'pullsPerBanner'
              ? 'col-span-1 sm:col-span-3'
              : 'col-span-1 sm:col-span-3',
          ]"
          :style="cardStyle"
        >
          <div
            :class="[
              'transition-all duration-300',
              maximizedChart === 'pullsPerBanner'
                ? 'h-[calc(100vh-180px)]'
                : 'h-[320px]',
            ]"
            :style="cardStyle"
          >
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
          :class="[
            'transition-all duration-300',
            maximizedChart === 'fiveStar' ? 'col-span-1 sm:col-span-3' : '',
          ]"
          :style="cardStyle"
        >
          <div
            :class="[
              'transition-all duration-300',
              maximizedChart === 'fiveStar'
                ? 'h-[calc(100vh-180px)]'
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
          :class="[
            'transition-all duration-300',
            maximizedChart === 'fourStarType2'
              ? 'col-span-1 sm:col-span-3'
              : '',
          ]"
          :style="cardStyle"
        >
          <div
            :class="[
              'transition-all duration-300',
              maximizedChart === 'fourStarType2'
                ? 'h-[calc(100vh-180px)]'
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
          :class="[
            'transition-all duration-300',
            maximizedChart === 'fourStarType3'
              ? 'col-span-1 sm:col-span-3'
              : '',
          ]"
          :style="cardStyle"
        >
          <div
            :class="[
              'transition-all duration-300',
              maximizedChart === 'fourStarType3'
                ? 'h-[calc(100vh-180px)]'
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

        <!-- First Item Distribution Chart -->
        <n-card
          v-show="!maximizedChart || maximizedChart === 'firstItemDistribution'"
          size="small"
          :class="[
            'transition-all duration-300',
            maximizedChart === 'firstItemDistribution'
              ? 'col-span-1 sm:col-span-3'
              : 'col-span-1 sm:col-span-3',
          ]"
          :style="cardStyle"
        >
          <div
            :class="[
              'transition-all duration-300',
              maximizedChart === 'firstItemDistribution'
                ? 'h-[calc(100vh-180px)]'
                : 'h-[200px]',
            ]"
            :style="cardStyle"
          >
            <n-select
              v-model:value="selectedBannerId"
              :options="bannerOptions"
              :show-checkmark="false"
              class="absolute top-2 right-12 z-10"
              size="small"
              style="width: 200px"
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
              @rendered="handleChartRendered"
            />
          </div>
        </n-card>
      </div>
    </n-card>
  </div>
</template>

<script setup>
  import { ref, onMounted, computed, onUnmounted, watch } from 'vue'
  import { NSkeleton, NNumberAnimation, NButton, NSelect } from 'naive-ui'
  import { BANNER_DATA } from '~/data/banners'
  import { ExpandAlt, CompressAlt } from '@vicons/fa'
  import { useSupabaseClient } from '~/composables/useSupabaseClient'
  import { useCardStyle } from '~/composables/useCardStyle'
  import { useUserStore } from '~/stores/user'

  // Initialize Supabase client
  const supabase = useSupabaseClient('client')
  const userStore = useUserStore()

  // Add isDark computed property
  const isDark = computed(() => userStore.getCurrentTheme === 'dark')

  // Initialize i18n
  const { t } = useI18n()

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

  const isMobile = ref(false)
  const maximizedChart = ref(null)

  const checkMobile = () => {
    isMobile.value = window?.innerWidth < 768
  }

  // Add banner selector related refs
  const selectedBannerId = ref(Object.keys(BANNER_DATA).pop())
  const bannerOptions = computed(() => {
    if (!data.value?.first_item_distribution) return []

    return Object.keys(data.value.first_item_distribution)
      .map((id) => {
        const banner = BANNER_DATA[parseInt(id)]
        return {
          label: t(`banner.${banner.bannerId}.name`),
          value: id,
        }
      })
      .reverse()
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
      const { data: responseData, error } = await supabase.functions.invoke(
        'cache-json-data',
        {
          method: 'GET',
        }
      )

      if (error) {
        console.error('Supabase function error:', error)
        throw error
      }

      if (!responseData) {
        throw new Error('No data received from function')
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

  const createPullsPerBannerChart = (chartData) => {
    const bannerLabels = Object.keys(chartData).map((bannerId) => {
      const banner = BANNER_DATA[parseInt(bannerId)]
      return t(`banner.${banner.bannerId}.name`)
    })

    const data3Star = Object.entries(chartData).map(
      ([_, pulls]) => pulls['3_star']
    )
    const data4Star = Object.entries(chartData).map(
      ([_, pulls]) => pulls['4_star']
    )
    const data5Star = Object.entries(chartData).map(
      ([_, pulls]) => pulls['5_star']
    )

    pullsPerBannerChartOption.value = {
      title: {
        text: t('global.charts.pulls_per_banner'),
        left: 'center',
        top: 10,
        textStyle: {
          color: isDark.value ? '#e4e5e7' : '#797a7c',
          fontSize: 16,
          fontWeight: 'bold',
        },
      },
      textStyle: {
        fontFamily: 'Roboto, system-ui, -apple-system, sans-serif',
        color: isDark.value ? '#e4e5e7' : '#797a7c',
      },
      tooltip: {
        trigger: 'axis',
        triggerOn: 'click',
        confine: true,
        formatter: function (params) {
          const bannerId = Object.keys(chartData)[params[0].dataIndex]
          const banner = BANNER_DATA[parseInt(bannerId)]
          const bannerData = chartData[bannerId]

          return `
            <div style="display: flex; flex-direction: column; align-items: center;">
              <div style="margin-bottom: 5px; text-align: center; font-weight: bold;">
                ${t(`banner.${banner.bannerId}.name`)}
              </div>
              <div style="margin-bottom: 5px; text-align: left;">
                <span style="color: rgb(245, 158, 11)">★★★★★:</span> <strong>${bannerData['5_star']}</strong> (${((bannerData['5_star'] / bannerData.total) * 100).toFixed(1)}%)<br>
                <span style="color: rgb(139, 92, 246)">★★★★:</span> <strong>${bannerData['4_star']}</strong> (${((bannerData['4_star'] / bannerData.total) * 100).toFixed(1)}%)<br>
                <span style="color: rgb(107, 114, 128)">★★★:</span> <strong>${bannerData['3_star']}</strong> (${((bannerData['3_star'] / bannerData.total) * 100).toFixed(1)}%)
              </div>
              <div style="margin-top: 5px; text-align: center;">
                ${t('global.charts.total')}: <strong>${bannerData.total}</strong>
              </div>
              <img 
                src="/images/banners/${bannerId}.webp" 
                alt="${t(`banner.${banner.bannerId}.name`)}" 
                style="width: 200px; height: 80px; object-fit: cover; border-radius: 4px; margin-top: 8px;"
              />
            </div>
          `
        },
        backgroundColor: isDark.value
          ? 'rgba(38, 38, 38, 0.8)'
          : 'rgba(255, 255, 255, 0.9)',
        borderColor: isDark.value ? '#555' : '#ddd',
        borderWidth: 1,
        padding: 10,
        textStyle: {
          color: isDark.value ? '#e4e5e7' : '#333',
        },
        extraCssText:
          'box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2); border-radius: 8px;',
      },
      legend: {
        textStyle: {
          color: isDark.value ? '#e4e5e7' : '#797a7c',
        },
        inactiveColor: isDark.value ? '#797a7c' : '#e4e5e7',
        icon: 'circle',
        data: ['★★★★★', '★★★★', '★★★'],
        top: 40,
      },
      grid: {
        top: 80,
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
          rotate: isMobile.value ? 90 : 20,
          formatter: function (value, index) {
            if (
              isMobile.value &&
              BANNER_DATA[parseInt(index) + 2].bannerType === 3
            )
              return ''
            return value
          },
        },
        axisLine: {
          lineStyle: {
            color: isDark.value ? '#797a7c' : '#e4e5e7',
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

    // Calculate cumulative probability
    const cumulativeData = values.map((value, index, array) => {
      const total = array.reduce((sum, val) => sum + val, 0)
      const cumulative = array
        .slice(0, index + 1)
        .reduce((sum, val) => sum + val, 0)
      return (cumulative / total) * 100
    })

    const chartOption = {
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
          color: isDark.value ? '#e4e5e7' : '#797a7c',
          fontSize: 16,
          fontWeight: 'bold',
        },
      },
      textStyle: {
        fontFamily: 'Roboto, system-ui, -apple-system, sans-serif',
        color: isDark.value ? '#e4e5e7' : '#797a7c',
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
                ${t('global.charts.probability')}: <strong>${lineData.value.toFixed(2)}%</strong>
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
        textStyle: {
          color: isDark.value ? '#e4e5e7' : '#333',
        },
        extraCssText:
          'box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2); border-radius: 8px;',
      },
      grid: {
        top: 0,
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
            color: isDark.value ? '#797a7c' : '#e4e5e7',
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
          name:
            chartType === 'fiveStar'
              ? t('global.charts.five_star_pulls')
              : chartType === 'fourStarType2'
                ? t('global.charts.four_star_pulls_type2')
                : t('global.charts.four_star_pulls_type3'),
          type: 'bar',
          data: values,
          itemStyle: {
            color: color,
            borderRadius: [4, 4, 0, 0],
          },
        },
        {
          name: t('global.charts.probability'),
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          data: cumulativeData,
          symbol: 'circle', // or 'rect', 'diamond', 'none', etc.
          symbolSize: 3,
          lineStyle: {
            color: color.replace('0.8', '0.5'),
          },
          itemStyle: {
            color: color.replace('0.8', '0.5'),
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

    // Prepare data
    const data = bannerItems.map((item) => ({
      value: item.occurrences,
      percentage: item.percentage,
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

    // Prepare option
    firstItemDistributionChartOption.value = {
      title: {
        text: t('global.charts.first_item_distribution'),
        left: 'center',
        top: isMobile.value ? 40 : 0,
        textStyle: {
          color: isDark.value ? '#e4e5e7' : '#797a7c',
          fontSize: 16,
          fontWeight: 'bold',
        },
      },
      tooltip: {
        trigger: 'item',
        confine: true,
        formatter: function (params) {
          return `
            <div style="display: flex; flex-direction: column;">
              <div style="font-weight: bold; margin-bottom: 5px;">
                ${t('item.' + params.data.itemId + '.name', params.data.itemId)}
              </div>
              <div>
                ${t('global.charts.type')}: <strong>${t(`items.types.${getItemType(params.data.itemId)}`)}</strong>
              </div>
              <div>
                ${t('global.charts.occurrences')}: <strong>${params.data.value}</strong>
              </div>
              <div>
                ${t('global.charts.percentage')}: <strong>${params.data.percentage}%</strong>
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
        textStyle: {
          color: isDark.value ? '#e4e5e7' : '#333',
        },
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

  // Function to handle chart rendered event and add images
  const handleChartRendered = () => {
    // We don't need this anymore as we're setting the images in the chart options directly
    if (
      !firstItemDistributionChart.value ||
      !data.value?.first_item_distribution ||
      !selectedBannerId.value ||
      !data.value.first_item_distribution[selectedBannerId.value]
    ) {
      return
    }

    // No need to modify the chart after it's rendered
    // All configuration is done in createFirstItemDistributionChart
  }

  // Create a named function for the resize handler
  const handleResize = () => {
    checkMobile()

    if (data.value?.first_item_distribution && selectedBannerId.value) {
      createFirstItemDistributionChart(data.value.first_item_distribution)
    }

    // Update the pullsPerBannerChart when window is resized
    if (data.value?.pulls_per_banner) {
      createPullsPerBannerChart(data.value.pulls_per_banner)
    }
  }

  // Watch for theme changes to update charts
  watch(isDark, () => {
    if (data.value && !loading.value) {
      initializeCharts()
    }
  })

  onMounted(() => {
    checkMobile()
    fetchGlobalData()

    // Add resize event listener to handle responsive chart
    window.addEventListener('resize', handleResize)
  })

  // Clean up resize event listener on component unmount
  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
  })
</script>
