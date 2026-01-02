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
            :placeholder="t('outfit.search_placeholder')"
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
              v-if="searchQuery || qualityFilter !== null"
              class="text-sm opacity-70"
            >
              {{ totalItems }} {{ totalItems === 1 ? 'outfit' : 'outfits' }}
            </div>
          </ClientOnly>

          <div class="flex items-center gap-2">
            <!-- Clear filters button -->
            <n-button
              v-if="searchQuery || qualityFilter !== null"
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
                {{ t('outfit.filter_all') }}
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

    <!-- Outfits Grid Card -->
    <n-card
      size="small"
      class="rounded-xl p-0 sm:p-2"
      content-class="!p-2 sm:p-4"
    >
      <!-- Loading State -->
      <div
        v-if="loading"
        class="grid grid-cols-4 sm:grid-cols-8 gap-2"
      >
        <div
          v-for="i in pageSize"
          :key="i"
          class="relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 animate-pulse"
        >
          <div class="absolute inset-0 flex flex-col justify-between p-2">
            <!-- Quality badge skeleton -->
            <div class="flex justify-end">
              <div class="w-10 h-5 bg-gray-200 dark:bg-gray-700 rounded-full" />
            </div>
            <!-- Name skeleton -->
            <div class="space-y-1">
              <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            </div>
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
          :title="t('outfit.error_title')"
          :description="t('outfit.error_description')"
        >
          <template #footer>
            <n-button
              type="primary"
              @click="retryFetch"
            >
              {{ t('outfit.retry') }}
            </n-button>
          </template>
        </n-result>
      </div>

      <!-- No Results State -->
      <div
        v-else-if="outfits.length === 0"
        class="text-center py-12"
      >
        <n-result
          status="info"
          :title="t('outfit.no_results_title')"
          :description="t('outfit.no_results_description')"
        />
      </div>

      <!-- Outfits Grid -->
      <transition
        name="fade"
        mode="out-in"
      >
        <div
          v-if="!loading && !error && outfits.length > 0"
          class="grid grid-cols-4 sm:grid-cols-8 gap-2"
        >
          <div
            v-for="outfit in outfits"
            :key="outfit.id"
            class="cursor-pointer transition-all duration-300 ease-out hover:scale-[1.02] hover:-translate-y-1"
            @click="navigateToDetail(outfit.id)"
          >
            <div
              class="relative aspect-[3/4] rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300"
              :class="getQualityGradient(outfit.quality)"
            >
              <NuxtImg
                :src="`/images/outfits/${outfit.id}.png`"
                :alt="t(`outfit.${outfit.id}.name`)"
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
                  :type="getQualityType(outfit.quality)"
                >
                  {{ outfit.quality }}<n-icon class="ml-1"><Star /></n-icon>
                </n-tag>
              </div>
              <div
                class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 z-20"
              >
                <p
                  class="text-white font-medium text-xs sm:text-sm line-clamp-2"
                >
                  {{ t(`outfit.${outfit.id}.name`) }}
                </p>
              </div>
            </div>
          </div>
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
              :page-sizes="[12, 24, 36, 48]"
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
  const router = useRouter()
  const route = useRoute()

  // State
  const searchQuery = ref(route.query.search?.toString() || '')
  const qualityFilter = ref<number | null>(
    route.query.quality ? Number(route.query.quality) : null
  )
  const currentPage = ref(Number(route.query.page) || 1)
  const pageSize = ref(Number(route.query.pageSize) || 24)

  // Composable
  const { fetchOutfitsPaginated } = useSupabaseOutfits()

  // Prefetch next page for better UX (only when not searching)
  const prefetchNextPage = async () => {
    if (searchQuery.value) return // Don't prefetch when searching

    try {
      await fetchOutfitsPaginated({
        quality: qualityFilter.value,
        page: currentPage.value + 1,
        pageSize: pageSize.value,
      })
    } catch (e) {
      // Silently fail prefetch
      console.debug('Prefetch failed:', e)
    }
  }

  // Use asyncData for caching with proper key
  const cacheKey = computed(
    () =>
      `outfits-${searchQuery.value}-${qualityFilter.value}-${currentPage.value}-${pageSize.value}`
  )

  const {
    data: outfitsData,
    pending: loading,
    error,
    refresh: loadOutfits,
  } = await useAsyncData(
    cacheKey.value,
    async () => {
      // If searching, fetch all outfits for client-side filtering
      if (searchQuery.value) {
        const response = await fetchOutfitsPaginated({
          quality: qualityFilter.value,
          page: 1,
          pageSize: 10000, // Fetch all outfits when searching
        })
        return response
      }

      // Otherwise, use server-side pagination
      const response = await fetchOutfitsPaginated({
        quality: qualityFilter.value,
        page: currentPage.value,
        pageSize: pageSize.value,
      })

      // Prefetch next page if available
      if (currentPage.value < response.totalPages) {
        prefetchNextPage()
      }

      return response
    },
    {
      default: () => ({ data: [], total: 0, totalPages: 0 }),
    }
  )

  // Computed values from the response
  const allOutfits = computed(() => outfitsData.value?.data || [])

  // Client-side search using Fuse.js (only when search query exists)
  const searchedOutfits = computed(() => {
    if (!searchQuery.value || !allOutfits.value.length) {
      return allOutfits.value
    }

    // Minimum 2 characters required for search
    if (searchQuery.value.trim().length < 2) {
      return allOutfits.value
    }

    // Import outfit names from i18n for search
    const outfitsWithNames = allOutfits.value.map((outfit) => ({
      ...outfit,
      name: t(`outfit.${outfit.id}.name`),
    }))

    // Use Fuse.js for fuzzy search
    const fuse = new Fuse(outfitsWithNames, {
      keys: ['name'],
      threshold: 0.3,
      includeScore: true,
    })

    const results = fuse.search(searchQuery.value)
    return results.map((result) => result.item)
  })

  // Client-side pagination when searching
  const outfits = computed(() => {
    if (!searchQuery.value) {
      return searchedOutfits.value
    }

    // Apply client-side pagination to search results
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    return searchedOutfits.value.slice(start, end)
  })

  const totalItems = computed(() => {
    // If searching, return filtered count, otherwise server total
    return searchQuery.value
      ? searchedOutfits.value.length
      : outfitsData.value?.total || 0
  })

  const totalPages = computed(() => {
    // If searching, calculate pages from filtered results, otherwise use server total
    if (searchQuery.value) {
      return Math.ceil(searchedOutfits.value.length / pageSize.value)
    }
    return outfitsData.value?.totalPages || 0
  })

  // Debounced search - triggers refetch with all outfits
  const debouncedSearch = useDebounceFn(() => {
    currentPage.value = 1
    // Only refetch if we need to switch between search mode and normal mode
    // or if we're entering search mode for the first time
    const wasSearching = allOutfits.value.length > pageSize.value
    const isSearching = searchQuery.value.trim().length >= 2

    if (isSearching && !wasSearching) {
      // Entering search mode - need to fetch all outfits
      loadOutfits()
    } else if (!isSearching && wasSearching) {
      // Exiting search mode - need to fetch paginated outfits
      loadOutfits()
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
    loadOutfits()
  })

  // Watch for page changes (when not searching, need to refetch)
  watch(currentPage, () => {
    if (!searchQuery.value) {
      loadOutfits()
    }
  })

  // Watch for page size changes
  watch(pageSize, () => {
    currentPage.value = 1
    loadOutfits()
  })

  // Update URL query params when filters change
  watch([searchQuery, qualityFilter, currentPage, pageSize], () => {
    router.replace({
      query: {
        ...(searchQuery.value && { search: searchQuery.value }),
        ...(qualityFilter.value && { quality: qualityFilter.value }),
        ...(currentPage.value > 1 && { page: currentPage.value }),
        ...(pageSize.value !== 24 && { pageSize: pageSize.value }),
      },
    })
  })

  // Retry fetch
  const retryFetch = () => {
    loadOutfits()
  }

  // Clear all filters
  const clearFilters = () => {
    searchQuery.value = ''
    qualityFilter.value = null
    currentPage.value = 1
  }

  // Navigate to detail page
  const navigateToDetail = (id: number) => {
    router.push(localePath(`/outfit/${id}`))
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

  // SEO Meta Tags
  const siteUrl = useRuntimeConfig().public.siteUrl

  useSeoMeta({
    title: () => `${t('navigation.outfits')} - ${t('navigation.subtitle')}`,
    description: () => t('meta.description.outfits'),
    ogTitle: () => `${t('navigation.outfits')} - ${t('navigation.subtitle')}`,
    ogDescription: () => t('meta.description.outfits'),
    ogType: 'website',
    twitterTitle: () =>
      `${t('navigation.outfits')} - ${t('navigation.subtitle')}`,
    twitterDescription: () => t('meta.description.outfits'),
  })

  useHead(() => ({
    link: [{ rel: 'canonical', href: `${siteUrl}${localePath('/outfit')}` }],
    script: [
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: `${t('navigation.outfits')} - ${t('navigation.subtitle')}`,
          description: t('meta.description.outfits'),
          url: `${siteUrl}${localePath('/outfit')}`,
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
  .grid > *:nth-child(n + 5) {
    animation-delay: 0.25s;
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
