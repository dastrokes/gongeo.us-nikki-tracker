<template>
  <div class="max-w-7xl mx-auto pt-12 space-y-4">
    <!-- Stats Header -->
    <n-card
      v-if="Object.keys(processedPulls).length > 0"
      size="small"
      class="rounded-xl bg-stone-100"
    >
      <div class="flex items-center justify-between">
        <div
          class="flex-grow grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4"
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
            <div class="text-sm text-gray-600">4★ Total Pulls</div>
            <div class="text-xl font-medium mt-1">
              {{ globalStats.total4StarItems }}
            </div>
          </n-card>

          <n-card
            size="small"
            class="text-center rounded-md"
          >
            <div class="text-sm text-gray-600">4★ Avg Pulls</div>
            <div class="text-xl font-medium mt-1">
              {{ globalStats.avg4StarPulls.toFixed(1) }}
            </div>
          </n-card>
        </div>

        <div class="shrink-0 ml-4">
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
    <n-spin :show="loading">
      <template #description>
        <div class="text-xl text-neutral-800">Loading resonance history...</div>
      </template>
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
              class="rounded-xl bg-stone-100"
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
                  <div class="ml-4 flex space-x-2 shrink-0">
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
                              banner.stats.pity5Star.toFixed(1)
                            }}</span>
                          </div>
                          <div
                            v-if="hasBothRarities(banner.bannerId)"
                            class="flex justify-between"
                          >
                            <span class="text-sm">4★ Total</span>
                            <span class="font-medium text-blue-600">{{
                              banner.stats.total4StarItems
                            }}</span>
                          </div>
                          <div
                            v-if="hasBothRarities(banner.bannerId)"
                            class="flex justify-between"
                          >
                            <span class="text-sm">4★ Average</span>
                            <span class="font-medium text-blue-600">{{
                              banner.stats.avg4StarPulls
                            }}</span>
                          </div>
                          <div
                            v-if="
                              hasBothRarities(banner.bannerId) &&
                              !banner.isComplete
                            "
                            class="flex justify-between"
                          >
                            <span class="text-sm">4★ Pity</span>
                            <span class="font-medium">{{
                              banner.stats.pity4Star
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
            No resonance history available
          </div>
        </n-card>
      </div>
    </n-spin>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { storeToRefs } from 'pinia'
  import { Cog, ChartBarRegular, CheckCircle, Star } from '@vicons/fa'
  import { BANNER_DATA } from '~/data/banners'
  import { usePullStore } from '~/stores/pull'
  import { useUserStore } from '~/stores/user'
  import type { PullItem } from '~/types/pull'

  const pullStore = usePullStore()
  const userStore = useUserStore()
  const {
    processedPulls,
    totalPulls,
    total4StarItems,
    total5StarItems,
    avg4StarPulls,
    avg5StarPulls,
  } = storeToRefs(pullStore)
  const { isProcessing, addMissingItems } = pullStore

  const loading = computed(() => userStore.loading || isProcessing)

  const globalStats = computed(() => ({
    totalPulls: totalPulls.value,
    total4StarItems: total4StarItems.value,
    total5StarItems: total5StarItems.value,
    avg4StarPulls: avg4StarPulls.value,
    avg5StarPulls: avg5StarPulls.value,
  }))

  // Initialize toggle states
  const { show4Stars, showMissing } = (() => {
    const show4Stars: Record<string, boolean> = {}
    const showMissing: Record<string, boolean> = {}

    // Initialize for each banner
    for (const banner of Object.values(BANNER_DATA)) {
      show4Stars[banner.bannerId] = false
      showMissing[banner.bannerId] = false
    }

    return { show4Stars, showMissing }
  })()

  const show4StarItems = ref(show4Stars)
  const showMissingPieces = ref(showMissing)
  const combineOutfits = ref(false)
  const showEmptyBanners = ref(false)

  // Function to load missing items for a banner
  const loadMissingItems = async (bannerId: number) => {
    if (showMissingPieces.value[bannerId]) {
      await addMissingItems(bannerId)
    }
  }

  // Function to filter pulls based on UI toggles
  const filterPulls = (pulls: PullItem[], bannerId: number) => {
    return pulls.filter((pull) => {
      // When show4StarItems is false, hide 4★ items
      if (pull.rarity === 4 && !show4StarItems.value[bannerId]) {
        return false
      }
      // Show all items (both obtained and missing) when showMissingPieces is true
      // Only show obtained items when showMissingPieces is false
      return showMissingPieces.value[bannerId] || pull.obtained
    })
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

  // Update hasMultipleOutfits to be a global check
  const hasMultipleOutfits = () => {
    return Object.values(processedPulls.value).some(
      (banner) => banner.outfits.length > 1
    )
  }
</script>

<style lang="scss" scoped></style>
