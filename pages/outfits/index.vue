<template>
  <div class="max-w-7xl mx-auto space-y-2 sm:space-y-4">
    <!-- Filter Card -->
    <n-card
      size="small"
      class="rounded-xl p-0 sm:p-2"
      content-class="!p-2 sm:p-4"
    >
      <div class="flex flex-col gap-4">
        <div class="flex justify-end items-center gap-2 flex-wrap">
          <div class="flex items-center gap-2 flex-wrap">
            <n-button
              v-if="hasFilters"
              size="small"
              @click="clearFilters"
            >
              {{ t('common.clear') }}
            </n-button>

            <n-select
              v-model:value="styleFilter"
              :options="styleOptions"
              size="small"
              class="w-40"
              clearable
              :show-checkmark="false"
              :placeholder="t('compendium.filter_style')"
            />

            <n-select
              v-model:value="labelFilter"
              :options="labelOptions"
              size="small"
              class="w-40"
              clearable
              filterable
              :show-checkmark="false"
              :placeholder="t('compendium.filter_label')"
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
                    :src="getImageSrc('static', '/images/404.webp')"
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
                class="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3 sm:content-start"
              >
                <NuxtLink
                  v-for="entry in entries"
                  :key="entry.id"
                  no-prefetch
                  :to="localePath(`/outfits/${entry.id}`)"
                  class="block cursor-pointer group"
                >
                  <OutfitCard
                    :outfit-id="entry.id"
                    :quality="entry.quality"
                    :name="entry.name"
                    :style="entry.style"
                    :labels="entry.labels"
                    class="transition-shadow duration-300 group-hover:shadow-xl"
                  />
                </NuxtLink>
              </div>
              <div
                v-else-if="loading"
                key="loading"
                class="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3 sm:content-start"
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
  import type { SupabaseOutfit } from '~/types/supabase'
  import {
    normalizeTraitKey,
    STYLE_DEFINITIONS,
    TAG_DEFINITIONS,
  } from '~/utils/itemInfo'

  const { t } = useI18n()
  const localePath = useLocalePath()
  const route = useRoute()
  const router = useRouter()
  const { getImageSrc } = imageProvider()

  const siteUrl = useRuntimeConfig().public.siteUrl

  const pageTitle = computed(
    () =>
      `${t('common.outfits')} - ${t('meta.game_title')} - ${t('navigation.title')}`
  )
  const description = computed(() => t('meta.description.outfits'))
  const canonicalPath = computed(() => localePath('/outfits'))

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

  const pageSize = 18

  const availableStyles = STYLE_DEFINITIONS.map((style) => style.key)
  const availableLabels = TAG_DEFINITIONS.map((tag) => tag.key)

  const resolveStyle = (value?: string | null) => {
    if (!value) return null
    const normalized = normalizeTraitKey(value)
    if (normalized === 'all') return null
    if (availableStyles.includes(normalized)) return normalized
    return null
  }

  const resolveLabel = (value?: string | null) => {
    if (!value) return null
    const normalized = normalizeTraitKey(value)
    if (normalized === 'all') return null
    if (availableLabels.includes(normalized)) return normalized
    return null
  }

  const qualityFilter = ref<number | null>(
    route.query.quality ? Number(route.query.quality) : null
  )
  const styleFilter = ref<string | null>(
    resolveStyle(route.query.style?.toString() ?? null)
  )
  const labelFilter = ref<string | null>(
    resolveLabel(route.query.label?.toString() ?? null)
  )
  const currentPage = ref(Number(route.query.page) || 1)
  const hasFilters = computed(
    () =>
      qualityFilter.value !== null ||
      styleFilter.value !== null ||
      labelFilter.value !== null
  )

  const { fetchOutfitsPaginated } = useSupabaseOutfits()

  const cacheKey = computed(
    () =>
      `outfits-${qualityFilter.value ?? 'all'}-${styleFilter.value ?? 'all'}-${
        labelFilter.value ?? 'all'
      }-${currentPage.value}-${pageSize}`
  )

  const {
    data: compendiumData,
    pending: loading,
    error,
    refresh: loadData,
  } = await useAsyncData(
    () => cacheKey.value,
    async () =>
      fetchOutfitsPaginated({
        quality: qualityFilter.value,
        style: styleFilter.value,
        label: labelFilter.value,
        page: currentPage.value,
      }),
    {
      default: () => ({ data: [], total: 0, totalPages: 0 }),
      watch: [qualityFilter, styleFilter, labelFilter, currentPage],
    }
  )

  const entries = computed(() => {
    const data = (compendiumData.value?.data || []) as Array<
      SupabaseOutfit & {
        style?: string | null
        labels?: string[]
      }
    >

    return data.map((entry) => ({
      id: entry.id,
      quality: entry.quality,
      name: t(`outfit.${entry.id}.name`),
      style: entry.style ? t(entry.style) : null,
      labels: (entry.labels || []).map((label) => t(label)),
    }))
  })

  const totalItems = computed(() => compendiumData.value?.total || 0)

  const countLabels = computed(() => ({
    singular: t('common.outfit'),
    plural: t('common.outfits'),
  }))

  watch(qualityFilter, () => {
    currentPage.value = 1
  })

  watch(styleFilter, () => {
    currentPage.value = 1
  })

  watch(labelFilter, () => {
    currentPage.value = 1
  })

  watch([qualityFilter, styleFilter, labelFilter, currentPage], () => {
    router.replace({
      query: {
        ...(qualityFilter.value && { quality: qualityFilter.value }),
        ...(styleFilter.value && { style: styleFilter.value }),
        ...(labelFilter.value && { label: labelFilter.value }),
        ...(currentPage.value > 1 && { page: currentPage.value }),
      },
    })
  })

  const retryFetch = () => {
    loadData()
  }

  const clearFilters = () => {
    qualityFilter.value = null
    styleFilter.value = null
    labelFilter.value = null
    currentPage.value = 1
  }

  const styleOptions = computed(() =>
    STYLE_DEFINITIONS.map((style) => ({
      label: t(style.i18nKey),
      value: style.key,
    }))
  )

  const labelOptions = computed(() =>
    TAG_DEFINITIONS.map((tag) => ({
      label: t(tag.i18nKey),
      value: tag.key,
    }))
  )
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
