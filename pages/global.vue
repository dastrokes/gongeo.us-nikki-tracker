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
          <n-skeleton height="250px" />
        </n-card>

        <!-- Distribution Charts Skeleton -->
        <n-card
          v-for="i in 3"
          :key="i"
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
          <div class="text-sm text-gray-400">Total Pulls</div>
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
          <div class="text-sm text-gray-400">Unique Users</div>
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
          <div class="text-sm text-gray-400">5★ Avg (5★ Banner)</div>
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
          <div class="text-sm text-gray-400">4★ Avg (5★ Banner)</div>
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
          <div class="text-sm text-gray-400">4★ Avg (4★ Banner)</div>
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
          <div class="text-sm text-gray-400">Data as of</div>
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
          :class="[
            'transition-all duration-300',
            maximizedChart === 'pullsPerBanner'
              ? 'col-span-1 sm:col-span-3'
              : 'col-span-1 sm:col-span-3',
          ]"
          :style="cardStyle"
        >
          <div class="flex justify-between items-center mb-2">
            <n-h4 class="text-lg font-semibold">Pulls per Banner</n-h4>
            <n-button
              size="tiny"
              text
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
          </div>
          <div
            :class="[
              'transition-all duration-300',
              maximizedChart === 'pullsPerBanner'
                ? 'h-[calc(100vh-240px)]'
                : 'h-[250px]',
            ]"
            :style="cardStyle"
          >
            <canvas
              ref="pullsPerBannerChart"
              :style="cardStyle"
            />
          </div>
        </n-card>

        <!-- 5★ Distribution Chart -->
        <n-card
          v-show="!maximizedChart || maximizedChart === 'fiveStar'"
          :class="[
            'transition-all duration-300',
            maximizedChart === 'fiveStar' ? 'col-span-1 sm:col-span-3' : '',
          ]"
          :style="cardStyle"
        >
          <div class="flex justify-between items-center mb-2">
            <n-h4 class="text-lg font-semibold">5★ Pulls Distribution</n-h4>
            <n-button
              size="tiny"
              text
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
          </div>
          <div
            :class="[
              'transition-all duration-300',
              maximizedChart === 'fiveStar'
                ? 'h-[calc(100vh-240px)]'
                : 'h-[200px]',
            ]"
            :style="cardStyle"
          >
            <canvas
              ref="fiveStarDistributionChart"
              :style="cardStyle"
            />
          </div>
        </n-card>

        <!-- 4★ Distribution Type 2 Chart -->
        <n-card
          v-show="!maximizedChart || maximizedChart === 'fourStarType2'"
          :class="[
            'transition-all duration-300',
            maximizedChart === 'fourStarType2'
              ? 'col-span-1 sm:col-span-3'
              : '',
          ]"
          :style="cardStyle"
        >
          <div class="flex justify-between items-center mb-2">
            <n-h4 class="text-lg font-semibold"
              >4★ Distribution (5★ Banner)</n-h4
            >
            <n-button
              size="tiny"
              text
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
          </div>
          <div
            :class="[
              'transition-all duration-300',
              maximizedChart === 'fourStarType2'
                ? 'h-[calc(100vh-240px)]'
                : 'h-[200px]',
            ]"
            :style="cardStyle"
          >
            <canvas
              ref="fourStarType2Chart"
              :style="cardStyle"
            />
          </div>
        </n-card>

        <!-- 4★ Distribution Type 3 Chart -->
        <n-card
          v-show="!maximizedChart || maximizedChart === 'fourStarType3'"
          :class="[
            'transition-all duration-300',
            maximizedChart === 'fourStarType3'
              ? 'col-span-1 sm:col-span-3'
              : '',
          ]"
          :style="cardStyle"
        >
          <div class="flex justify-between items-center mb-2">
            <n-h4 class="text-lg font-semibold"
              >4★ Distribution (4★ Banner)</n-h4
            >
            <n-button
              size="tiny"
              text
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
          </div>
          <div
            :class="[
              'transition-all duration-300',
              maximizedChart === 'fourStarType3'
                ? 'h-[calc(100vh-240px)]'
                : 'h-[200px]',
            ]"
            :style="cardStyle"
          >
            <canvas
              ref="fourStarType3Chart"
              :style="cardStyle"
            />
          </div>
        </n-card>
      </div>
    </n-card>

    <n-tooltip
      v-if="selectedBanner"
      trigger="manual"
      :show="showTooltip"
      :x="tooltipX"
      :y="tooltipY"
      placement="top"
      :raw="true"
      class="shadow-none rounded-lg"
      @clickoutside="hideTooltip"
    >
      <template #trigger>
        <div
          class="fixed"
          style="width: 0; height: 0"
        />
      </template>
      <transition
        name="tooltip"
        appear
        enter-active-class="transition ease-out duration-300"
        enter-from-class="opacity-0 translate-y-[-20px] scale-80"
        enter-to-class="opacity-100 translate-y-0 scale-100"
        leave-active-class="transition ease-in duration-300"
        leave-from-class="opacity-100 translate-y-0 scale-100"
        leave-to-class="opacity-0 translate-y-[-20px] scale-80"
      >
        <div
          v-if="showTooltip"
          class="bg-[rgba(100,100,100,0.3)] rounded-lg p-2 origin-top"
        >
          <div class="text-xs text-center text-gray-400 mb-1">
            {{ selectedBanner.name }}: {{ selectedBanner.pulls }} pulls
          </div>
          <nuxt-img
            :src="`/images/banners/${selectedBanner.id}.webp`"
            :alt="selectedBanner.name"
            :placeholder="[200, 80]"
            class="w-[200px] h-[80px] object-cover rounded"
          />
        </div>
      </transition>
    </n-tooltip>
  </div>
