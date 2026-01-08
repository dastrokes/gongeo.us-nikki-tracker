<template>
  <div class="max-w-7xl mx-auto space-y-2 sm:space-y-4">
    <!-- Filter Card -->
    <n-card
      size="small"
      class="rounded-xl p-0 sm:p-2"
      content-class="!p-2 sm:p-4"
    >
      <div class="flex flex-col gap-4">
        <!-- Quality Filter Buttons -->
        <div class="flex justify-end items-center gap-2 flex-wrap">
          <div class="flex items-center gap-2 flex-wrap">
            <n-button
              v-if="hasFilters"
              size="small"
              @click="clearFilters"
            >
              {{ t('common.clear') }}
            </n-button>

            <!-- Type Filter Dropdown -->
            <n-select
              v-if="showTypeFilter"
              v-model:value="typeFilter"
              :options="typeOptions"
              size="small"
              class="w-52"
              :show-checkmark="false"
              :placeholder="t('compendium.filter_type')"
            />

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

    <!-- Grid Card -->
    <n-card
      size="small"
      class="rounded-xl p-0 sm:p-2 sm:flex-1 sm:flex sm:flex-col"
      content-class="!p-2 sm:p-4 sm:flex-1 sm:flex sm:flex-col"
    >
      <div class="sm:flex-1 sm:flex sm:flex-col min-h-0">
        <n-scrollbar class="sm:flex-1 min-h-0">
          <div class="space-y-3 sm:space-y-4">
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

            <div
              v-else-if="!loading && entries.length === 0"
              class="text-center py-12"
            >
              <n-result
                status="info"
                :title="t('compendium.no_results_title')"
                :description="t('compendium.no_results_description')"
              >
                <template #icon>
                  <NuxtImg
                    src="/images/404.webp"
                    alt="No results"
                    class="mx-auto w-32 h-32 sm:w-48 sm:h-48 object-cover"
                    width="400"
                    height="400"
                    fit="contain"
                    sizes="160px sm:200px"
                  />
                </template>
              </n-result>
            </div>

            <transition
              v-else
              name="fade"
              mode="out-in"
            >
              <div
                v-if="!loading && !error && entries.length > 0"
                key="grid"
                class="grid grid-cols-4 sm:grid-cols-8 gap-2 sm:content-start pr-4"
              >
                <div
                  v-for="entry in entries"
                  :key="entry.id"
                  class="cursor-pointer"
                  @click="navigateToDetail(entry.id)"
                >
                  <div
                    class="relative aspect-[2/3] rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300"
                    :class="getQualityGradient(entry.quality)"
                  >
                    <NuxtImg
                      :src="entry.image"
                      :alt="entry.name"
                      class="absolute inset-0 w-full h-full object-cover z-10"
                      preset="tallMd"
                      width="180"
                      height="270"
                      fit="cover"
                      loading="lazy"
                      sizes="200px sm:240px"
                    />
                    <div class="absolute top-1 right-1 z-20">
                      <n-tag
                        round
                        size="small"
                        :bordered="false"
                        :type="getQualityType(entry.quality)"
                      >
                        <span class="align-top">{{ entry.quality }}</span>
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
                        {{ entry.name }}
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

            <div class="flex justify-center items-center sm:pr-2">
              <n-pagination
                v-model:page="currentPage"
                :page-size="pageSize"
                :item-count="totalItems"
                :show-size-picker="false"
                :disabled="loading || !!error"
                :page-slot="5"
              >
                <template #prefix="{ itemCount }">
                  <div class="text-sm text-gray-600 dark:text-gray-400">
                    <span class="font-semibold text-gray-900 dark:text-white">{{
                      totalItems
                    }}</span>
                    <span class="ml-1">
                      {{
                        itemCount === 1
                          ? countLabels.singular
                          : countLabels.plural
                      }}
                    </span>
                  </div>
                </template>
              </n-pagination>
            </div>
          </div>
        </n-scrollbar>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import { Star } from '@vicons/fa'
  import type { SelectGroupOption, SelectOption } from 'naive-ui'
  import type { SupabaseItem, SupabaseOutfit } from '~/types/supabase'
  import type { ItemType } from '~/utils/itemType'
  import {
    getAllItemTypes,
    getItemTypeCategory,
    itemCategoryOrder,
  } from '~/utils/itemType'

  const { t } = useI18n()
  const localePath = useLocalePath()
  const route = useRoute()
  const router = useRouter()
  const { getImageSrc } = useImageProvider()

  const siteUrl = useRuntimeConfig().public.siteUrl

  const pageTitle = computed(
    () =>
      `${t('common.items')} - ${t('meta.game_title')} - ${t('navigation.title')}`
  )
  const description = computed(() => t('meta.description.items'))
  const canonicalPath = computed(() => localePath('/items'))

  useSeoMeta({
    title: () => pageTitle.value,
    description: () => description.value,
    ogTitle: () => pageTitle.value,
    ogDescription: () => description.value,
    ogType: 'website',
    twitterTitle: () => pageTitle.value,
    twitterDescription: () => description.value,
  })

  useHead(() => ({
    link: [{ rel: 'canonical', href: `${siteUrl}${canonicalPath.value}` }],
    script: [
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: pageTitle.value,
          description: description.value,
          url: `${siteUrl}${canonicalPath.value}`,
        }),
      },
    ],
  }))

  const pageSize = 40
  const availableItemTypes = getAllItemTypes()

  const resolveType = (value?: string | null) => {
    if (!value) return 'all'
    if (value === 'all') return 'all'
    if ((availableItemTypes as string[]).includes(value)) return value
    return 'all'
  }

  const qualityFilter = ref<number | null>(
    route.query.quality ? Number(route.query.quality) : null
  )
  const defaultType = computed(() => 'all')
  const typeFilter = ref<string>(
    resolveType(route.query.type?.toString() ?? null)
  )
  const currentPage = ref(Number(route.query.page) || 1)

  const showTypeFilter = computed(() => true)
  const hasFilters = computed(
    () =>
      qualityFilter.value !== null ||
      (showTypeFilter.value && typeFilter.value !== defaultType.value)
  )

  const { fetchItemsPaginated } = useSupabaseItems()

  const cacheKey = computed(
    () =>
      `items-${qualityFilter.value ?? 'all'}-${typeFilter.value}-${
        currentPage.value
      }-${pageSize}`
  )

  const {
    data: compendiumData,
    pending: loading,
    error,
    refresh: loadData,
  } = await useAsyncData(
    () => cacheKey.value,
    async () => {
      return fetchItemsPaginated({
        quality: qualityFilter.value,
        type: typeFilter.value === 'all' ? null : typeFilter.value,
        page: currentPage.value,
      })
    },
    {
      default: () => ({ data: [], total: 0, totalPages: 0 }),
      watch: [qualityFilter, typeFilter, currentPage],
    }
  )

  const entries = computed(() => {
    const data = (compendiumData.value?.data || []) as Array<
      SupabaseOutfit | SupabaseItem
    >

    return data.map((entry) => ({
      id: entry.id,
      quality: entry.quality,
      name: t(`item.${entry.id}.name`),
      image: getImageSrc('item', entry.id),
    }))
  })

  const totalItems = computed(() => compendiumData.value?.total || 0)

  const countLabels = computed(() => ({
    singular: t('common.item'),
    plural: t('common.items'),
  }))

  watch(qualityFilter, () => {
    currentPage.value = 1
  })

  watch(typeFilter, () => {
    currentPage.value = 1
  })

  watch([qualityFilter, typeFilter, currentPage], () => {
    router.replace({
      query: {
        ...(qualityFilter.value && { quality: qualityFilter.value }),
        ...(showTypeFilter.value &&
          typeFilter.value &&
          typeFilter.value !== defaultType.value && { type: typeFilter.value }),
        ...(currentPage.value > 1 && { page: currentPage.value }),
      },
    })
  })

  const retryFetch = () => {
    loadData()
  }

  const clearFilters = () => {
    qualityFilter.value = null
    typeFilter.value = defaultType.value
    currentPage.value = 1
  }

  const availableTypes = computed(() => {
    const types = getAllItemTypes()
    return types.sort((a, b) => {
      const orderA = itemCategoryOrder[a] ?? 999
      const orderB = itemCategoryOrder[b] ?? 999
      return orderA - orderB
    })
  })

  const typeOptions = computed(() => {
    if (!showTypeFilter.value) {
      return []
    }

    const types = availableTypes.value

    const grouped: Record<
      'clothes' | 'accessories' | 'makeups' | 'other',
      ItemType[]
    > = {
      clothes: [],
      accessories: [],
      makeups: [],
      other: [],
    }

    types.forEach((type) => {
      const category = getItemTypeCategory(type)
      if (grouped[category]) {
        grouped[category].push(type)
      }
    })

    const options: Array<SelectOption | SelectGroupOption> = [
      { label: t('common.items'), value: 'all' },
    ]

    if (grouped.clothes && grouped.clothes.length > 0) {
      options.push({
        type: 'group',
        label: t('tracker.items.category.clothes'),
        key: 'clothes',
        children: grouped.clothes.map((type) => ({
          label: t(`tracker.items.types.${type}`),
          value: type,
        })),
      })
    }

    if (grouped.accessories && grouped.accessories.length > 0) {
      options.push({
        type: 'group',
        label: t('tracker.items.category.accessories'),
        key: 'accessories',
        children: grouped.accessories.map((type) => ({
          label: t(`tracker.items.types.${type}`),
          value: type,
        })),
      })
    }

    if (grouped.makeups && grouped.makeups.length > 0) {
      options.push({
        type: 'group',
        label: t('tracker.items.category.makeups'),
        key: 'makeups',
        children: grouped.makeups.map((type) => ({
          label: t(`tracker.items.types.${type}`),
          value: type,
        })),
      })
    }

    if (grouped.other && grouped.other.length > 0) {
      options.push({
        type: 'group',
        label: t('common.other'),
        key: 'other',
        children: grouped.other.map((type) => ({
          label: t(`tracker.items.types.${type}`),
          value: type,
        })),
      })
    }

    return options
  })

  const navigateToDetail = (id: number) => {
    router.push(localePath(`/items/${id}`))
  }

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
