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
        <div class="flex justify-end items-center gap-2 flex-wrap">
          <div class="flex items-center gap-2">
            <!-- Clear filters button -->
            <n-button
              v-if="qualityFilter !== null"
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
            </n-button-group>
          </div>
        </div>
      </div>
    </n-card>

    <!-- Outfits Grid Card -->
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
        v-else-if="outfits.length === 0"
        class="text-center py-12"
      >
        <n-result
          status="info"
          :title="t('compendium.no_results_title')"
          :description="t('compendium.no_results_description')"
        />
      </div>

      <!-- Outfits Grid -->
      <div class="sm:flex-1 sm:flex sm:flex-col sm:overflow-hidden">
        <n-scrollbar class="sm:flex-1">
          <transition
            name="fade"
            mode="out-in"
          >
            <div
              v-if="!loading && !error && outfits.length > 0"
              key="grid"
              class="grid grid-cols-4 sm:grid-cols-8 gap-2 sm:content-start pr-4"
            >
              <div
                v-for="outfit in outfits"
                :key="outfit.id"
                class="cursor-pointer"
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
                  <div class="absolute top-1 right-1 z-20">
                    <n-tag
                      round
                      size="small"
                      :bordered="false"
                      :type="getQualityType(outfit.quality)"
                    >
                      <span class="align-top">{{ outfit.quality }}</span>
                      <span class="ml-0.5"
                        ><n-icon><Star /></n-icon
                      ></span>
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
            <div
              v-else-if="loading"
              key="loading"
              class="grid grid-cols-4 sm:grid-cols-8 gap-2 sm:content-start pr-4"
            >
              <div
                v-for="i in pageSize"
                :key="`skeleton-${i}`"
                class="relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 animate-pulse"
              ></div>
            </div>
          </transition>
        </n-scrollbar>
      </div>

      <!-- Pagination - Sticky at bottom on mobile, inline on desktop -->
      <div
        class="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 py-3 px-4 sm:relative sm:border-0 sm:bg-transparent sm:dark:bg-transparent sm:mt-6 sm:py-0 sm:px-0 shadow-lg sm:shadow-none sm:flex-shrink-0"
      >
        <div class="flex justify-center">
          <n-pagination
            v-model:page="currentPage"
            :page-size="pageSize"
            :item-count="totalItems"
            :show-size-picker="false"
            :disabled="loading || !!error"
            :page-slot="5"
          >
            <template #prefix="{ itemCount }">
              <span class="text-sm opacity-70">
                {{ itemCount }} {{ itemCount === 1 ? 'outfit' : 'outfits' }}
              </span>
            </template>
          </n-pagination>
        </div>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
  import { Star } from '@vicons/fa'

  const { t } = useI18n()
  const localePath = useLocalePath()
  const router = useRouter()
  const route = useRoute()

  // State
  const qualityFilter = ref<number | null>(
    route.query.quality ? Number(route.query.quality) : null
  )
  const currentPage = ref(Number(route.query.page) || 1)
  const pageSize = 40

  // Composable
  const { fetchOutfitsPaginated } = useSupabaseOutfits()

  // Use asyncData for caching with proper key
  const cacheKey = computed(
    () => `outfits-${qualityFilter.value}-${currentPage.value}-${pageSize}`
  )

  const {
    data: outfitsData,
    pending: loading,
    error,
    refresh: loadOutfits,
  } = await useAsyncData(
    cacheKey.value,
    async () => {
      const response = await fetchOutfitsPaginated({
        quality: qualityFilter.value,
        page: currentPage.value,
      })

      return response
    },
    {
      default: () => ({ data: [], total: 0, totalPages: 0 }),
    }
  )

  // Computed values from the response
  const outfits = computed(() => outfitsData.value?.data || [])

  const totalItems = computed(() => outfitsData.value?.total || 0)

  // Watch for quality filter changes
  watch(qualityFilter, () => {
    currentPage.value = 1
    loadOutfits()
  })

  // Watch for page changes
  watch(currentPage, () => {
    loadOutfits()
  })

  // Update URL query params when filters change
  watch([qualityFilter, currentPage], () => {
    router.replace({
      query: {
        ...(qualityFilter.value && { quality: qualityFilter.value }),
        ...(currentPage.value > 1 && { page: currentPage.value }),
      },
    })
  })

  // Retry fetch
  const retryFetch = () => {
    loadOutfits()
  }

  // Clear all filters
  const clearFilters = () => {
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
    title: () => `${t('common.outfits')} - ${t('navigation.subtitle')}`,
    description: () => t('meta.description.outfits'),
    ogTitle: () => `${t('common.outfits')} - ${t('navigation.subtitle')}`,
    ogDescription: () => t('meta.description.outfits'),
    ogType: 'website',
    twitterTitle: () => `${t('common.outfits')} - ${t('navigation.subtitle')}`,
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
          name: `${t('common.outfits')} - ${t('navigation.subtitle')}`,
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
