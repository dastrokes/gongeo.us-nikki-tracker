<template>
  <div class="max-w-7xl mx-auto space-y-4">
    <div v-if="loading">
      <!-- Summary Cards Skeleton -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div class="bg-white p-6 rounded-lg shadow">
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
        <div class="bg-white p-6 rounded-lg shadow">
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
        <div class="bg-white p-6 rounded-lg shadow">
          <NSkeleton
            height="24px"
            width="60%"
            class="mb-2"
          />
          <NSkeleton
            height="32px"
            width="40%"
            class="mb-2"
          />
          <NSkeleton
            height="32px"
            width="40%"
          />
        </div>
      </div>

      <!-- Charts Skeleton -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div
          class="bg-white p-6 rounded-lg shadow"
          v-for="i in 4"
          :key="i"
        >
          <NSkeleton
            height="24px"
            width="40%"
            class="mb-4"
          />
          <NSkeleton height="300px" />
        </div>
      </div>
    </div>

    <div v-else>
      <!-- Summary Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="text-md font-semibold mb-2">Total Pulls</h3>
          <p class="text-2xl font-bold">{{ totalPulls }}</p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="text-md font-semibold mb-2">Average Pulls for 5★</h3>
          <p class="text-2xl font-bold">{{ averagePullsTo5Star.toFixed(2) }}</p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="text-md font-semibold mb-2">
            Average Pulls for 4★ (5★ Banner)
          </h3>
          <p class="text-2xl font-bold">
            {{ averagePullsTo4StarType2.toFixed(2) }}
          </p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="text-md font-semibold mb-2">
            Average Pulls for 4★ (4★ Banner)
          </h3>
          <p class="text-2xl font-bold">
            {{ averagePullsTo4StarType3.toFixed(2) }}
          </p>
        </div>
      </div>

      <!-- Charts -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Pulls per Banner Chart -->
        <div class="col-span-1 sm:col-span-3 bg-white p-6 rounded-lg shadow">
          <h3 class="text-lg font-semibold mb-4">Pulls per Banner</h3>
          <div class="h-[200px]">
            <canvas ref="pullsPerBannerChart"></canvas>
          </div>
        </div>

        <!-- 5★ Distribution Chart -->
        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="text-lg font-semibold mb-4">5★ Pulls Distribution</h3>
          <div class="h-[200px]">
            <canvas ref="fiveStarDistributionChart"></canvas>
          </div>
        </div>

        <!-- 4★ Distribution Type 2 Chart -->
        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="text-lg font-semibold mb-4">
            4★ Distribution (5★ Banner)
          </h3>
          <div class="h-[200px]">
            <canvas ref="fourStarType2Chart"></canvas>
          </div>
        </div>

        <!-- 4★ Distribution Type 3 Chart -->
        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="text-lg font-semibold mb-4">
            4★ Distribution (4★ Banner)
          </h3>
          <div class="h-[200px]">
            <canvas ref="fourStarType3Chart"></canvas>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, onMounted, watchEffect } from 'vue'
  import Chart from 'chart.js/auto'
  import { NSkeleton } from 'naive-ui'
  import { BANNER_DATA } from '~/data/banners'

  // Global Chart.js configuration
  Chart.defaults.font.size = 12
  Chart.defaults.color = '#374151'
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
  const averagePullsTo5Star = ref(0)
  const averagePullsTo4StarType2 = ref(0)
  const averagePullsTo4StarType3 = ref(0)

  const pullsPerBannerChart = ref(null)
  const fiveStarDistributionChart = ref(null)
  const fourStarType2Chart = ref(null)
  const fourStarType3Chart = ref(null)

  const charts = ref([])

  const fetchData = async () => {
    try {
      const response = await fetch(
        'https://fimzdbqulflilnnopibz.supabase.co/storage/v1/object/sign/infinitynikkitracker/data.json?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzA1OTJmMWYxLWVhNWMtNDg3Ni1iYzk1LWRhNmVmOTU0YTE4MiJ9.eyJ1cmwiOiJpbmZpbml0eW5pa2tpdHJhY2tlci9kYXRhLmpzb24iLCJpYXQiOjE3NDYxNDEyMjIsImV4cCI6NDg2ODIwNTIyMn0.x2Fmx61_lNTHaqO1OsOxHRJYS9y3EXBi0wWry25z0rU'
      )
      data.value = await response.json()

      // Update reactive values
      totalPulls.value = data.value.total_pulls
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

      charts.value.push(
        new Chart(pullsPerBannerChart.value, {
          type: 'bar',
          data: {
            labels: bannerLabels,
            datasets: [
              {
                label: 'Pulls',
                data: Object.values(data.value.pulls_per_banner),
                backgroundColor: 'rgba(20, 184, 166, 0.5)', // teal-500
                borderColor: 'rgba(20, 184, 166, 1)', // teal-500
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
