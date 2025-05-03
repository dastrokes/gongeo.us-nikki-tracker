<template>
  <div class="max-w-7xl mx-auto space-y-4">
    <n-card
      v-if="loading"
      size="small"
      class="rounded-xlbg-purple-50"
      no-title
    >
      <!-- Summary Cards Skeleton -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
        <div class="bg-purple-50 p-6 rounded-lg shadow">
          <NSkeleton
            height="24px"
            width="60%"
            class="mb-2"
          />
          <NSkeleton
            height="32px"
            width="40%"
          />
        </div>
        <div class="bg-purple-50 p-6 rounded-lg shadow">
          <NSkeleton
            height="24px"
            width="60%"
            class="mb-2"
          />
          <NSkeleton
            height="32px"
            width="40%"
          />
        </div>
        <div class="bg-purple-50 p-6 rounded-lg shadow">
          <NSkeleton
            height="24px"
            width="60%"
            class="mb-2"
          />
          <NSkeleton
            height="32px"
            width="40%"
          />
        </div>
        <div class="bg-purple-50 p-6 rounded-lg shadow">
          <NSkeleton
            height="24px"
            width="60%"
            class="mb-2"
          />
          <NSkeleton
            height="32px"
            width="40%"
          />
        </div>
        <div class="bg-purple-50 p-6 rounded-lg shadow">
          <NSkeleton
            height="24px"
            width="60%"
            class="mb-2"
          />
          <NSkeleton
            height="32px"
            width="40%"
          />
        </div>
      </div>

      <!-- Charts Skeleton -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          class="col-span-1 sm:col-span-3 bg-purple-50 p-6 rounded-lg shadow"
        >
          <NSkeleton
            height="24px"
            width="40%"
            class="mb-4"
          />
          <NSkeleton height="200px" />
        </div>
        <div class="bg-purple-50 p-6 rounded-lg shadow">
          <NSkeleton
            height="24px"
            width="40%"
            class="mb-4"
          />
          <NSkeleton height="200px" />
        </div>
        <div class="bg-purple-50 p-6 rounded-lg shadow">
          <NSkeleton
            height="24px"
            width="40%"
            class="mb-4"
          />
          <NSkeleton height="200px" />
        </div>
        <div class="bg-purple-50 p-6 rounded-lg shadow">
          <NSkeleton
            height="24px"
            width="40%"
            class="mb-4"
          />
          <NSkeleton height="200px" />
        </div>
      </div>
    </n-card>

    <n-card
      v-else
      class="rounded-xl"
    >
      <!-- Summary Cards -->
      <div
        v-show="!maximizedChart"
        class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4"
      >
        <div class="bg-purple-50 p-6 rounded-lg shadow">
          <h3 class="text-md font-semibold mb-2">Total Pulls</h3>
          <div class="text-2xl font-bold">
            <n-number-animation
              :from="0"
              :to="totalPulls"
              :duration="1000"
            />
          </div>
        </div>
        <div class="bg-purple-50 p-6 rounded-lg shadow">
          <h3 class="text-md font-semibold mb-2">Unique Users</h3>
          <div class="text-2xl font-bold">
            <n-number-animation
              :from="0"
              :to="uniqueUserCount"
              :duration="1000"
            />
          </div>
        </div>
        <div class="bg-purple-50 p-6 rounded-lg shadow">
          <h3 class="text-sm font-semibold mb-2">Average Pulls for 5★</h3>
          <div class="text-2xl font-bold">
            <n-number-animation
              :from="0"
              :to="averagePullsTo5Star"
              :duration="1000"
              :precision="2"
            />
          </div>
        </div>
        <div class="bg-purple-50 p-6 rounded-lg shadow">
          <h3 class="text-sm font-semibold mb-2">Average for 4★ (5★ Banner)</h3>
          <div class="text-2xl font-bold">
            <n-number-animation
              :from="0"
              :to="averagePullsTo4StarType2"
              :duration="1000"
              :precision="2"
            />
          </div>
        </div>
        <div class="bg-purple-50 p-6 rounded-lg shadow">
          <h3 class="text-sm font-semibold mb-2">Average for 4★ (4★ Banner)</h3>
          <div class="text-2xl font-bold">
            <n-number-animation
              :from="0"
              :to="averagePullsTo4StarType3"
              :duration="1000"
              :precision="2"
            />
          </div>
        </div>
      </div>

      <!-- Charts -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Pulls per Banner Chart -->
        <div
          v-show="!maximizedChart || maximizedChart === 'pullsPerBanner'"
          :class="[
            'bg-purple-50 p-6 rounded-lg shadow transition-all duration-300',
            maximizedChart === 'pullsPerBanner'
              ? 'col-span-1 sm:col-span-3'
              : 'col-span-1 sm:col-span-3',
          ]"
        >
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold">Pulls per Banner</h3>
            <n-button
              size="tiny"
              quaternary
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
              'transition-all duration-300 bg-purple-50',
              maximizedChart === 'pullsPerBanner'
                ? 'h-[calc(100vh-240px)]'
                : 'h-[200px]',
            ]"
          >
            <canvas
              ref="pullsPerBannerChart"
              class="bg-purple-50"
            />
          </div>
        </div>

        <!-- 5★ Distribution Chart -->
        <div
          v-show="!maximizedChart || maximizedChart === 'fiveStar'"
          :class="[
            'bg-purple-50 p-6 rounded-lg shadow transition-all duration-300',
            maximizedChart === 'fiveStar' ? 'col-span-1 sm:col-span-3' : '',
          ]"
        >
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold">5★ Pulls Distribution</h3>
            <n-button
              size="tiny"
              quaternary
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
              'transition-all duration-300 bg-purple-50',
              maximizedChart === 'fiveStar'
                ? 'h-[calc(100vh-240px)]'
                : 'h-[200px]',
            ]"
          >
            <canvas
              ref="fiveStarDistributionChart"
              class="bg-purple-50"
            />
          </div>
        </div>

        <!-- 4★ Distribution Type 2 Chart -->
        <div
          v-show="!maximizedChart || maximizedChart === 'fourStarType2'"
          :class="[
            'bg-purple-50 p-6 rounded-lg shadow transition-all duration-300',
            maximizedChart === 'fourStarType2'
              ? 'col-span-1 sm:col-span-3'
              : '',
          ]"
        >
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold">4★ Distribution (5★ Banner)</h3>
            <n-button
              size="tiny"
              quaternary
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
              'transition-all duration-300 bg-purple-50',
              maximizedChart === 'fourStarType2'
                ? 'h-[calc(100vh-240px)]'
                : 'h-[200px]',
            ]"
          >
            <canvas
              ref="fourStarType2Chart"
              class="bg-purple-50"
            />
          </div>
        </div>

        <!-- 4★ Distribution Type 3 Chart -->
        <div
          v-show="!maximizedChart || maximizedChart === 'fourStarType3'"
          :class="[
            'bg-purple-50 p-6 rounded-lg shadow transition-all duration-300',
            maximizedChart === 'fourStarType3'
              ? 'col-span-1 sm:col-span-3'
              : '',
          ]"
        >
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold">4★ Distribution (4★ Banner)</h3>
            <n-button
              size="tiny"
              quaternary
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
              'transition-all duration-300 bg-purple-50',
              maximizedChart === 'fourStarType3'
                ? 'h-[calc(100vh-240px)]'
                : 'h-[200px]',
            ]"
          >
            <canvas
              ref="fourStarType3Chart"
              class="bg-purple-50"
            />
          </div>
        </div>
      </div>
    </n-card>
  </div>
