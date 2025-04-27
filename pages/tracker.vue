<template>
  <div class="max-w-7xl mx-auto space-y-4">
    <!-- Loading State -->
    <template v-if="loading">
      <!-- Stats Header Skeleton -->
      <n-card
        size="small"
        class="rounded-xl bg-pink-100"
      >
        <div class="flex items-center justify-between">
          <div
            class="flex-grow grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4"
          >
            <n-card
              v-for="i in 7"
              :key="i"
              size="small"
              class="text-center rounded-md"
            >
              <n-skeleton
                text
                :repeat="2"
              />
            </n-card>
          </div>
          <div class="ml-4 flex space-x-2 shrink-0">
            <n-skeleton
              circle
              width="24px"
              height="24px"
            />
            <n-skeleton
              circle
              width="24px"
              height="24px"
            />
          </div>
        </div>
      </n-card>

      <!-- Banner Cards Skeleton -->
      <div class="space-y-4">
        <n-card
          v-for="i in 2"
          :key="i"
          size="small"
          class="rounded-xl bg-pink-100"
        >
          <div class="space-y-4">
            <!-- Banner Header Skeleton -->
            <div class="flex items-center justify-between">
              <div class="flex-grow flex flex-wrap items-center gap-4">
                <n-skeleton
                  text
                  style="width: 180px"
                />
                <div class="flex gap-2">
                  <n-skeleton
                    text
                    style="width: 120px"
                  />
                  <n-skeleton
                    text
                    style="width: 120px"
                  />
                </div>
              </div>
              <div class="ml-4 flex space-x-2 shrink-0">
                <n-skeleton
                  circle
                  width="24px"
                  height="24px"
                />
                <n-skeleton
                  circle
                  width="24px"
                  height="24px"
                />
              </div>
            </div>
            <!-- Items Grid Skeleton -->
            <div
              class="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2"
            >
              <n-skeleton
                v-for="j in 20"
                :key="j"
                class="rounded-md"
                height="120px"
                width="120px"
              />
            </div>
          </div>
        </n-card>
      </div>
    </template>

    <!-- Content (only show when not loading) -->
    <div v-show="!loading">
      <!-- Stats Header -->
      <n-card
        v-if="Object.keys(processedPulls).length > 0"
        size="small"
        class="rounded-xl bg-pink-100"
      >
        <div class="flex items-center justify-between">
          <div
            class="flex-grow grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4"
          >
            <n-card
              size="small"
              class="text-center rounded-md"
            >
              <div class="text-sm text-gray-600">Total Pulls</div>
              <div class="text-xl font-medium mt-1">
                {{ globalStats.totalPulls }}
              </div>
            </n-card>

            <n-card
              size="small"
              class="text-center rounded-md"
            >
              <div class="text-sm text-gray-600">5★ Total Pulls</div>
              <div class="text-xl font-medium mt-1">
                {{ globalStats.total5StarItems }}
              </div>
            </n-card>

            <n-card
              size="small"
              class="text-center rounded-md"
            >
              <div class="text-sm text-gray-600">5★ Avg Pulls</div>
              <div class="text-xl font-medium mt-1">
                {{ globalStats.avg5StarPulls.toFixed(1) }}
              </div>
            </n-card>

            <n-card
              size="small"
              class="text-center rounded-md"
            >
              <div class="text-sm text-gray-600">4★ Mixed Total</div>
              <div class="text-xl font-medium mt-1">
                {{ globalStats.total4StarItems }}
              </div>
            </n-card>

            <n-card
              size="small"
              class="text-center rounded-md"
            >
              <div class="text-sm text-gray-600">4★ Mixed Avg</div>
              <div class="text-xl font-medium mt-1">
                {{ globalStats.avg4StarPulls.toFixed(1) }}
              </div>
            </n-card>

            <n-card
              size="small"
              class="text-center rounded-md"
            >
              <div class="text-sm text-gray-600">4★ Only Total</div>
              <div class="text-xl font-medium mt-1">
                {{ globalStats.total4StarOnlyItems }}
              </div>
            </n-card>

            <n-card
              size="small"
              class="text-center rounded-md"
            >
              <div class="text-sm text-gray-600">4★ Only Avg</div>
              <div class="text-xl font-medium mt-1">
                {{ globalStats.avg4StarOnlyPulls.toFixed(1) }}
              </div>
            </n-card>
          </div>

          <div class="ml-4 flex space-x-2 shrink-0 export-exclude">
            <!-- Export Button -->

            <n-tooltip
              placement="top"
              :theme-overrides="{
                common: {
                  borderRadius: '8px',
                },
                peers: {
                  Popover: {
                    color: '#ffffff',
                    textColor: '#000000',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
                  },
                },
              }"
              trigger="hover"
              ><template #trigger>
                <n-button
                  size="small"
                  quaternary
                  circle
                  :loading="exporting"
                  @click="exportPNG"
                >
                  <template #icon>
                    <n-icon>
                      <file-image-regular />
                    </n-icon>
                  </template> </n-button
              ></template>
              Export as PNG image
            </n-tooltip>
            <n-tooltip
              placement="top"
              :theme-overrides="{
                common: {
                  borderRadius: '8px',
                },
                peers: {
                  Popover: {
                    color: '#ffffff',
                    textColor: '#000000',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
                  },
                },
              }"
              trigger="hover"
            >
              <template #trigger>
                <n-button
                  size="small"
                  quaternary
                  circle
                  @click="exportJSON"
                >
                  <template #icon>
                    <n-icon>
                      <file-export />
                    </n-icon>
                  </template> </n-button
              ></template>
              Export as JSON for later import
            </n-tooltip>

            <n-popover trigger="click">
              <template #trigger>
                <n-button
                  size="small"
                  quaternary
                  circle
                  class="text-gray-500 hover:text-gray-700"
                >
                  <template #icon>
                    <n-icon>
                      <cog />
                    </n-icon>
                  </template>
                </n-button>
              </template>
              <div class="p-4 min-w-[200px]">
                <div class="space-y-4">
                  <div class="flex items-center justify-between">
                    <n-switch
                      v-if="hasMultipleOutfits()"
                      v-model:value="combineOutfits"
                    >
                      <template #checked>Combined</template>
                      <template #unchecked>Separated</template>
                    </n-switch>
                    <span
                      v-if="hasMultipleOutfits()"
                      class="text-sm text-gray-600 ml-3"
                    >
                      Outfit Display
                    </span>
                  </div>
                  <div class="flex items-center justify-between">
                    <n-switch v-model:value="showEmptyBanners">
                      <template #checked>Show</template>
                      <template #unchecked>Hide</template>
                    </n-switch>
                    <span class="text-sm text-gray-600 ml-3">
                      Empty Banners
                    </span>
                  </div>
                </div>
              </div>
            </n-popover>
          </div>
        </div>
      </n-card>

      <!-- Banner List -->
      <div
        v-if="!loading"
        class="space-y-4"
      >
        <div class="space-y-4">
          <template
            v-for="banner in Object.values(processedPulls)"
            :key="banner.bannerId"
          >
            <n-card
              v-show="
                (showEmptyBanners || banner.pulls.length > 0) &&
                banner.bannerId != 1
              "
              size="small"
              class="rounded-xl bg-pink-100"
            >
              <div>
                <!-- Banner Header -->
                <div class="flex items-center mb-2">
                  <div class="flex-grow flex flex-wrap items-center gap-4">
                    <h3 class="text-lg font-medium break-words">
                      {{ banner.bannerName }}
                    </h3>
                    <div class="flex flex-wrap gap-2">
                      <template
                        v-for="outfit in banner.outfits"
                        :key="outfit.id"
                      >
                        <div class="flex items-center gap-2">
                          <n-tag
                            :type="outfit.rarity === 5 ? 'warning' : 'info'"
                            :bordered="false"
                            round
                            class="px-3"
                          >
                            <span class="align-top"
                              >{{ outfit.name }} {{ outfit.rarity }}</span
                            >
                            <span class="ml-1"
                              ><n-icon><star /></n-icon
                            ></span>
                            <span
                              v-if="outfit.isComplete"
                              class="ml-1"
                              ><n-icon><check-circle /></n-icon
                            ></span>
                          </n-tag>
                        </div>
                      </template>
                    </div>
                  </div>
                  <div class="ml-4 flex space-x-2 shrink-0 export-exclude">
                    <!-- Stats Button -->
                    <n-popover
                      v-if="banner.stats.totalPulls > 0"
                      trigger="click"
                    >
                      <template #trigger>
                        <n-button
                          size="small"
                          quaternary
                          circle
                          class="text-gray-500 hover:text-gray-700"
                        >
                          <template #icon>
                            <n-icon>
                              <chart-bar-regular />
                            </n-icon>
                          </template>
                        </n-button>
                      </template>
                      <div class="p-4 min-w-[280px]">
                        <div class="space-y-2">
                          <div class="flex justify-between">
                            <span class="text-sm">Total Pulls</span>
                            <span class="font-medium">{{
                              banner.stats.totalPulls
                            }}</span>
                          </div>
                          <div class="flex justify-between">
                            <span class="text-sm">5★ Total</span>
                            <span class="font-medium text-amber-600">{{
                              banner.stats.total5StarItems
                            }}</span>
                          </div>
                          <div class="flex justify-between">
                            <span class="text-sm">5★ Average</span>
                            <span class="font-medium text-amber-600">{{
                              banner.stats.avg5StarPulls.toFixed(1)
                            }}</span>
                          </div>
                          <div
                            v-if="!banner.isComplete"
                            class="flex justify-between"
                          >
                            <span class="text-sm">5★ Pity</span>
                            <span class="font-medium">{{
                              banner.stats.pity5Star
                            }}</span>
                          </div>
                          <div
                            v-if="hasBothRarities(banner.bannerId)"
                            class="flex justify-between"
                          >
                            <span class="text-sm">4★ Mixed Total</span>
                            <span class="font-medium text-blue-600">{{
                              banner.stats.total4StarItems
                            }}</span>
                          </div>
                          <div
                            v-if="hasBothRarities(banner.bannerId)"
                            class="flex justify-between"
                          >
                            <span class="text-sm">4★ Mixed Avg</span>
                            <span class="font-medium text-blue-600">{{
                              banner.stats.avg4StarPulls.toFixed(1)
                            }}</span>
                          </div>
                          <div
                            v-if="is4StarOnlyBanner(banner.bannerId)"
                            class="flex justify-between"
                          >
                            <span class="text-sm">4★ Only Total</span>
                            <span class="font-medium text-blue-600">{{
                              banner.stats.total4StarItems
                            }}</span>
                          </div>
                          <div
                            v-if="is4StarOnlyBanner(banner.bannerId)"
                            class="flex justify-between"
                          >
                            <span class="text-sm">4★ Only Average</span>
                            <span class="font-medium text-blue-600">{{
                              banner.stats.avg4StarPulls.toFixed(1)
                            }}</span>
                          </div>
                          <div
                            v-if="banner.stats?.lastPull"
                            class="flex justify-between"
                          >
                            <span class="text-sm">Last Pull</span>
                            <span class="font-medium">{{
                              new Date(
                                banner.stats.lastPull
                              ).toLocaleDateString()
                            }}</span>
                          </div>
                        </div>
                      </div>
                    </n-popover>
                    <!-- Banner Settings Button -->
                    <n-popover trigger="click">
                      <template #trigger>
                        <n-button
                          size="small"
                          quaternary
                          circle
                          class="text-gray-500 hover:text-gray-700"
                        >
                          <template #icon>
                            <n-icon>
                              <cog />
                            </n-icon>
                          </template>
                        </n-button>
                      </template>
                      <div class="p-4 min-w-[200px]">
                        <div class="space-y-4">
                          <div
                            v-if="hasBothRarities(banner.bannerId)"
                            class="flex items-center justify-between"
                          >
                            <n-switch
                              v-model:value="show4StarItems[banner.bannerId]"
                            >
                              <template #checked>Show</template>
                              <template #unchecked>Hide</template>
                            </n-switch>
                            <span class="text-sm text-gray-600 ml-3">
                              4★ Items
                            </span>
                          </div>
                          <div
                            v-if="banner.stats && !banner.stats.isComplete"
                            class="flex items-center justify-between"
                          >
                            <n-switch
                              v-model:value="showMissingPieces[banner.bannerId]"
                              @update:value="loadMissingItems(banner.bannerId)"
                            >
                              <template #checked>Show</template>
                              <template #unchecked>Hide</template>
                            </n-switch>
                            <span class="text-sm text-gray-600 ml-3">
                              Missing Pieces
                            </span>
                          </div>
                        </div>
                      </div>
                    </n-popover>
                  </div>
                </div>

                <!-- Combined Outfits View -->
                <template v-if="combineOutfits">
                  <div
                    class="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2"
                  >
                    <ItemCard
                      v-for="pull in filterPulls(banner.pulls, banner.bannerId)"
                      :key="pull.pullIndex"
                      :item="pull"
                    />
                  </div>
                </template>

                <!-- Separated Outfits View -->
                <template v-else>
                  <div
                    v-for="outfit in banner.outfits"
                    :key="outfit.id"
                    class="mb-2"
                  >
                    <div
                      class="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2"
                    >
                      <ItemCard
                        v-for="pull in filterPulls(
                          getOutfitItems(banner.pulls, outfit.id),
                          banner.bannerId
                        )"
                        :key="pull.pullIndex"
                        :item="pull"
                      />
                    </div>
                  </div>
                </template>
              </div>
            </n-card>
          </template>
        </div>

        <n-card
          v-if="Object.keys(processedPulls).length === 0"
          class="text-center rounded-md rounded-xl"
        >
          <div class="text-xl text-neutral-800">
            No resonance history available.
          </div>
          <div class="text-xl text-neutral-800">
            Please import your resonance data first.
          </div>
        </n-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { storeToRefs } from 'pinia'
  import {
    Cog,
    ChartBarRegular,
    CheckCircle,
    Star,
    FileImageRegular,
    FileExport,
  } from '@vicons/fa'
  import { toPng } from 'html-to-image'
  import { useMessage } from 'naive-ui'
  import { BANNER_DATA } from '~/data/banners'
  import { usePullStore } from '~/stores/pull'
  import { useIndexedDB } from '~/composables/useIndexedDB'
  import type { PullItem } from '~/types/pull'
  import { useRouter } from 'nuxt/app'

  const router = useRouter()
  const message = useMessage()
  const pullStore = usePullStore()
  const { processedPulls, globalStats } = storeToRefs(pullStore)
  const { data, hasData, loadPullData } = useIndexedDB()

  const loading = ref(true)

  onMounted(async () => {
    try {
      // Check if we have data in IndexedDB
      loading.value = true
      await loadPullData()
      if (hasData.value) {
        await pullStore.processPullsData(data.value, 'LOCAL')
      } else {
        console.log('No data found')
        loading.value = false
        // Wait 3 seconds before redirecting
        setTimeout(() => {
          router.push('/import')
        }, 3000)
      }
    } catch (error) {
      console.error('Failed to load resonance data:', error)
      message.error('Failed to load resonance data. Please try again.')
    } finally {
      if (hasData.value) {
        loading.value = false
      }
    }
  })

  // Helper functions and constants
  const initializeToggleStates = () => {
    const show4Stars: Record<string, boolean> = {}
    const showMissing: Record<string, boolean> = {}

    // Initialize for each banner
    for (const banner of Object.values(BANNER_DATA)) {
      show4Stars[banner.bannerId] = false
      showMissing[banner.bannerId] = false
    }

    return { show4Stars, showMissing }
  }

  const getOutfitItems = (items: PullItem[], outfitId: string) => {
    return items.filter((item) => item.outfitId === outfitId)
  }

  const hasBothRarities = (bannerId: number) => {
    const banner = BANNER_DATA[bannerId]
    if (!banner) return false
    // Banner type 2 has both 4★ and 5★
    return banner.bannerType === 2
  }

  const is4StarOnlyBanner = (bannerId: number) => {
    const banner = BANNER_DATA[bannerId]
    if (!banner) return false
    // Banner type 3 is 4★ only
    return banner.bannerType === 3
  }

  // Initialize toggle states
  const { show4Stars, showMissing } = initializeToggleStates()

  const show4StarItems = ref(show4Stars)
  const showMissingPieces = ref(showMissing)
  const combineOutfits = ref(false)
  const showEmptyBanners = ref(false)
  const exporting = ref(false)

  // Function to load missing items for a banner
  const loadMissingItems = async (bannerId: number) => {
    if (showMissingPieces.value[bannerId]) {
      await pullStore.addMissingItems(bannerId)
    }
  }

  // Function to filter pulls based on UI toggles
  const filterPulls = (pulls: PullItem[], bannerId: number) => {
    return pulls.filter((pull) => {
      // When show4StarItems is false, hide 4★ items only in type 2 banners
      if (
        pull.rarity === 4 &&
        !show4StarItems.value[bannerId] &&
        hasBothRarities(bannerId)
      ) {
        return false
      }
      // Show all items (both obtained and missing) when showMissingPieces is true
      // Only show obtained items when showMissingPieces is false
      return showMissingPieces.value[bannerId] || pull.obtained
    })
  }

  // Update hasMultipleOutfits to be a global check
  const hasMultipleOutfits = () => {
    return Object.values(processedPulls.value).some(
      (banner) => banner.outfits.length > 1
    )
  }

  const exportPNG = async () => {
    try {
      exporting.value = true
      const trackerElement = document.querySelector('.max-w-7xl') as HTMLElement
      if (!trackerElement) {
        throw new Error('Tracker element not found')
      }

      const filter = (node: HTMLElement) => {
        const exclusionClasses = ['export-exclude']
        return !exclusionClasses.some((classname) =>
          node.classList?.contains(classname)
        )
      }

      // Get the actual content width and height
      const contentWidth = trackerElement.scrollWidth
      const contentHeight = trackerElement.scrollHeight

      const dataUrl = await toPng(trackerElement, {
        quality: 1,
        backgroundColor: '#fdf2f8',
        filter: filter,
        width: contentWidth,
        height: contentHeight,
        style: {
          transform: 'none', // Prevent any transform that might cause offset
          position: 'relative', // Ensure proper positioning
          left: '0',
          top: '0',
        },
      })

      // Create a link element and trigger download
      const link = document.createElement('a')
      link.download = `nikki-resonance-tracker-${new Date().toISOString().split('T')[0]}.png`
      link.href = dataUrl
      link.click()

      message.success('Tracker exported successfully!')
    } catch (error) {
      console.error('Export failed:', error)
      message.error('Failed to export tracker. Please try again.')
    } finally {
      exporting.value = false
    }
  }

  const exportJSON = async () => {
    try {
      exporting.value = true
      const jsonData = pullStore.rawPullData

      // Create a Blob with the JSON data
      const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
        type: 'application/json',
      })

      // Create a link element and trigger download
      const link = document.createElement('a')
      link.download = `nikki-resonance-data-${new Date().toISOString().split('T')[0]}.json`
      link.href = URL.createObjectURL(blob)
      link.click()

      // Clean up the URL object
      URL.revokeObjectURL(link.href)

      message.success('Data exported successfully!')
    } catch (error) {
      console.error('Export failed:', error)
      message.error('Failed to export data. Please try again.')
    } finally {
      exporting.value = false
    }
  }
</script>

<style lang="scss" scoped></style>
