<template>
  <div
    class="max-w-7xl mx-auto space-y-2 sm:space-y-4 sm:h-[calc(100vh-8rem)] sm:flex sm:flex-col"
  >
    <!-- Filter Card -->
    <n-card
      size="small"
      class="rounded-xl p-0 sm:p-2"
      content-class="!p-2 sm:p-4"
    >
      <div class="flex flex-col gap-4">
        <!-- Quality Filter Buttons -->
        <div
          class="flex justify-between sm:justify-end items-center gap-2 flex-wrap"
        >
          <!-- Active filter indicator -->
          <ClientOnly>
            <div
              v-if="qualityFilter !== null || typeFilter"
              class="text-sm opacity-70"
            >
              {{ totalItems }} {{ totalItems === 1 ? 'item' : 'items' }}
            </div>
          </ClientOnly>

          <div class="flex items-center gap-2 flex-wrap">
            <!-- Type Filter Dropdown -->
            <n-select
              v-model:value="typeFilter"
              :options="typeOptions"
              size="small"
              class="w-[140px]"
              :placeholder="t('compendium.filter_type')"
            />

            <!-- Clear filters button -->
            <n-button
              v-if="qualityFilter !== null || typeFilter"
              size="small"
              @click="clearFilters"
            >
              Clear Filters
            </n-button>

            <n-button-group size="small">
              <n-button
                :type="qualityFilter === null ? 'primary' : 'default'"
                class="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0"
                @click="qualityFilter = null"
              >
                {{ t('common.all') }}
              </n-button>
              <n-button
                :type="qualityFilter === 5 ? 'warning' : 'default'"
                class="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0"
                @click="qualityFilter = 5"
              >
                <span class="align-top">5</span>
                <span class="ml-1"
                  ><n-icon><Star /></n-icon
                ></span>
              </n-button>
              <n-button
                :type="qualityFilter === 4 ? 'info' : 'default'"
                class="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0"
                @click="qualityFilter = 4"
              >
                <span class="align-top">4</span>
                <span class="ml-1"
                  ><n-icon><Star /></n-icon
                ></span>
              </n-button>
              <n-button
                :type="qualityFilter === 3 ? 'success' : 'default'"
                class="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0"
                @click="qualityFilter = 3"
              >
                <span class="align-top">3</span>
                <span class="ml-1"
                  ><n-icon><Star /></n-icon
                ></span>
              </n-button>
              <n-button
                :type="qualityFilter === 2 ? 'default' : 'default'"
                class="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0"
                @click="qualityFilter = 2"
              >
                <span class="align-top">2</span>
                <span class="ml-1"
                  ><n-icon><Star /></n-icon
                ></span>
              </n-button>
            </n-button-group>
          </div>
        </div>
      </div>
    </n-card>

    <!-- Items Grid Card -->
    <n-card
      size="small"
      class="rounded-xl p-0 sm:p-2 sm:flex-1 sm:flex sm:flex-col sm:overflow-hidden"
      content-class="!p-2 sm:p-4 sm:flex-1 sm:flex sm:flex-col sm:overflow-hidden"
    >
      <!-- Error State -->
      <div
        v-if="error"
        class="text-center py-12"
      >
        <n-result
          status="error"
          :title="t('compendium.error_title')"
          :description="t('compendium.error_description')"
        >
          <template #footer>
            <n-button
              type="primary"
              @click="retryFetch"
            >
              {{ t('common.retry') }}
            </n-button>
          </template>
        </n-result>
      </div>

      <!-- No Results State -->
      <div
        v-else-if="items.length === 0"
        class="text-center py-12"
      >
        <n-result
          status="info"
          :title="t('compendium.no_results_title')"
          :description="t('compendium.no_results_description')"
        />
      </div>

      <!-- Items Grid -->
      <transition
        name="fade"
        mode="out-in"
      >
        <div
          v-if="!loading && !error && items.length > 0"
          class="sm:flex-1 sm:flex sm:flex-col sm:overflow-hidden"
        >
          <n-scrollbar class="sm:flex-1">
            <div
              class="grid grid-cols-4 sm:grid-cols-8 gap-2 sm:content-start pr-4"
            >
          <div
            v-for="item in items"
            :key="item.id"
            class="cursor-pointer"
            @click="navigateToDetail(item.id)"
          >
            <div
              class="relative aspect-[3/4] rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300"
              :class="getQualityGradient(item.quality)"
            >
              <NuxtImg
                :src="`/images/items/${item.id}.png`"
                :alt="t(`item.${item.id}.name`)"
                class="absolute inset-0 w-full h-full object-contain z-10"
                width="240"
                height="320"
                fit="cover"
                loading="lazy"
                sizes="xs:50vw sm:33vw md:25vw lg:20vw xl:16vw"
                @error="handleImageError"
              />
              <div class="absolute top-2 right-2 z-20">
                <n-tag
                  round
                  size="small"
                  :bordered="false"
                  :type="getQualityType(item.quality)"
                >
                  {{ item.quality }}<n-icon class="ml-1"><Star /></n-icon>
                </n-tag>
              </div>
              <div
                class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 z-20"
              >
                <p
                  class="text-white font-medium text-xs sm:text-sm line-clamp-2"
                >
                  {{ t(`item.${item.id}.name`) }}
                </p>
              </div>
            </div>
          </div>
          </div>
        </n-scrollbar>
        </div>
      </transition>

      <!-- Pagination - Always visible, sticky at bottom on mobile -->
      <ClientOnly>
        <div
          class="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 py-3 px-4 sm:relative sm:border-0 sm:bg-transparent sm:dark:bg-transparent sm:mt-6 sm:py-0 sm:px-0 shadow-lg sm:shadow-none sm:flex-shrink-0"
        >
          <div class="flex justify-center overflow-x-auto">
            <n-pagination
              v-model:page="currentPage"
              :page-count="Math.max(totalPages, 1)"
              :page-size="pageSize"
              :show-size-picker="false"
              :disabled="loading || !!error"
              :page-slot="5"
              show-quick-jumper
              class="sm:hidden"
            />
            <n-pagination
              v-model:page="currentPage"
              :page-count="Math.max(totalPages, 1)"
              :page-size="pageSize"
              :show-size-picker="false"
              :disabled="loading || !!error"
              class="hidden sm:flex"
            />
          </div>
        </div>
        <template #fallback>
          <div class="flex justify-center mt-6 sm:flex-shrink-0">
            <div
              class="h-10 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
            ></div>
          </div>
        </template>
      </ClientOnly>
    </n-card>
  </div>