</template>

<script setup>
  import { ref, onMounted, watchEffect } from 'vue'
  import Chart from 'chart.js/auto'
  import { NSkeleton, NNumberAnimation, NButton } from 'naive-ui'
  import { BANNER_DATA } from '~/data/banners'
  import { ExpandAlt, CompressAlt } from '@vicons/fa'
  import { useSupabaseClient } from '~/composables/useSupabaseClient'

  // Initialize Supabase client
  const supabase = useSupabaseClient()

  // Global Chart.js configuration
  Chart.defaults.font.size = 12
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
  const averagePullsTo4StarType3 = ref(0)

  const pullsPerBannerChart = ref(null)
  const fiveStarDistributionChart = ref(null)
  const fourStarType2Chart = ref(null)
  const fourStarType3Chart = ref(null)

  const charts = ref([])
  const maximizedChart = ref(null)

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
                label: 'Limited 5★ Banners',
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
                label: 'Limited 4★ Banners',
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
            scales: {
              y: {
                beginAtZero: true,
                stacked: true,
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

                  // Update labels visibility based on dataset visibility
                  const labels = chart.data.labels
                  const datasets = chart.data.datasets

                  // Update the chart
                  chart.update()
                },
              },
              tooltip: {
                filter: function (tooltipItem) {
                  return tooltipItem.raw !== null && tooltipItem.raw !== 0
                },
              },
              background: {
                color: '#f5f3ff',
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
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
              },
            },
            plugins: {
              background: {
                color: '#f5f3ff',
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
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
              },
            },
            plugins: {
              background: {
                color: '#f5f3ff',
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
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
              },
            },
            plugins: {
              background: {
                color: '#f5f3ff',
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