</template>

<script setup>
  import { ref, onMounted, watchEffect, computed } from 'vue'
  import Chart from 'chart.js/auto'
  import { NSkeleton, NNumberAnimation, NButton, NTooltip } from 'naive-ui'
  import { BANNER_DATA } from '~/data/banners'
  import { ExpandAlt, CompressAlt } from '@vicons/fa'
  import { useSupabaseClient } from '~/composables/useSupabaseClient'
  import { useCardStyle } from '~/composables/useCardStyle'
  import { useUserStore } from '~/stores/user'

  // Initialize Supabase client
  const supabase = useSupabaseClient()
  const userStore = useUserStore()

  // Add isDark computed property
  const isDark = computed(() => userStore.getCurrentTheme === 'dark')

  // Global Chart.js configuration
  Chart.defaults.font.size = 12
  Chart.defaults.font.family = 'Roboto, system-ui, -apple-system, sans-serif'
  Chart.defaults.color = isDark.value ? '#f0f1f3' : '#797a7c'
  Chart.defaults.backgroundColor = isDark.value ? '#1F2937' : '#FAF5FF'
  Chart.defaults.plugins.legend.display = false
  Chart.defaults.plugins.legend.position = 'top'
  Chart.defaults.plugins.legend.labels.boxWidth = 12
  Chart.defaults.plugins.legend.labels.padding = 20
  Chart.defaults.plugins.tooltip.enabled = true
  Chart.defaults.plugins.tooltip.mode = 'index'
  Chart.defaults.plugins.tooltip.intersect = false
  Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(0, 0, 0, 0.8)'
  Chart.defaults.plugins.tooltip.padding = 8
  Chart.defaults.plugins.tooltip.cornerRadius = 4
  Chart.defaults.plugins.tooltip.titleFont = { size: 14, weight: 'bold' }
  Chart.defaults.plugins.tooltip.bodyFont = { size: 12 }
  Chart.defaults.plugins.tooltip.footerFont = { size: 12 }
  Chart.defaults.elements.bar.borderRadius = 4
  Chart.defaults.elements.bar.borderSkipped = false
  Chart.defaults.animation.duration = 800
  Chart.defaults.animation.easing = 'easeInOutQuart'

  // Remove grid lines
  Chart.defaults.scale.grid.display = false
  Chart.defaults.scale.grid.drawBorder = false

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

  const charts = ref([])
  const maximizedChart = ref(null)

  // Add tooltip related refs
  const showTooltip = ref(false)
  const tooltipX = ref(0)
  const tooltipY = ref(0)
  const selectedBanner = ref(null)

  const { cardStyle } = useCardStyle()

  // Hide tooltip function
  const hideTooltip = () => {
    showTooltip.value = false
    selectedBanner.value = null
  }

  // Handle chart click
  const handleChartClick = (chart, event) => {
    const points = chart.getElementsAtEventForMode(
      event,
      'nearest',
      { intersect: true },
      true
    )

    if (points.length) {
      const firstPoint = points[0]
      const bannerId = Object.keys(data.value.pulls_per_banner)[
        firstPoint.index
      ]
      const banner = BANNER_DATA[parseInt(bannerId)]
      const pulls = data.value.pulls_per_banner[bannerId]

      // Get chart container position
      const rect = chart.canvas.getBoundingClientRect()

      // Calculate position relative to the clicked bar
      const barPosition = chart.getDatasetMeta(firstPoint.datasetIndex).data[
        firstPoint.index
      ]

      // Update tooltip data and position
      selectedBanner.value = {
        id: bannerId,
        name: banner.bannerName,
        pulls: pulls,
      }

      // Position tooltip above the bar
      tooltipX.value = rect.left + barPosition.x
      tooltipY.value = rect.top + barPosition.y - 10 // Offset above the bar
      showTooltip.value = true
    } else {
      hideTooltip()
    }
  }

  const fetchData = async () => {
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
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      loading.value = false
    }
  }

  const toggleMaximize = (chartId) => {
    maximizedChart.value = maximizedChart.value === chartId ? null : chartId
  }

  // Watch for changes in data and canvas refs
  watchEffect(() => {
    if (!data.value || loading.value) return

    // Check if all canvas elements are available
    if (
      !pullsPerBannerChart.value ||
      !fiveStarDistributionChart.value ||
      !fourStarType2Chart.value ||
      !fourStarType3Chart.value
    ) {
      return
    }

    // Clear existing charts
    charts.value.forEach((chart) => chart.destroy())
    charts.value = []

    try {
      // Pulls per Banner Chart
      const bannerLabels = Object.keys(data.value.pulls_per_banner).map(
        (bannerId) => {
          const banner = BANNER_DATA[parseInt(bannerId)]
          return banner ? banner.bannerName : `Banner ${bannerId}`
        }
      )

      // Group data by banner type
      const bannerTypeData = {
        type2: [],
        type3: [],
      }

      Object.entries(data.value.pulls_per_banner).forEach(
        ([bannerId, pulls]) => {
          const banner = BANNER_DATA[parseInt(bannerId)]
          if (banner) {
            switch (banner.bannerType) {
              case 2:
                bannerTypeData.type2.push(pulls)
                break
              case 3:
                bannerTypeData.type3.push(pulls)
                break
            }
          }
        }
      )

      charts.value.push(
        new Chart(pullsPerBannerChart.value, {
          type: 'bar',
          data: {
            labels: bannerLabels,
            datasets: [
              {
                label: 'Limited 5★',
                data: Object.entries(data.value.pulls_per_banner).map(
                  ([bannerId, pulls]) => {
                    const banner = BANNER_DATA[parseInt(bannerId)]
                    return banner?.bannerType === 2 ? pulls : null
                  }
                ),
                backgroundColor: 'rgba(217, 119, 6, 0.5)', // amber-600
                borderColor: 'rgba(217, 119, 6, 1)', // amber-600
                borderWidth: 1,
                stack: 'Stack 0',
              },
              {
                label: 'Limited 4★',
                data: Object.entries(data.value.pulls_per_banner).map(
                  ([bannerId, pulls]) => {
                    const banner = BANNER_DATA[parseInt(bannerId)]
                    return banner?.bannerType === 3 ? pulls : null
                  }
                ),
                backgroundColor: 'rgba(37, 99, 235, 0.5)', // blue-600
                borderColor: 'rgba(37, 99, 235, 1)', // blue-600
                borderWidth: 1,
                stack: 'Stack 0',
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            onHover: (event, elements) => {
              event.native.target.style.cursor = elements.length
                ? 'pointer'
                : 'default'
            },
            onClick: (event, elements, chart) => {
              handleChartClick(chart, event)
            },
            scales: {
              y: {
                beginAtZero: true,
                stacked: true,
                ticks: {
                  display: false,
                },
              },
              x: {
                stacked: true,
              },
            },
            plugins: {
              legend: {
                display: true,
                position: 'top',
                labels: {
                  boxWidth: 12,
                  padding: 20,
                  usePointStyle: true,
                },
                onClick: (e, legendItem, legend) => {
                  const index = legendItem.datasetIndex
                  const chart = legend.chart
                  const meta = chart.getDatasetMeta(index)

                  // Toggle visibility
                  meta.hidden = !meta.hidden

                  // Update the chart
                  chart.update()
                },
              },
              tooltip: {
                enabled: false,
              },
            },
          },
        })
      )

      // 5★ Distribution Chart
      charts.value.push(
        new Chart(fiveStarDistributionChart.value, {
          type: 'bar',
          data: {
            labels: Object.keys(data.value.five_star_pulls_distribution),
            datasets: [
              {
                label: '5★ Pulls',
                data: Object.values(data.value.five_star_pulls_distribution),
                backgroundColor: 'rgba(217, 119, 6, 0.5)', // amber-600
                borderColor: 'rgba(217, 119, 6, 1)', // amber-600
                borderWidth: 1,
                yAxisID: 'y',
                hidden: false,
                showLine: false,
                skipNull: true,
                parsing: {
                  xAxisKey: 'x',
                  yAxisKey: 'y',
                },
                legend: {
                  display: false,
                },
              },
              {
                label: 'Probability',
                data: Object.values(
                  data.value.five_star_pulls_distribution
                ).map((value, index, array) => {
                  const total = array.reduce((sum, val) => sum + val, 0)
                  const cumulative = array
                    .slice(0, index + 1)
                    .reduce((sum, val) => sum + val, 0)
                  return (cumulative / total) * 100
                }),
                type: 'line',
                borderColor: 'rgba(217, 119, 6, 0.4)', // purple-600 with lower opacity
                backgroundColor: 'rgba(217, 119, 6, 0.05)', // purple-600 with very low opacity
                borderWidth: 2,
                pointRadius: 0,
                yAxisID: 'y1',
                cubicInterpolationMode: 'monotone',
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                position: 'left',
                title: {
                  display: true,
                  text: 'Number of Pulls',
                },
                ticks: {
                  display: false,
                },
              },
              y1: {
                beginAtZero: true,
                position: 'right',
                max: 100,
                title: {
                  display: true,
                  text: 'Probability (%)',
                },
                grid: {
                  drawOnChartArea: false,
                },
                ticks: {
                  display: false,
                },
              },
            },
            plugins: {
              legend: {
                display: false,
              },
              tooltip: {
                callbacks: {
                  label: function (context) {
                    const label = context.dataset.label || ''
                    const value = context.raw
                    if (label.includes('Probability')) {
                      return `${label}: ${value.toFixed(2)}%`
                    }
                    return `${label}: ${value}`
                  },
                },
              },
            },
          },
        })
      )

      // 4★ Distribution Type 2 Chart
      charts.value.push(
        new Chart(fourStarType2Chart.value, {
          type: 'bar',
          data: {
            labels: Object.keys(
              data.value.four_star_pulls_distribution_banner_type_2
            ),
            datasets: [
              {
                label: '4★ Pulls (5★ Banner)',
                data: Object.values(
                  data.value.four_star_pulls_distribution_banner_type_2
                ),
                backgroundColor: 'rgba(37, 99, 235, 0.5)', // blue-600
                borderColor: 'rgba(37, 99, 235, 1)', // blue-600
                borderWidth: 1,
                yAxisID: 'y',
                hidden: false,
                showLine: false,
                skipNull: true,
                parsing: {
                  xAxisKey: 'x',
                  yAxisKey: 'y',
                },
                legend: {
                  display: false,
                },
              },
              {
                label: 'Probability',
                data: Object.values(
                  data.value.four_star_pulls_distribution_banner_type_2
                ).map((value, index, array) => {
                  const total = array.reduce((sum, val) => sum + val, 0)
                  const cumulative = array
                    .slice(0, index + 1)
                    .reduce((sum, val) => sum + val, 0)
                  return (cumulative / total) * 100
                }),
                type: 'line',
                borderColor: 'rgba(147, 51, 234, 0.4)', // purple-600 with lower opacity
                backgroundColor: 'rgba(147, 51, 234, 0.05)', // purple-600 with very low opacity
                borderWidth: 2,
                pointRadius: 0,
                yAxisID: 'y1',
                cubicInterpolationMode: 'monotone',
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                position: 'left',
                title: {
                  display: true,
                  text: 'Number of Pulls',
                },
                ticks: {
                  display: false,
                },
              },
              y1: {
                beginAtZero: true,
                position: 'right',
                max: 100,
                title: {
                  display: true,
                  text: 'Probability (%)',
                },
                grid: {
                  drawOnChartArea: false,
                },
                ticks: {
                  display: false,
                },
              },
            },
            plugins: {
              legend: {
                display: false,
              },
              tooltip: {
                callbacks: {
                  label: function (context) {
                    const label = context.dataset.label || ''
                    const value = context.raw
                    if (label.includes('Probability')) {
                      return `${label}: ${value.toFixed(2)}%`
                    }
                    return `${label}: ${value}`
                  },
                },
              },
            },
          },
        })
      )

      // 4★ Distribution Type 3 Chart
      charts.value.push(
        new Chart(fourStarType3Chart.value, {
          type: 'bar',
          data: {
            labels: Object.keys(
              data.value.four_star_pulls_distribution_banner_type_3
            ),
            datasets: [
              {
                label: '4★ Pulls (4★ Banner)',
                data: Object.values(
                  data.value.four_star_pulls_distribution_banner_type_3
                ),
                backgroundColor: 'rgba(37, 99, 235, 0.5)', // blue-600
                borderColor: 'rgba(37, 99, 235, 1)', // blue-600
                borderWidth: 1,
                yAxisID: 'y',
                hidden: false,
                showLine: false,
                skipNull: true,
                parsing: {
                  xAxisKey: 'x',
                  yAxisKey: 'y',
                },
                legend: {
                  display: false,
                },
              },
              {
                label: 'Probability',
                data: Object.values(
                  data.value.four_star_pulls_distribution_banner_type_3
                ).map((value, index, array) => {
                  const total = array.reduce((sum, val) => sum + val, 0)
                  const cumulative = array
                    .slice(0, index + 1)
                    .reduce((sum, val) => sum + val, 0)
                  return (cumulative / total) * 100
                }),
                type: 'line',
                borderColor: 'rgba(147, 51, 234, 0.4)', // purple-600 with lower opacity
                backgroundColor: 'rgba(147, 51, 234, 0.05)', // purple-600 with very low opacity
                borderWidth: 2,
                pointRadius: 0,
                yAxisID: 'y1',
                cubicInterpolationMode: 'monotone',
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                position: 'left',
                title: {
                  display: true,
                  text: 'Number of Pulls',
                },
                ticks: {
                  display: false,
                },
              },
              y1: {
                beginAtZero: true,
                position: 'right',
                max: 100,
                title: {
                  display: true,
                  text: 'Probability (%)',
                },
                grid: {
                  drawOnChartArea: false,
                },
                ticks: {
                  display: false,
                },
              },
            },
            plugins: {
              legend: {
                display: false,
              },
              tooltip: {
                callbacks: {
                  label: function (context) {
                    const label = context.dataset.label || ''
                    const value = context.raw
                    if (label.includes('Probability')) {
                      return `${label}: ${value.toFixed(2)}%`
                    }
                    return `${label}: ${value}`
                  },
                },
              },
            },
          },
        })
      )
    } catch (error) {
      console.error('Error initializing charts:', error)
    }
  })

  onMounted(() => {
    fetchData()
  })
</script>
