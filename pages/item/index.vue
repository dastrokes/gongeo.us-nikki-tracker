<template>
  <div class="max-w-7xl mx-auto space-y-2 sm:space-y-4">
    <!-- Search and Filter Card -->
    <n-card
      size="small"
      class="rounded-xl p-0 sm:p-2"
      content-class="!p-2 sm:p-4"
    >
      <div class="flex flex-col gap-4">
        <!-- Search Bar -->
        <div class="flex-1">
          <n-input
            v-model:value="searchQuery"
            :placeholder="t('item.search_placeholder')"
            clearable
            size="medium"
          >
            <template #prefix>
              <n-icon><Search /></n-icon>
            </template>
          </n-input>
        </div>

        <!-- Quality Filter Buttons -->
        <div
          class="flex justify-between sm:justify-end items-center gap-2 flex-wrap"
        >
          <!-- Active filter indicator -->
          <ClientOnly>
            <div
              v-if="searchQuery || qualityFilter !== null || typeFilter"
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
              :placeholder="t('item.filter_type')"
            />

            <!-- Clear filters button -->
            <n-button
              v-if="searchQuery || qualityFilter !== null || typeFilter"
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
                {{ t('item.filter_all') }}
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
            </n-button-group>
          </div>
        </div>
      </div>
    </n-card>

    <!-- Items Grid Card -->
    <n-card
      size="small"
      class="rounded-xl p-0 sm:p-2"
      content-class="!p-2 sm:p-4"
    >
      <!-- Loading State -->
      <div
        v-if="loading"
        class="grid grid-cols-5 sm:grid-cols-10 gap-2"
      >
        <div
          v-for="i in pageSize"
          :key="i"
          class="relative aspect-square rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800 animate-pulse"
        >
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div
        v-else-if="error"
        class="text-center py-12"
      >
        <n-result
          status="error"
          :title="t('item.error_title')"
          :description="t('item.error_description')"
        >
          <template #footer>
            <n-button
              type="primary"
              @click="retryFetch"
            >
              {{ t('item.retry') }}
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
          :title="t('item.no_results_title')"
          :description="t('item.no_results_description')"
        />
      </div>

      <!-- Items Grid -->
      <transition
        name="fade"
        mode="out-in"
      >
        <div
          v-if="!loading && !error && items.length > 0"
          class="grid grid-cols-5 sm:grid-cols-10 gap-2"
        >
          <ItemPreviewCard
            v-for="item in items"
            :key="item.id"
            :item-id="item.id"
            :quality="item.quality"
            :type="item.type"
            :name="t(`item.${item.id}.name`)"
            :clickable="true"
            size="medium"
          />
        </div>
      </transition>

      <!-- Pagination - Sticky at bottom on mobile -->
      <ClientOnly>
        <div
          class="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 py-3 px-4 sm:relative sm:border-0 sm:bg-transparent sm:dark:bg-transparent sm:mt-6 sm:py-0 sm:px-0 shadow-lg sm:shadow-none"
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
              show-size-picker
              :page-sizes="[24, 48, 72, 96]"
              :disabled="loading || !!error"
              class="hidden sm:flex"
              @update:page-size="
                (size) => {
                  pageSize = size
                  currentPage = 1
                }
              "
            />
          </div>
        </div>
        <template #fallback>
          <div class="flex justify-center mt-6">
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
  import { Search, Star } from '@vicons/fa'
  import { useDebounceFn } from '@vueuse/core'
  import Fuse from 'fuse.js'

  const { t } = useI18n()
  const localePath = useLocalePath()
  const route = useRoute()
  const router = useRouter()

  // State
  const searchQuery = ref(route.query.search?.toString() || '')
  const qualityFilter = ref<number | null>(
    route.query.quality ? Number(route.query.quality) : null
  )
  const typeFilter = ref<string | null>(route.query.type?.toString() || null)
  const currentPage = ref(Number(route.query.page) || 1)
  const pageSize = ref(Number(route.query.pageSize) || 30)

  // Composable
  const { fetchItemsPaginated } = useSupabaseItems()

  // Use asyncData for caching with proper key
  const cacheKey = computed(
    () =>
      `items-${searchQuery.value}-${qualityFilter.value}-${typeFilter.value}-${currentPage.value}-${pageSize.value}`
  )

  const {
    data: itemsData,
    pending: loading,
    error,
    refresh: loadItems,
  } = await useAsyncData(
    cacheKey.value,
    async () => {
      // If searching, fetch all items for client-side filtering
      if (searchQuery.value) {
        const response = await fetchItemsPaginated({
          quality: qualityFilter.value,
          type: typeFilter.value,
          page: 1,
          pageSize: 10000, // Fetch all items when searching
        })
        return response
      }

      // Otherwise, use server-side pagination
      const response = await fetchItemsPaginated({
        quality: qualityFilter.value,
        type: typeFilter.value,
        page: currentPage.value,
        pageSize: pageSize.value,
      })

      return response
    },
    {
      default: () => ({ data: [], total: 0, totalPages: 0 }),
    }
  )

  // Computed values from the response
  const allItems = computed(() => itemsData.value?.data || [])

  // Client-side search using Fuse.js (only when search query exists)
  const searchedItems = computed(() => {
    if (!searchQuery.value || !allItems.value.length) {
      return allItems.value
    }

    // Minimum 2 characters required for search
    if (searchQuery.value.trim().length < 2) {
      return allItems.value
    }

    // Import item names from i18n for search
    const itemsWithNames = allItems.value.map((item) => ({
      ...item,
      name: t(`item.${item.id}.name`),
    }))

    // Use Fuse.js for fuzzy search
    const fuse = new Fuse(itemsWithNames, {
      keys: ['name'],
      threshold: 0.3,
      includeScore: true,
    })

    const results = fuse.search(searchQuery.value)
    return results.map((result) => result.item)
  })

  // Client-side pagination when searching
  const items = computed(() => {
    if (!searchQuery.value) {
      return searchedItems.value
    }

    // Apply client-side pagination to search results
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    return searchedItems.value.slice(start, end)
  })

  const totalItems = computed(() => {
    // If searching, return filtered count, otherwise server total
    return searchQuery.value
      ? searchedItems.value.length
      : itemsData.value?.total || 0
  })

  const totalPages = computed(() => {
    // If searching, calculate pages from filtered results, otherwise use server total
    if (searchQuery.value) {
      return Math.ceil(searchedItems.value.length / pageSize.value)
    }
    return itemsData.value?.totalPages || 0
  })

  // Prefetch next page for better UX
  const prefetchNextPage = async () => {
    // Only prefetch if not searching (server-side pagination)
    if (searchQuery.value) return

    try {
      await fetchItemsPaginated({
        quality: qualityFilter.value,
        type: typeFilter.value,
        page: currentPage.value + 1,
        pageSize: pageSize.value,
      })
    } catch (e) {
      // Silently fail prefetch
      console.debug('Prefetch failed:', e)
    }
  }

  // Prefetch when items load successfully
  watch(items, () => {
    if (
      items.value &&
      items.value.length > 0 &&
      currentPage.value < totalPages.value
    ) {
      prefetchNextPage()
    }
  })

  // Debounced search - triggers refetch with all items
  const debouncedSearch = useDebounceFn(() => {
    currentPage.value = 1
    // Only refetch if we need to switch between search mode and normal mode
    // or if we're entering search mode for the first time
    const wasSearching = allItems.value.length > pageSize.value
    const isSearching = searchQuery.value.trim().length >= 2

    if (isSearching && !wasSearching) {
      // Entering search mode - need to fetch all items
      loadItems()
    } else if (!isSearching && wasSearching) {
      // Exiting search mode - need to fetch paginated items
      loadItems()
    }
    // Otherwise, just let the computed property handle client-side filtering
  }, 1000)

  // Watch for search changes with debounce
  watch(searchQuery, () => {
    debouncedSearch()
  })

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

  // Watch for page changes (when not searching, need to refetch)
  watch(currentPage, () => {
    if (!searchQuery.value) {
      nextTick(() => loadItems())
    }
  })

  // Watch for page size changes
  watch(pageSize, () => {
    currentPage.value = 1
    nextTick(() => loadItems())
  })

  // Update URL query params when filters change
  watch([searchQuery, qualityFilter, typeFilter, currentPage, pageSize], () => {
    router.replace({
      query: {
        ...(searchQuery.value && { search: searchQuery.value }),
        ...(qualityFilter.value && { quality: qualityFilter.value }),
        ...(typeFilter.value &&
          typeFilter.value !== 'all' && { type: typeFilter.value }),
        ...(currentPage.value > 1 && { page: currentPage.value }),
        ...(pageSize.value !== 30 && { pageSize: pageSize.value }),
      },
    })
  })

  // Retry fetch
  const retryFetch = () => {
    loadItems()
  }

  // Clear all filters
  const clearFilters = () => {
    searchQuery.value = ''
    qualityFilter.value = null
    typeFilter.value = null
    currentPage.value = 1
  }

  // Get all available item types
  const availableTypes = computed(() => {
    return getAllItemTypes()
  })

  // Type filter options for dropdown
  const typeOptions = computed(() => {
    const options = [
      { label: t('item.filter_all_types'), value: null },
      ...availableTypes.value.map((type) => ({
        label: t(`items.types.${type}`),
        value: type,
      })),
    ]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return options as any
  })

  // SEO Meta Tags
  const siteUrl = useRuntimeConfig().public.siteUrl

  useSeoMeta({
    title: () => `${t('navigation.items')} - ${t('navigation.subtitle')}`,
    description: () => t('meta.description.items'),
    ogTitle: () => `${t('navigation.items')} - ${t('navigation.subtitle')}`,
    ogDescription: () => t('meta.description.items'),
    ogType: 'website',
    twitterTitle: () =>
      `${t('navigation.items')} - ${t('navigation.subtitle')}`,
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
          name: `${t('navigation.items')} - ${t('navigation.subtitle')}`,
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
