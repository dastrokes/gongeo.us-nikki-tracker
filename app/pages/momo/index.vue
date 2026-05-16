<template>
  <div class="mx-auto max-w-7xl space-y-2 sm:space-y-4">
    <n-card
      size="small"
      class="rounded-xl p-0 sm:p-2"
      content-class="p-2 sm:p-4"
    >
      <div class="flex flex-col gap-2">
        <div class="flex items-start justify-between gap-2">
          <div
            class="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center"
          >
            <n-select
              :value="compendiumSection"
              :options="compendiumSectionOptions"
              :render-label="renderCompendiumSectionOptionLabel"
              size="small"
              class="w-full self-start sm:w-40"
              :show-checkmark="false"
              :clearable="false"
              @update:value="handleCompendiumSectionChange"
            />

            <div class="hidden min-w-0 overflow-x-auto sm:block">
              <n-button-group class="min-w-max">
                <n-button
                  size="small"
                  :type="qualityFilter === null ? 'primary' : 'default'"
                  class="min-w-10"
                  @click="qualityFilter = null"
                >
                  {{ t('common.all') }}
                </n-button>
                <n-button
                  v-for="quality in qualityOptions"
                  :key="quality"
                  size="small"
                  v-bind="
                    getQualityButtonTheme(quality, qualityFilter === quality)
                  "
                  class="min-w-10"
                  @click="qualityFilter = quality"
                >
                  <span class="flex items-center gap-1">
                    {{ quality }}
                    <n-icon>
                      <Star />
                    </n-icon>
                  </span>
                </n-button>
              </n-button-group>
            </div>

            <n-button
              v-if="hasFilters"
              size="small"
              class="hidden sm:inline-flex"
              @click="clearFilters"
            >
              {{ t('common.clear') }}
            </n-button>
          </div>
        </div>

        <div class="flex items-start gap-2 sm:hidden">
          <div class="min-w-0 flex-1 overflow-x-auto pb-1">
            <n-button-group class="min-w-max">
              <n-button
                size="small"
                :type="qualityFilter === null ? 'primary' : 'default'"
                class="min-w-10"
                @click="qualityFilter = null"
              >
                {{ t('common.all') }}
              </n-button>
              <n-button
                v-for="quality in qualityOptions"
                :key="quality"
                size="small"
                v-bind="
                  getQualityButtonTheme(quality, qualityFilter === quality)
                "
                class="min-w-10"
                @click="qualityFilter = quality"
              >
                <span class="flex items-center gap-1">
                  {{ quality }}
                  <n-icon>
                    <Star />
                  </n-icon>
                </span>
              </n-button>
            </n-button-group>
          </div>

          <div class="flex shrink-0 items-center gap-2">
            <n-button
              v-if="hasFilters"
              size="small"
              @click="clearFilters"
            >
              {{ t('common.clear') }}
            </n-button>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <n-select
            v-model:value="obtainFilter"
            :options="obtainOptions"
            size="small"
            class="min-w-0"
            clearable
            filterable
            :show-checkmark="false"
            :placeholder="t('compendium.filter_obtain')"
          />
        </div>
      </div>
    </n-card>

    <n-card
      size="small"
      class="rounded-xl p-0 sm:flex sm:flex-1 sm:flex-col sm:p-2"
      content-class="p-2 sm:p-4 sm:flex-1 sm:flex sm:flex-col"
    >
      <div class="min-h-0 sm:flex sm:flex-1 sm:flex-col">
        <div class="space-y-3 sm:space-y-4">
          <div
            v-if="error"
            class="py-12 text-center"
          >
            <n-result
              size="small"
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
            class="py-12 text-center"
          >
            <n-result
              size="small"
              status="info"
              :title="t('common.no_results_found')"
              :description="t('compendium.no_results_description')"
            >
              <template #icon>
                <NuxtImg
                  :src="getImageSrc('emote', 'think')"
                  class="mx-auto h-24 w-24 object-cover sm:h-32 sm:w-32"
                  preset="iconLg"
                  fit="cover"
                  sizes="160px sm:200px"
                />
              </template>
            </n-result>
          </div>

          <n-collapse-transition
            v-else
            mode="out-in"
            appear
          >
            <div
              v-if="!loading && !error && entries.length > 0"
              key="grid"
              class="grid grid-cols-3 gap-2 sm:grid-cols-6 sm:content-start sm:gap-3"
            >
              <NuxtLinkLocale
                v-for="(entry, index) in entries"
                :key="entry.id"
                no-prefetch
                :to="`/momo/${entry.id}`"
                class="group animate-fade-in-up block cursor-pointer motion-reduce:animate-none"
                :style="{
                  animationDelay: `${Math.min(index + 1, 12) * 0.05}s`,
                }"
              >
                <div
                  class="relative aspect-2/3 overflow-hidden rounded-lg shadow-md transition-shadow duration-300 group-hover:shadow-xl"
                  style="
                    background-image: url('/images/bg.webp');
                    background-size: cover;
                    background-position: center;
                  "
                >
                  <div
                    class="absolute inset-0"
                    :class="getQualityOverlayClass(entry.quality)"
                  ></div>
                  <NuxtImg
                    :src="entry.image"
                    :alt="entry.name"
                    class="absolute inset-0 z-10 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                    preset="tallLg"
                    fit="cover"
                    loading="lazy"
                    sizes="200px"
                  />
                  <div class="absolute top-2 right-2 z-20">
                    <n-tag
                      round
                      size="small"
                      :bordered="false"
                      :color="getQualityTagTheme(entry.quality)"
                      class="backdrop-blur-xs"
                    >
                      <span class="flex items-center gap-1">
                        {{ entry.quality }}
                        <n-icon>
                          <Star />
                        </n-icon>
                      </span>
                    </n-tag>
                  </div>
                  <div
                    class="absolute right-0 bottom-0 left-0 z-20 bg-linear-to-t from-black/90 to-transparent p-3"
                  >
                    <p
                      class="line-clamp-2 text-xs font-semibold text-white sm:text-sm"
                    >
                      {{ entry.name }}
                    </p>
                    <div class="mt-1">
                      <n-tag
                        size="tiny"
                        :bordered="false"
                        type="warning"
                        class="bg-black/50 text-gray-200 backdrop-blur-xs"
                      >
                        {{ t('common.momo_entry') }}
                      </n-tag>
                    </div>
                  </div>
                </div>
              </NuxtLinkLocale>
            </div>
            <div
              v-else-if="loading"
              key="loading"
              class="grid grid-cols-3 gap-2 sm:grid-cols-6 sm:content-start sm:gap-3"
            >
              <div
                v-for="(i, index) in pageSize"
                :key="`skeleton-${i}`"
                class="relative aspect-3/4 animate-pulse overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700"
                :style="{
                  animationDelay: `${Math.min(index + 1, 9) * 0.05}s`,
                }"
              ></div>
            </div>
          </n-collapse-transition>

          <div class="flex items-center justify-center sm:pr-2">
            <n-pagination
              v-model:page="currentPage"
              :page-size="pageSize"
              :item-count="totalItems"
              :show-size-picker="false"
              :disabled="loading || !!error"
              :page-slot="5"
            >
              <template #prefix="{ itemCount }">
                <div
                  class="inline-flex items-baseline gap-1 text-sm text-gray-600 dark:text-gray-400"
                >
                  <span class="font-semibold text-gray-900 dark:text-white">
                    {{ totalItems }}
                  </span>
                  <span>
                    {{
                      itemCount === 1
                        ? t('common.momo_entry')
                        : t('common.momo')
                    }}
                  </span>
                </div>
              </template>
            </n-pagination>
          </div>
        </div>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
  import { Star, Tshirt, ListAlt, PaintBrush } from '@vicons/fa'
  import { NIcon } from 'naive-ui'
  import type { SelectOption } from 'naive-ui'
  import { h, type Component } from 'vue'

  const { t } = useI18n()
  const localePath = useLocalePath()
  const route = useRoute()
  const router = useRouter()
  const { getImageSrc } = imageProvider()
  const { fetchMomoPaginated } = useMomo()

  const routeSeoFilter = computed(() =>
    getSeoListRouteFilter(route.path, 'momo')
  )
  const routeSourceFilter = computed(() =>
    routeSeoFilter.value?.kind === 'source'
      ? String(routeSeoFilter.value.value)
      : null
  )

  const pageSize = 18
  const qualityOptions = [5, 4, 3] as const
  type CompendiumSection = 'outfits' | 'items' | 'momo' | 'makeups'
  type IconSelectOption = SelectOption & { icon: Component }

  const parsePage = (value: unknown) => {
    const rawValue = Array.isArray(value) ? value[0] : value
    const page = Number(rawValue)
    return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1
  }

  const parseQuality = (value: unknown) => {
    const rawValue = Array.isArray(value) ? value[0] : value
    const quality = Number(rawValue)
    return qualityOptions.includes(quality as (typeof qualityOptions)[number])
      ? quality
      : null
  }

  const obtainOptions = computed(() => {
    return MOMO_SOURCE_GROUPS.map((group) => {
      const translated = t(group.labelKey)
      const fallback = `Source ${group.ids[0]}`
      const label = translated !== group.labelKey ? translated : fallback
      return {
        label,
        value: group.key,
        sortKey: group.ids[0] ?? 0,
      }
    })
      .sort((a, b) => {
        if (a.sortKey !== b.sortKey) return a.sortKey - b.sortKey
        return a.label.localeCompare(b.label)
      })
      .map(({ label, value }) => ({ label, value }))
  })
  const availableObtainValues = computed(() =>
    obtainOptions.value.map((option) => option.value as string)
  )

  const resolveObtain = (value?: string | null) => {
    if (!value || value === 'all') return null
    if (availableObtainValues.value.includes(value)) return value
    const ids = resolveMomoSourceIdsFromValue(value)
    if (!ids) return null
    const groupKey = resolveMomoSourceGroupKeyFromIds(ids)
    if (!groupKey) return null
    return availableObtainValues.value.includes(groupKey) ? groupKey : null
  }

  const currentPage = ref(parsePage(route.query.page))
  const qualityFilter = ref<number | null>(parseQuality(route.query.quality))
  const obtainFilter = ref<string | null>(
    routeSourceFilter.value ??
      resolveObtain(
        (route.query.source ?? route.query.obtain)?.toString() ?? null
      )
  )

  const pageTitle = computed(
    () =>
      `${t('common.momo')} - ${t('meta.game_title')} - ${t('navigation.title')}`
  )

  useSeoMeta({
    title: () => pageTitle.value,
    description: () => t('meta.description.momo'),
    ogTitle: () => pageTitle.value,
    ogDescription: () => t('meta.description.momo'),
    twitterTitle: () => pageTitle.value,
    twitterDescription: () => t('meta.description.momo'),
  })

  const hasFilters = computed(
    () => qualityFilter.value !== null || obtainFilter.value !== null
  )

  const cacheKey = computed(
    () =>
      `momo-${qualityFilter.value ?? 'all'}-${
        obtainFilter.value ?? 'all'
      }-${currentPage.value}-${pageSize}`
  )

  const {
    data,
    pending: loading,
    error,
    refresh: loadData,
  } = await useAsyncData(
    () => cacheKey.value,
    () =>
      fetchMomoPaginated({
        quality: qualityFilter.value,
        source: obtainFilter.value,
        page: currentPage.value,
        pageSize,
      }),
    {
      default: () => ({ data: [], total: 0, page: 1, totalPages: 0 }),
      lazy: true,
    }
  )

  const entries = computed(() => {
    const rows = (data.value?.data || []) as MomoListEntry[]
    return rows.map((entry) => ({
      id: entry.id,
      quality: entry.quality,
      name: t(`momo.${entry.id}.name`),
      image: getImageSrc('momo', entry.id),
    }))
  })

  const totalItems = computed(() => data.value?.total || 0)
  const compendiumSection = 'momo' as const
  const compendiumSectionOptions = computed<IconSelectOption[]>(() => [
    { label: t('common.outfits'), value: 'outfits', icon: Tshirt },
    { label: t('common.items'), value: 'items', icon: ListAlt },
    { label: t('common.momo'), value: 'momo', icon: Star },
    { label: t('common.makeups'), value: 'makeups', icon: PaintBrush },
  ])
  const renderCompendiumSectionOptionLabel = (option: SelectOption) => {
    const { icon } = option as IconSelectOption
    return h('div', { class: 'flex items-center gap-2' }, [
      h(NIcon, { size: 16 }, { default: () => h(icon) }),
      h('span', null, String(option.label ?? '')),
    ])
  }
  const buildListingQuery = ({
    includePage = true,
    primaryFilter = null,
  }: {
    includePage?: boolean
    primaryFilter?: 'source' | null
  } = {}) => ({
    ...(qualityFilter.value !== null && { quality: qualityFilter.value }),
    ...(primaryFilter !== 'source' &&
      obtainFilter.value && { source: obtainFilter.value }),
    ...(includePage && currentPage.value > 1 && { page: currentPage.value }),
  })

  const buildListingLocation = () => {
    const sourceSlug = resolveSeoMomoSourceSlug(obtainFilter.value)
    if (sourceSlug) {
      return {
        path: `/momo/source/${sourceSlug}`,
        primaryFilter: 'source' as const,
      }
    }

    return {
      path: '/momo',
      primaryFilter: null,
    }
  }

  const handleCompendiumSectionChange = (value: string) => {
    const nextSection = value as CompendiumSection
    if (nextSection === 'momo') return

    navigateTo(
      localePath({
        path: `/${nextSection}`,
        query: buildListingQuery({ includePage: false }),
      })
    )
  }

  const syncListingRoute = () => {
    const listingLocation = buildListingLocation()
    router.replace({
      path: localePath(listingLocation.path),
      query: buildListingQuery({
        primaryFilter: listingLocation.primaryFilter,
      }),
    })
  }

  watch(qualityFilter, () => {
    currentPage.value = 1
  })
  watch(obtainFilter, () => {
    currentPage.value = 1
  })
  watch([qualityFilter, obtainFilter, currentPage], () => {
    syncListingRoute()
  })

  onMounted(() => {
    syncListingRoute()
  })

  const clearFilters = () => {
    qualityFilter.value = null
    obtainFilter.value = null
    currentPage.value = 1
  }

  const retryFetch = () => {
    loadData()
  }

  const getQualityOverlayClass = (quality: number) => {
    switch (quality) {
      case 5:
        return 'bg-yellow-500/5'
      case 4:
        return 'bg-blue-500/5'
      case 3:
        return 'bg-green-500/5'
      default:
        return 'bg-gray-500/5'
    }
  }
</script>