</template>

<script setup lang="ts">
  import { Star } from '@vicons/fa'

  const { t } = useI18n()
  const localePath = useLocalePath()
  const route = useRoute()
  const router = useRouter()

  // State
  const qualityFilter = ref<number | null>(
    route.query.quality ? Number(route.query.quality) : null
  )
  const typeFilter = ref<string | null>(route.query.type?.toString() || null)
  const currentPage = ref(Number(route.query.page) || 1)
  const pageSize = 40

  // Composable
  const { fetchItemsPaginated } = useSupabaseItems()

  // Use asyncData for caching with proper key
  const cacheKey = computed(
    () =>
      `items-${qualityFilter.value}-${typeFilter.value}-${currentPage.value}-${pageSize}`
  )

  const {
    data: itemsData,
    pending: loading,
    error,
    refresh: loadItems,
  } = await useAsyncData(
    cacheKey.value,
    async () => {
      const response = await fetchItemsPaginated({
        quality: qualityFilter.value,
        type: typeFilter.value,
        page: currentPage.value,
      })

      return response
    },
    {
      default: () => ({ data: [], total: 0, totalPages: 0 }),
    }
  )

  // Computed values from the response
  const items = computed(() => itemsData.value?.data || [])

  const totalItems = computed(() => itemsData.value?.total || 0)

  const totalPages = computed(() => itemsData.value?.totalPages || 0)

  // Prefetching removed to reduce DB egress
  // Users can navigate to next page when needed

  // Watch for quality filter changes
  watch(qualityFilter, () => {
    currentPage.value = 1
    nextTick(() => loadItems())
  })

  // Watch for type filter changes
  watch(typeFilter, () => {
    currentPage.value = 1
    nextTick(() => loadItems())
  })

  // Watch for page changes
  watch(currentPage, () => {
    nextTick(() => loadItems())
  })

  // Update URL query params when filters change
  watch([qualityFilter, typeFilter, currentPage], () => {
    router.replace({
      query: {
        ...(qualityFilter.value && { quality: qualityFilter.value }),
        ...(typeFilter.value &&
          typeFilter.value !== 'all' && { type: typeFilter.value }),
        ...(currentPage.value > 1 && { page: currentPage.value }),
      },
    })
  })

  // Retry fetch
  const retryFetch = () => {
    loadItems()
  }

  // Clear all filters
  const clearFilters = () => {
    qualityFilter.value = null
    typeFilter.value = null
    currentPage.value = 1
  }

  // Get all available item types
  const availableTypes = computed(() => {
    return getAllItemTypes()
  })

  // Navigate to detail page
  const navigateToDetail = (id: number) => {
    router.push(localePath(`/item/${id}`))
  }

  // Get quality gradient class
  const getQualityGradient = (quality: number) => {
    switch (quality) {
      case 5:
        return 'bg-gradient-to-br from-[#fff8e1] to-[#ffcc80] hover:brightness-105 dark:from-[#713f12] dark:to-[#451a03]'
      case 4:
        return 'bg-gradient-to-br from-[#e3f2fd] to-[#bbdefb] hover:brightness-105 dark:from-[#334155] dark:to-[#1e293b]'
      case 3:
        return 'bg-gradient-to-br from-[#e0f2f1] to-[#80cbc4] hover:brightness-105 dark:from-[#134e4a] dark:to-[#0f766e]'
      case 2:
        return 'bg-gradient-to-br from-[#f5f5f5] to-[#d6d6d6] hover:brightness-105 dark:from-[#3f3f46] dark:to-[#27272a]'
      default:
        return 'bg-gradient-to-br from-gray-100 to-gray-200 hover:brightness-105 dark:from-gray-700 dark:to-gray-800'
    }
  }

  // Get quality type for tag
  const getQualityType = (quality: number) => {
    switch (quality) {
      case 5:
        return 'warning'
      case 4:
        return 'info'
      case 3:
        return 'success'
      case 2:
        return 'default'
      default:
        return 'default'
    }
  }

  // Handle image error
  const handleImageError = (e: Event | string) => {
    if (typeof e === 'string') return
    const img = e.target as HTMLImageElement
    img.src = '/images/loading.webp'
  }

  // Type filter options for dropdown
  const typeOptions = computed(() => {
    const options = [
      { label: t('compendium.filter_all_types'), value: null },
      ...availableTypes.value.map((type) => ({
        label: t(`tracker.items.types.${type}`),
        value: type,
      })),
    ]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return options as any
  })

  // SEO Meta Tags
  const siteUrl = useRuntimeConfig().public.siteUrl

  useSeoMeta({
    title: () => `${t('common.items')} - ${t('navigation.subtitle')}`,
    description: () => t('meta.description.items'),
    ogTitle: () => `${t('common.items')} - ${t('navigation.subtitle')}`,
    ogDescription: () => t('meta.description.items'),
    ogType: 'website',
    twitterTitle: () => `${t('common.items')} - ${t('navigation.subtitle')}`,
    twitterDescription: () => t('meta.description.items'),
  })

  useHead(() => ({
    link: [{ rel: 'canonical', href: `${siteUrl}${localePath('/item')}` }],
    script: [
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: `${t('common.items')} - ${t('navigation.subtitle')}`,
          description: t('meta.description.items'),
          url: `${siteUrl}${localePath('/item')}`,
        }),
      },
    ],
  }))
</script>

<style scoped>
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }

  /* Staggered animation for grid items */
  .grid > * {
    animation: fadeInUp 0.4s ease-out backwards;
  }

  .grid > *:nth-child(1) {
    animation-delay: 0.05s;
  }
  .grid > *:nth-child(2) {
    animation-delay: 0.1s;
  }
  .grid > *:nth-child(3) {
    animation-delay: 0.15s;
  }
  .grid > *:nth-child(4) {
    animation-delay: 0.2s;
  }
  .grid > *:nth-child(5) {
    animation-delay: 0.25s;
  }
  .grid > *:nth-child(6) {
    animation-delay: 0.3s;
  }
  .grid > *:nth-child(7) {
    animation-delay: 0.35s;
  }
  .grid > *:nth-child(8) {
    animation-delay: 0.4s;
  }
  .grid > *:nth-child(n + 9) {
    animation-delay: 0.45s;
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
