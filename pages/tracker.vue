<template>
  <div class="max-w-7xl mx-auto space-y-4">
    <!-- Loading State -->
    <template v-if="loading">
      <!-- Stats Header Skeleton -->
      <n-card
        size="small"
        class="rounded-xl"
        :style="cardStyle"
      >
        <div
          class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div
            class="w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2"
          >
            <n-card
              v-for="i in 5"
              :key="i"
              size="small"
              class="text-center rounded-md"
              :style="cardStyle"
            >
              <n-skeleton
                text
                class="mb-2"
                :style="{ width: '80%', margin: '0 auto' }"
              />
              <n-skeleton
                text
                :style="{ width: '60%', margin: '0 auto' }"
              />
            </n-card>
          </div>
          <div class="flex space-x-2 shrink-0">
            <n-skeleton
              circle
              width="32px"
              height="32px"
            />
            <n-skeleton
              circle
              width="32px"
              height="32px"
            />
          </div>
        </div>
      </n-card>

      <!-- Banner Cards Skeleton -->
      <div class="space-y-4">
        <n-card
          v-for="i in 3"
          :key="i"
          size="small"
          class="rounded-xl"
          :style="cardStyle"
        >
          <div class="space-y-4">
            <!-- Banner Header Skeleton -->
            <div
              class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div
                class="w-full flex flex-col sm:flex-row items-start sm:items-center gap-4"
              >
                <n-skeleton
                  text
                  width="200px"
                />
                <div class="flex flex-wrap gap-2">
                  <n-skeleton
                    round
                    width="120px"
                    height="24px"
                  />
                  <n-skeleton
                    round
                    width="120px"
                    height="24px"
                  />
                </div>
              </div>
              <div class="flex space-x-2 shrink-0">
                <n-skeleton
                  circle
                  width="32px"
                  height="32px"
                />
                <n-skeleton
                  circle
                  width="32px"
                  height="32px"
                />
              </div>
            </div>
            <!-- Items Grid Skeleton -->
            <div
              class="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-10 gap-2 mt-2"
            >
              <n-skeleton
                :repeat="10"
                class="rounded-lg aspect-square w-full h-full"
              />
            </div>
          </div>
        </n-card>
      </div>
    </template>

    <!-- Content (only show when not loading) -->
    <div
      v-show="!loading"
      class="png-export-container"
    >
      <!-- Stats Header -->
      <n-card
        v-if="Object.keys(processedPulls).length > 0"
        content-class="!p-2 sm:!p-4"
        size="small"
        class="rounded-xl"
        :style="cardStyle"
      >
        <div class="flex items-center justify-between">
          <div
            class="flex-grow grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2"
          >
            <n-card
              :style="cardStyle"
              size="small"
              class="text-center rounded-md"
            >
              <div class="text-sm text-gray-400">
                {{ t('tracker.stats.total_pulls') }}
              </div>
              <div class="text-xl font-medium mt-1">
                <n-number-animation
                  :from="0"
                  :to="globalStats.totalPulls"
                  :duration="3000"
                />
              </div>
            </n-card>

            <n-card
              :style="cardStyle"
              size="small"
              class="text-center rounded-md"
            >
              <div class="text-sm text-gray-400">
                {{ t('tracker.stats.total_5star_4star') }}
              </div>
              <div class="text-xl font-medium mt-1">
                <n-number-animation
                  :from="0"
                  :to="globalStats.total5StarItems"
                  :duration="3000"
                />
                /
                <n-number-animation
                  :from="0"
                  :to="
                    globalStats.total4StarItems +
                    globalStats.total4StarOnlyItems
                  "
                  :duration="2000"
                />
              </div>
            </n-card>

            <n-card
              :style="cardStyle"
              size="small"
              class="text-center rounded-md"
            >
              <div class="text-sm text-gray-400">
                {{ t('tracker.stats.avg_5star') }}
              </div>
              <div class="text-xl font-medium mt-1">
                <n-number-animation
                  :from="0"
                  :to="globalStats.avg5StarPulls"
                  :duration="1000"
                  :precision="2"
                />
              </div>
            </n-card>

            <n-card
              :style="cardStyle"
              size="small"
              class="text-center rounded-md"
            >
              <div class="text-sm text-gray-400">
                {{ t('tracker.stats.avg_4star_mixed') }}
              </div>
              <div class="text-xl font-medium mt-1">
                <n-number-animation
                  :from="0"
                  :to="globalStats.avg4StarPulls"
                  :duration="1000"
                  :precision="2"
                />
              </div>
            </n-card>

            <n-card
              :style="cardStyle"
              size="small"
              class="text-center rounded-md"
            >
              <div class="text-sm text-gray-400">
                {{ t('tracker.stats.avg_4star_only') }}
              </div>
              <div class="text-xl font-medium mt-1">
                <n-number-animation
                  :from="0"
                  :to="globalStats.avg4StarOnlyPulls"
                  :duration="1000"
                  :precision="2"
                />
              </div>
            </n-card>

            <div
              class="flex justify-end space-x-2 items-start mt-2 export-exclude"
            >
              <!-- Export Button -->
              <n-popover trigger="click">
                <template #trigger>
                  <n-button
                    size="small"
                    text
                    circle
                    :loading="exporting"
                    class="text-gray-500 hover:text-gray-700"
                  >
                    <template #icon>
                      <n-icon>
                        <file-export />
                      </n-icon>
                    </template>
                  </n-button>
                </template>
                <div class="space-y-2">
                  <n-button
                    text
                    class="text-gray-400 hover:text-gray-600"
                    @click="exportPNG"
                  >
                    <template #icon>
                      <n-icon>
                        <file-image-regular />
                      </n-icon>
                    </template>
                    {{ t('tracker.export.png') }}
                  </n-button>
                  <n-button
                    block
                    text
                    class="text-gray-400 hover:text-gray-600"
                    @click="exportJSON"
                  >
                    <template #icon>
                      <n-icon>
                        <file-export />
                      </n-icon>
                    </template>
                    {{ t('tracker.export.json') }}
                  </n-button>
                </div>
              </n-popover>

              <n-popover trigger="click">
                <template #trigger>
                  <n-button
                    size="small"
                    text
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
                <div class="min-w-[200px]">
                  <div class="space-y-4">
                    <div class="flex items-center justify-between">
                      <n-switch v-model:value="sortBanner">
                        <template #checked>{{
                          t('tracker.banner.settings.oldest_first')
                        }}</template>
                        <template #unchecked>{{
                          t('tracker.banner.settings.latest_first')
                        }}</template>
                      </n-switch>
                      <span class="text-sm text-gray-400 ml-3">
                        {{ t('tracker.banner.settings.banner_order') }}
                      </span>
                    </div>
                    <div class="flex items-center justify-between">
                      <n-switch v-model:value="sortItems">
                        <template #checked>{{
                          t('tracker.banner.settings.oldest_first')
                        }}</template>
                        <template #unchecked>{{
                          t('tracker.banner.settings.latest_first')
                        }}</template>
                      </n-switch>
                      <span class="text-sm text-gray-400 ml-3">
                        {{ t('tracker.banner.settings.item_order') }}
                      </span>
                    </div>
                    <div class="flex items-center justify-between">
                      <n-switch
                        v-if="hasMultipleOutfits()"
                        v-model:value="combineOutfits"
                      >
                        <template #checked>{{
                          t('tracker.banner.settings.combined')
                        }}</template>
                        <template #unchecked>{{
                          t('tracker.banner.settings.separated')
                        }}</template>
                      </n-switch>
                      <span
                        v-if="hasMultipleOutfits()"
                        class="text-sm text-gray-400 ml-3"
                      >
                        {{ t('tracker.banner.settings.outfit_display') }}
                      </span>
                    </div>
                    <div class="flex items-center justify-between">
                      <n-switch v-model:value="showEmptyBanners">
                        <template #checked>{{
                          t('tracker.banner.settings.show')
                        }}</template>
                        <template #unchecked>{{
                          t('tracker.banner.settings.hide')
                        }}</template>
                      </n-switch>
                      <span class="text-sm text-gray-400 ml-3">
                        {{ t('tracker.banner.settings.empty_banners') }}
                      </span>
                    </div>
                  </div>
                </div>
              </n-popover>
            </div>
          </div>
        </div>
      </n-card>

      <!-- Banner List -->
      <div
        v-if="!loading"
        class="space-y-4"
      >
        <div>
          <template
            v-for="banner in sortedBanners"
            :key="banner.bannerId"
          >
            <n-card
              v-show="showEmptyBanners || banner.pulls.length > 0"
              content-class="!p-2 sm:!p-4"
              size="small"
              class="rounded-xl min-h-[120px] sm:min-h-[180px] mt-4"
              :style="cardStyle"
            >
              <!-- Banner Header -->
              <div class="flex items-baseline">
                <div class="flex-grow flex flex-wrap items-center gap-2">
                  <n-h3 class="m-0 font-medium break-words">
                    {{ t(`banner.${banner.bannerId}.name`) }}
                  </n-h3>
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
                          size="small"
                          class="px-2"
                        >
                          <span class="align-top"
                            >{{ t(outfit.name) }} {{ outfit.rarity }}</span
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
                <div class="flex space-x-2 export-exclude">
                  <!-- Stats Button -->
                  <n-popover
                    v-if="banner.stats.totalPulls > 0"
                    trigger="click"
                  >
                    <template #trigger>
                      <n-button
                        size="small"
                        text
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
                    <div class="p-4 w-[200px]">
                      <div class="space-y-2">
                        <div class="flex justify-between">
                          <span class="text-sm">Total Pulls</span>
                          <span class="font-medium">{{
                            banner.stats.totalPulls
                          }}</span>
                        </div>
                        <div
                          v-if="hasBothRarities(banner.bannerId)"
                          class="flex justify-between"
                        >
                          <span class="text-sm">5★ Total</span>
                          <span class="font-medium text-amber-600">{{
                            banner.stats.total5StarItems
                          }}</span>
                        </div>
                        <div
                          v-if="hasBothRarities(banner.bannerId)"
                          class="flex justify-between"
                        >
                          <span class="text-sm">5★ Average</span>
                          <span class="font-medium text-amber-600">{{
                            banner.stats.avg5StarPulls.toFixed(2)
                          }}</span>
                        </div>
                        <div
                          v-if="
                            hasBothRarities(banner.bannerId) &&
                            !banner.isComplete
                          "
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
                            banner.stats.avg4StarPulls.toFixed(2)
                          }}</span>
                        </div>
                        <div
                          v-if="is4StarOnlyBanner(banner.bannerId)"
                          class="flex justify-between"
                        >
                          <span class="text-sm">4★ Only Total</span>
                          <span class="font-medium text-blue-600">{{
                            banner.stats.total4StarOnlyItems
                          }}</span>
                        </div>
                        <div
                          v-if="is4StarOnlyBanner(banner.bannerId)"
                          class="flex justify-between"
                        >
                          <span class="text-sm">4★ Only Average</span>
                          <span class="font-medium text-blue-600">{{
                            banner.stats.avg4StarOnlyPulls.toFixed(2)
                          }}</span>
                        </div>
                        <div
                          v-if="banner.stats?.lastPull"
                          class="flex justify-between"
                        >
                          <span class="text-sm">Last Pull</span>
                          <span class="font-medium">{{
                            new Date(banner.stats.lastPull).toLocaleDateString()
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
                        text
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
                    <div class="min-w-[200px]">
                      <div class="space-y-4">
                        <div
                          v-if="hasBothRarities(banner.bannerId)"
                          class="flex items-center justify-between"
                        >
                          <n-switch
                            v-model:value="show4StarItems[banner.bannerId]"
                          >
                            <template #checked>{{
                              t('tracker.banner.settings.show')
                            }}</template>
                            <template #unchecked>{{
                              t('tracker.banner.settings.hide')
                            }}</template>
                          </n-switch>
                          <span class="text-sm text-gray-400 ml-3">
                            {{ t('tracker.banner.settings.show_4star') }}
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
                            <template #checked>{{
                              t('tracker.banner.settings.show')
                            }}</template>
                            <template #unchecked>{{
                              t('tracker.banner.settings.hide')
                            }}</template>
                          </n-switch>
                          <span class="text-sm text-gray-400 ml-3">
                            {{ t('tracker.banner.settings.show_missing') }}
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
                  class="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-10 gap-2 mt-2"
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
                  v-show="
                    filterPulls(
                      getOutfitItems(banner.pulls, outfit.id),
                      banner.bannerId
                    ).length > 0
                  "
                  :key="outfit.id"
                  class="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-10 gap-2 mt-2"
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
              </template>
            </n-card>
          </template>
        </div>
      </div>

      <n-card
        v-if="Object.keys(processedPulls).length === 0"
        class="text-center rounded-md rounded-xl"
        :style="cardStyle"
      >
        <div class="text-xl text-neutral-500">
          {{ t('tracker.no_data.title') }}
        </div>
        <div class="text-xl text-neutral-500">
          {{ t('tracker.no_data.subtitle') }}
        </div>
        <div class="mt-4">
          <n-button
            type="primary"
            @click="router.push(localePath('/import'))"
          >
            {{ t('navigation.import_data') }}
          </n-button>
        </div>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, computed } from 'vue'
  import { storeToRefs } from 'pinia'
  import {
    Cog,
    ChartBarRegular,
    CheckCircle,
    Star,
    FileImageRegular,
    FileExport,
  } from '@vicons/fa'
  import { useMessage } from 'naive-ui'
  import { BANNER_DATA } from '~/data/banners'
  import { useIndexedDB } from '~/composables/useIndexedDB'
  import { usePullStore } from '~/stores/pull'
  import type { PullItem } from '~/types/pull'
  import { useCardStyle } from '~/composables/useCardStyle'
  import { toPng } from 'html-to-image'

  const router = useRouter()
  const message = useMessage()
  const { t } = useI18n()
  const pullStore = usePullStore()
  const { processedPulls, globalStats } = storeToRefs(pullStore)
  const { data, hasData, loadPullData } = useIndexedDB()
  const localePath = useLocalePath()
  const { cardStyle } = useCardStyle()
  const userStore = useUserStore()
  const isDark = computed(() => userStore.getCurrentTheme === 'dark')
  const loading = ref(true)

  onMounted(async () => {
    try {
      // Check if we have data in IndexedDB
      loading.value = true
      await loadPullData()
      if (hasData.value) {
        await pullStore.processPullsData(data.value)
      } else {
        loading.value = false
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
    // Banner type 1 and 2 has both 4★ and 5★
    return banner.bannerType === 1 || banner.bannerType === 2
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
  const sortBanner = ref(false)
  const sortItems = ref(false)
  const combineOutfits = ref(false)
  const showEmptyBanners = ref(false)
  const exporting = ref(false)

  // Function to sort banners
  const sortedBanners = computed(() => {
    const banners = Object.values(processedPulls.value)
    return banners.sort((a, b) => {
      return sortBanner.value
        ? a.bannerId - b.bannerId
        : b.bannerId - a.bannerId
    })
  })

  // Function to load missing items for a banner
  const loadMissingItems = async (bannerId: number) => {
    if (showMissingPieces.value[bannerId]) {
      await pullStore.addMissingItems(bannerId)
    }
  }

  // Function to filter pulls based on UI toggles
  const filterPulls = (pulls: PullItem[], bannerId: number) => {
    let filteredPulls = pulls.filter((pull) => {
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

    // Sort items based on pullIndex
    filteredPulls = [...filteredPulls].sort((a, b) => {
      return sortItems.value
        ? a.pullIndex - b.pullIndex // Oldest first
        : b.pullIndex - a.pullIndex // Latest first
    })

    return filteredPulls
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
      const trackerElement = document.querySelector(
        '.png-export-container'
      ) as HTMLElement
      if (!trackerElement) {
        throw new Error('Tracker element not found')
      }

      const images = Array.from(trackerElement.querySelectorAll('img'))
      await Promise.all(
        images.map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise((resolve) => (img.onload = resolve))
        )
      )

      trackerElement.getBoundingClientRect()
      await nextTick()

      const filter = (node: HTMLElement) => {
        const exclusionClasses = ['export-exclude']
        return !exclusionClasses.some((classname) =>
          node.classList?.contains(classname)
        )
      }

      const contentWidth = trackerElement.scrollWidth
      const contentHeight = trackerElement.scrollHeight

      const dataUrl = await toPng(trackerElement, {
        quality: 1,
        backgroundColor: isDark.value ? '#1a202c' : '#fdf2f8',
        filter: filter,
        width: contentWidth,
        height: contentHeight,
        style: {
          transform: 'none',
          position: 'relative',
          left: '0',
          top: '0',
        },
      })

      const link = document.createElement('a')
      link.download = `gongeous-${new Date().toISOString().split('T')[0]}.png`
      link.href = dataUrl
      link.click()

      message.success(t('tracker.export.success'))
    } catch (error) {
      console.error('Export failed:', error)
      message.error(t('tracker.export.error'))
    } finally {
      exporting.value = false
    }
  }

  const exportJSON = async () => {
    try {
      exporting.value = true
      const rawData = pullStore.rawPullData

      // Filter out banners with 0 pulls
      const filteredData = Object.fromEntries(
        Object.entries(rawData).filter(([_, pulls]) => pulls.length > 0)
      )

      // Create a Blob with the JSON data
      const blob = new Blob([JSON.stringify(filteredData, null, 2)], {
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
