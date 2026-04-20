<template>
  <div class="max-w-7xl mx-auto space-y-2 sm:space-y-4">
    <!-- Filter Card -->
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
            <n-button-group class="self-start">
              <n-tooltip trigger="hover">
                <template #trigger>
                  <n-button
                    size="small"
                    class="w-12 px-0"
                    :aria-label="$t('common.outfits')"
                    @click="
                      navigateTo(
                        localePath({
                          path: '/outfits',
                          query: buildListingQuery({
                            includeType: false,
                            includeScopedFilters: false,
                          }),
                        })
                      )
                    "
                  >
                    <template #icon>
                      <n-icon>
                        <Tshirt />
                      </n-icon>
                    </template>
                  </n-button>
                </template>
                {{ $t('common.outfits') }}
              </n-tooltip>
              <n-tooltip trigger="hover">
                <template #trigger>
                  <n-button
                    size="small"
                    type="primary"
                    class="w-12 px-0"
                    :aria-label="$t('common.items')"
                  >
                    <template #icon>
                      <n-icon>
                        <ListAlt />
                      </n-icon>
                    </template>
                  </n-button>
                </template>
                {{ $t('common.items') }}
              </n-tooltip>
            </n-button-group>

            <div class="hidden min-w-0 overflow-x-auto sm:block">
              <n-button-group class="min-w-max">
                <n-button
                  size="small"
                  :type="qualityFilter === null ? 'primary' : 'default'"
                  class="min-w-[40px]"
                  @click="qualityFilter = null"
                >
                  {{ t('common.all') }}
                </n-button>
                <n-button
                  v-for="q in [5, 4, 3, 2]"
                  :key="q"
                  size="small"
                  v-bind="getQualityButtonTheme(q, qualityFilter === q)"
                  :class="['min-w-[40px]']"
                  @click="qualityFilter = q"
                >
                  <span class="flex items-center gap-1">
                    {{ q }}
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

          <n-tooltip
            :disabled="totalItems <= TIER_ENTRY_LIMIT"
            trigger="hover"
          >
            <template #trigger>
              <div class="shrink-0 self-start">
                <n-button
                  size="small"
                  type="primary"
                  :disabled="isTierlistDisabled"
                  @click="goToTierlist"
                >
                  <template #icon>
                    <n-icon><SortAmountDown /></n-icon>
                  </template>
                  {{ t('navigation.tierlist') }}
                </n-button>
              </div>
            </template>
            {{
              t('tierlist.over_limit.description', {
                max: TIER_ENTRY_LIMIT,
              })
            }}
          </n-tooltip>
        </div>

        <div class="flex items-start gap-2 sm:hidden">
          <div class="min-w-0 flex-1 overflow-x-auto pb-1">
            <n-button-group class="min-w-max">
              <n-button
                size="small"
                :type="qualityFilter === null ? 'primary' : 'default'"
                class="min-w-[40px]"
                @click="qualityFilter = null"
              >
                {{ t('common.all') }}
              </n-button>
              <n-button
                v-for="q in [5, 4, 3, 2]"
                :key="q"
                size="small"
                v-bind="getQualityButtonTheme(q, qualityFilter === q)"
                :class="['min-w-[40px]']"
                @click="qualityFilter = q"
              >
                <span class="flex items-center gap-1">
                  {{ q }}
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

        <div class="grid grid-cols-2 gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <n-select
            v-model:value="versionFilter"
            :options="versionOptions"
            :render-label="renderVersionOptionLabel"
            size="small"
            class="min-w-0"
            clearable
            filterable
            :show-checkmark="false"
            :placeholder="t('compendium.filter_version')"
          />

          <n-select
            v-model:value="styleFilter"
            :options="styleOptions"
            size="small"
            class="min-w-0"
            clearable
            :show-checkmark="false"
            :placeholder="t('compendium.filter_style')"
          />

          <n-select
            v-model:value="labelFilter"
            :options="labelOptions"
            size="small"
            class="min-w-0"
            clearable
            filterable
            :show-checkmark="false"
            :placeholder="t('compendium.filter_label')"
          />

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

        <div class="grid grid-cols-2 gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <n-select
            v-model:value="typeFilter"
            :options="typeOptions"
            size="small"
            class="min-w-0"
            clearable
            filterable
            :show-checkmark="false"
            :placeholder="t('compendium.filter_slot')"
          />

          <n-select
            v-model:value="categoryFilter"
            :options="categoryOptions"
            size="small"
            class="min-w-0"
            clearable
            filterable
            :disabled="!isCategoryFilterEnabled"
            :show-checkmark="false"
            :placeholder="t('compendium.filter_category')"
          />

          <n-select
            v-model:value="subcategoryFilter"
            :options="subcategoryOptions"
            size="small"
            class="min-w-0"
            clearable
            filterable
            :disabled="!isSubcategoryFilterEnabled"
            :show-checkmark="false"
            :placeholder="t('compendium.filter_subcategory')"
          />

          <n-button-group class="w-full">
            <n-button
              size="small"
              class="min-w-0 flex-1 justify-between"
              :disabled="!isAdvancedFiltersEnabled"
              data-advanced-filters-trigger
              @click="toggleAdvancedFiltersDrawer"
            >
              <span>{{ t('compendium.advanced_filters') }}</span>
              <span
                v-if="activeAdvancedFilterCount > 0"
                class="ml-1"
              >
                ({{ activeAdvancedFilterCount }})
              </span>
            </n-button>

            <n-tooltip
              v-if="activeAdvancedFilterCount > 0"
              trigger="hover"
            >
              <template #trigger>
                <n-button
                  size="small"
                  :disabled="!isAdvancedFiltersEnabled"
                  :aria-label="t('common.clear')"
                  @click="clearAdvancedFilters"
                >
                  <template #icon>
                    <n-icon>
                      <Times />
                    </n-icon>
                  </template>
                </n-button>
              </template>
              {{ t('common.clear') }}
            </n-tooltip>
          </n-button-group>
        </div>
      </div>
    </n-card>

    <!-- Grid Card -->
    <n-card
      size="small"
      class="rounded-xl p-0 sm:p-2 sm:flex-1 sm:flex sm:flex-col"
      content-class="p-2 sm:p-4 sm:flex-1 sm:flex sm:flex-col"
    >
      <div class="sm:flex-1 sm:flex sm:flex-col min-h-0">
        <div class="space-y-3 sm:space-y-4">
          <div
            v-if="error"
            class="text-center py-12"
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
                  {{ $t('common.retry') }}
                </n-button>
              </template>
            </n-result>
          </div>

          <div
            v-else-if="!loading && entries.length === 0"
            class="text-center py-12"
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
                  class="mx-auto w-24 h-24 sm:w-32 sm:h-32 object-cover"
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
              class="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3 sm:content-start"
            >
              <div
                v-for="(entry, index) in entries"
                :key="entry.id"
                class="cursor-pointer animate-fade-in-up motion-reduce:animate-none"
                :style="{
                  animationDelay: `${Math.min(index + 1, 12) * 0.05}s`,
                }"
                @click="navigateToDetail(entry.id)"
              >
                <div
                  class="relative aspect-2/3 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300"
                  style="
                    background-image: url('/images/bg.webp');
                    background-size: cover;
                    background-position: center;
                  "
                >
                  <!-- Tint overlay -->
                  <div
                    class="absolute inset-0"
                    :class="getQualityOverlayClass(entry.quality)"
                  ></div>
                  <NuxtImg
                    :src="entry.image"
                    :alt="entry.name"
                    class="absolute inset-0 w-full h-full object-cover z-10 transition-transform duration-500 ease-out hover:scale-110"
                    preset="tallLg"
                    fit="cover"
                    loading="lazy"
                    sizes="200px"
                  />

                  <div class="absolute top-2 left-2 z-20">
                    <n-tag
                      v-if="entry.type"
                      round
                      size="small"
                      :bordered="false"
                      type="warning"
                      class="backdrop-blur-xs bg-black/50 text-gray-200"
                    >
                      {{ entry.type }}
                    </n-tag>
                  </div>
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
                    class="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/90 to-transparent p-3 z-20"
                  >
                    <p
                      class="text-white font-semibold text-xs sm:text-sm line-clamp-2"
                    >
                      {{ entry.name }}
                    </p>
                    <div class="flex flex-wrap gap-1 mt-1">
                      <n-tag
                        v-if="entry.styleLabel"
                        size="tiny"
                        :bordered="false"
                        type="default"
                        :color="getStyleTagTheme(entry.styleKey)"
                        class="text-xs font-semibold shadow-[inset_0_-2px_0_rgba(0,0,0,0.18)]"
                      >
                        {{ entry.styleLabel }}
                      </n-tag>
                    </div>
                    <div class="flex flex-wrap gap-0.5 mt-1">
                      <n-tag
                        v-for="label in entry.labelTags"
                        :key="label.text"
                        size="tiny"
                        type="default"
                        :color="label.theme"
                        round
                        class="text-xs font-semibold"
                      >
                        {{ label.text }}
                      </n-tag>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div
              v-else-if="loading"
              key="loading"
              class="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3 sm:content-start"
            >
              <div
                v-for="(i, index) in pageSize"
                :key="`skeleton-${i}`"
                class="relative aspect-3/4 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 animate-pulse"
                :style="{
                  animationDelay: `${Math.min(index + 1, 9) * 0.05}s`,
                }"
              ></div>
            </div>
          </n-collapse-transition>

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
                <div
                  class="inline-flex items-baseline gap-1 text-sm text-gray-600 dark:text-gray-400"
                >
                  <span class="font-semibold text-gray-900 dark:text-white">{{
                    totalItems
                  }}</span>
                  <span>
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
      </div>
    </n-card>

    <AdvancedFiltersDrawer
      :show="isAdvancedFiltersDrawerOpen"
      :fields="advancedFilterFields"
      :filters="advancedFilters"
      :options="advancedFacetOptions"
      ignore-close-selector="[data-advanced-filters-trigger]"
      @update:show="isAdvancedFiltersDrawerOpen = $event"
      @update:filters="updateAdvancedFilters"
    />
  </div>
</template>

<script setup lang="ts">
  import { Star, Tshirt, ListAlt, SortAmountDown, Times } from '@vicons/fa'
  import type { SelectGroupOption, SelectOption } from 'naive-ui'

  const { t, locale, getLocaleMessage } = useI18n()
  const { translateFilterToken } = useFilterToken()
  const localePath = useLocalePath()
  const route = useRoute()
  const router = useRouter()
  const { getImageSrc } = imageProvider()

  const routeListSlug = computed(() => getSeoListRouteSlug(route.path, 'items'))
  const routeItemType = computed(() =>
    resolveSeoItemTypeFromSlug(routeListSlug.value)
  )
  const routeSeoFilter = computed(() =>
    getSeoListRouteFilter(route.path, 'items')
  )
  const routeQualityFilter = computed(() =>
    routeSeoFilter.value?.kind === 'quality'
      ? Number(routeSeoFilter.value.value)
      : null
  )
  const routeVersionFilter = computed(() =>
    routeSeoFilter.value?.kind === 'version'
      ? String(routeSeoFilter.value.value)
      : null
  )
  const routeStyleFilter = computed(() =>
    routeSeoFilter.value?.kind === 'style'
      ? String(routeSeoFilter.value.value)
      : null
  )
  const routeLabelFilter = computed(() =>
    routeSeoFilter.value?.kind === 'tag'
      ? String(routeSeoFilter.value.value)
      : null
  )
  const routeSourceFilter = computed(() =>
    routeSeoFilter.value?.kind === 'source'
      ? String(routeSeoFilter.value.value)
      : null
  )

  const pageSize = 18
  const availableItemTypes = getAllItemTypes()
  type ItemListingPrimaryFilter =
    | 'type'
    | 'quality'
    | 'version'
    | 'style'
    | 'label'
    | 'source'
    | null
  type BuildListingQueryOptions = {
    includeType?: boolean
    includeScopedFilters?: boolean
    primaryFilter?: ItemListingPrimaryFilter
  }

  const resolveType = (value?: string | null) => {
    if (!value) return null
    if (value === 'all') return null
    if ((availableItemTypes as string[]).includes(value)) return value
    const seoType = resolveSeoItemTypeFromSlug(value)
    if (seoType && (availableItemTypes as string[]).includes(seoType)) {
      return seoType
    }
    return null
  }

  const messages = computed(
    () => getLocaleMessage(locale.value) as Record<string, string>
  )
  const availableVersions = computed(() =>
    getExactVersionsFromLocaleMessages(messages.value)
  )
  const availableVersionFilters = computed(() =>
    getVersionFilters(availableVersions.value)
  )
  const availableObtains = computed(() =>
    Object.keys(messages.value)
      .filter((key) => key.startsWith('obtain.') && key.endsWith('.name'))
      .map((key) => {
        const parts = key.split('.')
        return Number(parts[1])
      })
      .filter((value) => !Number.isNaN(value))
  )

  const obtainOptions = computed(() => {
    const groupMap = new Map<string, { labelKey: string; ids: number[] }>()

    availableObtains.value.forEach((id) => {
      const groupKey = resolveObtainGroupKey(id)
      if (!groupKey) {
        return
      }
      const group = groupMap.get(groupKey)
      if (group) {
        group.ids.push(id)
      } else {
        const labelKey = resolveObtainGroupLabelKey(groupKey)
        if (!labelKey) {
          return
        }
        groupMap.set(groupKey, {
          labelKey,
          ids: [id],
        })
      }
    })

    return Array.from(groupMap.entries())
      .map(([groupKey, group]) => {
        const translated = t(group.labelKey)
        const fallback = group.labelKey.startsWith('obtain.')
          ? `Obtain ${group.ids[0]}`
          : group.labelKey
        const label = translated !== group.labelKey ? translated : fallback
        const enriched = group.ids.map((id) => ({
          id,
          version: getVersionFromId(id),
        }))
        const sortKey = getOldestVersion(
          enriched
            .map((entry) => entry.version)
            .filter((value): value is string => !!value)
        )
        return {
          label,
          value: groupKey,
          sortKey: sortKey ?? '',
        }
      })
      .sort((a, b) => {
        const versionComparison = compareOptionalVersionsAsc(
          a.sortKey,
          b.sortKey
        )
        if (versionComparison !== 0) return versionComparison
        return a.label.localeCompare(b.label)
      })
      .map(({ label, value }) => ({ label, value }))
  })

  const availableObtainValues = computed(() =>
    obtainOptions.value.map((option) => option.value as string)
  )

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

  const resolveVersion = (value?: string | null) =>
    resolveVersionFilter(value, availableVersionFilters.value)

  const resolveObtain = (value?: string | null) => {
    if (!value) return null
    if (value === 'all') return null
    if (availableObtainValues.value.includes(value)) return value
    const ids = resolveObtainIdsFromValue(value)
    if (!ids) return null
    const groupKey = resolveObtainGroupKeyFromIds(ids)
    if (!groupKey) return null
    return availableObtainValues.value.includes(groupKey) ? groupKey : null
  }

  const resolveQuality = (value?: string | number | null) => {
    if (value === null || value === undefined || value === '') return null
    const parsed =
      typeof value === 'number' && Number.isFinite(value)
        ? value
        : Number(value)
    return resolveSeoItemQualitySlug(parsed) !== null ? parsed : null
  }
  const resolveRouteQualityFilter = () =>
    routeQualityFilter.value ??
    resolveQuality(route.query.quality?.toString() ?? null)
  const qualityFilter = ref<number | null>(resolveRouteQualityFilter())
  const resolveRouteTypeFilter = () =>
    routeItemType.value ?? resolveType(route.query.type?.toString() ?? null)
  const resolveRouteVersionFilter = () =>
    resolveVersion(routeVersionFilter.value ?? route.query.version?.toString())
  const resolveRouteStyleFilter = () =>
    resolveStyle(routeStyleFilter.value ?? route.query.style?.toString())
  const resolveRouteLabelFilter = () =>
    resolveLabel(routeLabelFilter.value ?? route.query.label?.toString())
  const resolveRouteSourceFilter = () =>
    routeSourceFilter.value ??
    resolveObtain(
      (route.query.source ?? route.query.obtain)?.toString() ?? null
    )
  const initialTypeFilter = resolveRouteTypeFilter()
  const typeFilter = ref<string | null>(initialTypeFilter)

  const categoryFilter = ref<string | null>(
    initialTypeFilter
      ? normalizeItemSearchTokenKey(route.query.category?.toString() ?? null) ||
          null
      : null
  )
  const subcategoryFilter = ref<string | null>(
    initialTypeFilter
      ? normalizeItemSearchTokenKey(
          route.query.subcategory?.toString() ?? null
        ) || null
      : null
  )
  const versionFilter = ref<string | null>(resolveRouteVersionFilter())
  const styleFilter = ref<string | null>(resolveRouteStyleFilter())
  const labelFilter = ref<string | null>(resolveRouteLabelFilter())
  const obtainFilter = ref<string | null>(resolveRouteSourceFilter())

  const activeTypeLabel = computed(() =>
    typeFilter.value ? t(`type.${typeFilter.value}`) : null
  )
  const getVersionFilterLabel = (version?: string | null) => {
    if (!version) return null
    const key = `version.${version}`
    const translated = t(key)
    return translated !== key ? `${version} - ${translated}` : version
  }
  const getQualityFilterLabel = (quality?: number | null) =>
    quality ? `${quality}★` : null
  const getSourceFilterLabel = (source?: string | null) => {
    if (!source) return null
    const labelKey = resolveObtainGroupLabelKey(source)
    if (!labelKey) return source
    const translated = t(labelKey)
    if (translated !== labelKey) return translated
    return labelKey.startsWith('obtain.') ? source : labelKey
  }
  const getStyleFilterLabel = (style?: string | null) => {
    if (!style) return null
    const definition = STYLE_BY_KEY.get(style)
    return definition ? t(definition.i18nKey) : null
  }
  const getTagFilterLabel = (tag?: string | null) => {
    if (!tag) return null
    const definition = TAG_BY_KEY.get(tag)
    return definition ? t(definition.i18nKey) : null
  }
  const activeListFilterLabel = computed(
    () =>
      activeTypeLabel.value ??
      getQualityFilterLabel(qualityFilter.value) ??
      getVersionFilterLabel(versionFilter.value) ??
      getStyleFilterLabel(styleFilter.value) ??
      getTagFilterLabel(labelFilter.value) ??
      getSourceFilterLabel(obtainFilter.value)
  )
  const pageTitle = computed(() => {
    const title = activeListFilterLabel.value
      ? `${t('navigation.item')} - ${activeListFilterLabel.value}`
      : t('navigation.item')
    return `${title} - ${t('meta.game_title')} - ${t('navigation.title')}`
  })
  const description = computed(() => {
    const baseDescription = t('meta.description.items')
    return activeListFilterLabel.value
      ? `${activeListFilterLabel.value} - ${baseDescription}`
      : baseDescription
  })

  useSeoMeta({
    title: () => pageTitle.value,
    description: () => description.value,
    ogTitle: () => pageTitle.value,
    ogDescription: () => description.value,
    twitterTitle: () => pageTitle.value,
    twitterDescription: () => description.value,
  })
  const advancedFilters = ref<ItemSearchAdvancedFilters>(
    normalizeItemSearchCompendiumAdvancedFilters(
      resolveItemSearchAdvancedFilters(
        route.query as Record<string, unknown>,
        typeFilter.value
      ),
      typeFilter.value
    )
  )
  const isAdvancedFiltersDrawerOpen = ref(false)
  const currentPage = ref(Number(route.query.page) || 1)

  const advancedFilterFields = computed(() =>
    getItemSearchCompendiumAdvancedFields(typeFilter.value)
  )
  const activeAdvancedFilters = computed(() =>
    getActiveItemSearchAdvancedFilters(advancedFilters.value, typeFilter.value)
  )
  const activeAdvancedFiltersKey = computed(() =>
    serializeItemSearchAdvancedFilters(advancedFilters.value, typeFilter.value)
  )
  const activeAdvancedFilterCount = computed(
    () =>
      advancedFilterFields.value.filter((field) =>
        hasActiveItemSearchAdvancedFilterValue(
          activeAdvancedFilters.value[field] ?? null
        )
      ).length
  )
  const showTypeFilter = computed(() => true)
  const supportsCategoryFilters = computed(() => !!typeFilter.value)
  const isCategoryFilterEnabled = computed(
    () =>
      showTypeFilter.value &&
      supportsCategoryFilters.value &&
      categoryOptions.value.length > 0
  )
  const isSubcategoryFilterEnabled = computed(
    () =>
      supportsCategoryFilters.value &&
      !!categoryFilter.value &&
      subcategoryOptions.value.length > 0
  )
  const isAdvancedFiltersEnabled = computed(
    () => advancedFilterFields.value.length > 0
  )
  const hasActiveAdvancedFilters = computed(
    () => activeAdvancedFilterCount.value > 0
  )
  const shouldFetchFacets = computed(
    () =>
      Boolean(typeFilter.value) &&
      (!!typeFilter.value || isAdvancedFiltersEnabled.value)
  )
  const hasFilters = computed(
    () =>
      qualityFilter.value !== null ||
      (showTypeFilter.value && typeFilter.value !== null) ||
      categoryFilter.value !== null ||
      subcategoryFilter.value !== null ||
      versionFilter.value !== null ||
      styleFilter.value !== null ||
      labelFilter.value !== null ||
      obtainFilter.value !== null ||
      activeAdvancedFilterCount.value > 0
  )

  const { fetchItemsPaginated, fetchItemSearchFacets } = useSupabaseItems()

  const facetCacheKey = computed(() =>
    shouldFetchFacets.value
      ? `item-facets-${qualityFilter.value ?? 'all'}-${typeFilter.value ?? 'all'}-${
          categoryFilter.value ?? 'all'
        }-${subcategoryFilter.value ?? 'all'}-${activeAdvancedFiltersKey.value || 'none'}-${
          styleFilter.value ?? 'all'
        }-${labelFilter.value ?? 'all'}-${
          versionFilter.value ?? 'all'
        }-${obtainFilter.value ?? 'all'}`
      : 'item-facets-disabled'
  )

  const cacheKey = computed(
    () =>
      `items-${qualityFilter.value ?? 'all'}-${typeFilter.value ?? 'all'}-${
        categoryFilter.value ?? 'all'
      }-${subcategoryFilter.value ?? 'all'}-${
        activeAdvancedFiltersKey.value || 'none'
      }-${
        styleFilter.value ?? 'all'
      }-${labelFilter.value ?? 'all'}-${versionFilter.value ?? 'all'}-${
        obtainFilter.value ?? 'all'
      }-${currentPage.value}-${pageSize}`
  )

  const [facetsAsyncData, itemsAsyncData] = await Promise.all([
    useAsyncData(
      () => facetCacheKey.value,
      async () => {
        if (!shouldFetchFacets.value) {
          return {
            categories: [],
            subcategories: [],
            advanced: {},
          }
        }

        return fetchItemSearchFacets({
          quality: qualityFilter.value,
          type: typeFilter.value,
          category: supportsCategoryFilters.value ? categoryFilter.value : null,
          subcategory: supportsCategoryFilters.value
            ? subcategoryFilter.value
            : null,
          version: versionFilter.value,
          style: styleFilter.value,
          label: labelFilter.value,
          source: obtainFilter.value,
          ...activeAdvancedFilters.value,
        })
      },
      {
        default: () => ({
          categories: [],
          subcategories: [],
          advanced: {},
        }),
        lazy: true,
      }
    ),
    useAsyncData(
      () => cacheKey.value,
      async () => {
        return fetchItemsPaginated({
          quality: qualityFilter.value,
          type: typeFilter.value,
          category: supportsCategoryFilters.value ? categoryFilter.value : null,
          subcategory: supportsCategoryFilters.value
            ? subcategoryFilter.value
            : null,
          version: versionFilter.value,
          style: styleFilter.value,
          label: labelFilter.value,
          source: obtainFilter.value,
          ...activeAdvancedFilters.value,
          page: currentPage.value,
        })
      },
      {
        default: () => ({ data: [], total: 0, totalPages: 0 }),
        lazy: true,
      }
    ),
  ])

  const { data: itemSearchFacets, status: facetsStatus } = facetsAsyncData
  const {
    data: compendiumData,
    pending: loading,
    error,
    refresh: loadData,
  } = itemsAsyncData

  const entries = computed(() => {
    const data = (compendiumData.value?.data || []) as ItemListEntry[]

    return data.map((entry) => ({
      id: entry.id,
      quality: entry.quality,
      name: t(`item.${entry.id}.name`),
      image: getImageSrc('item', entry.id),
      type: entry.type ? t(`type.${entry.type}`) : null,
      styleLabel: entry.style ? t(entry.style) : null,
      styleKey: entry.style ? resolveStyleKeyFromI18nKey(entry.style) : null,
      labelTags: (entry.labels || []).map((label: string) => ({
        text: t(label),
        theme: getLabelTagTheme(label),
      })),
    }))
  })

  const totalItems = computed(() => compendiumData.value?.total || 0)

  const countLabels = computed(() => ({
    singular: t('common.item'),
    plural: t('common.items'),
  }))
  const TIER_ENTRY_LIMIT = 200
  const isTierlistDisabled = computed(
    () => loading.value || !!error.value || totalItems.value > TIER_ENTRY_LIMIT
  )

  const buildAdvancedFilterQuery = () =>
    buildItemSearchAdvancedFilterQuery(
      advancedFilters.value,
      typeFilter.value,
      advancedFilterFields.value
    )

  const currentListingPath = computed(() => {
    const typeSlug = resolveSeoItemTypeSlug(typeFilter.value)
    if (typeSlug) {
      return {
        path: `/items/${typeSlug}`,
        primaryFilter: 'type' as ItemListingPrimaryFilter,
      }
    }

    const qualitySlug = resolveSeoItemQualitySlug(qualityFilter.value)
    if (qualitySlug) {
      return {
        path: `/items/quality/${qualitySlug}`,
        primaryFilter: 'quality' as ItemListingPrimaryFilter,
      }
    }

    const versionSlug = resolveSeoVersionSlug(versionFilter.value)
    if (versionSlug) {
      return {
        path: `/items/version/${versionSlug}`,
        primaryFilter: 'version' as ItemListingPrimaryFilter,
      }
    }

    const styleSlug = resolveSeoStyleSlug(styleFilter.value)
    if (styleSlug) {
      return {
        path: `/items/style/${styleSlug}`,
        primaryFilter: 'style' as ItemListingPrimaryFilter,
      }
    }

    const labelSlug = resolveSeoTagSlug(labelFilter.value)
    if (labelSlug) {
      return {
        path: `/items/tag/${labelSlug}`,
        primaryFilter: 'label' as ItemListingPrimaryFilter,
      }
    }

    const sourceSlug = resolveSeoItemSourceSlug(obtainFilter.value)
    if (sourceSlug) {
      return {
        path: `/items/source/${sourceSlug}`,
        primaryFilter: 'source' as ItemListingPrimaryFilter,
      }
    }

    return {
      path: '/items',
      primaryFilter: null,
    }
  })

  const buildListingQuery = ({
    includeType = true,
    includeScopedFilters = includeType,
    primaryFilter = null,
  }: BuildListingQueryOptions = {}) => ({
    ...(primaryFilter !== 'quality' &&
      qualityFilter.value && { quality: qualityFilter.value }),
    ...(primaryFilter !== 'type' &&
      includeType &&
      showTypeFilter.value &&
      typeFilter.value && {
        type: typeFilter.value,
      }),
    ...(includeScopedFilters &&
      supportsCategoryFilters.value &&
      categoryFilter.value && {
        category: categoryFilter.value,
      }),
    ...(includeScopedFilters &&
      supportsCategoryFilters.value &&
      categoryFilter.value &&
      subcategoryFilter.value && {
        subcategory: subcategoryFilter.value,
      }),
    ...(primaryFilter !== 'version' &&
      versionFilter.value && { version: versionFilter.value }),
    ...(primaryFilter !== 'style' &&
      styleFilter.value && { style: styleFilter.value }),
    ...(primaryFilter !== 'label' &&
      labelFilter.value && { label: labelFilter.value }),
    ...(primaryFilter !== 'source' &&
      obtainFilter.value && { source: obtainFilter.value }),
    ...(includeScopedFilters && buildAdvancedFilterQuery()),
    ...(currentPage.value > 1 && { page: currentPage.value }),
  })

  const buildTierlistQuery = () => ({
    mode: 'items',
    ...(qualityFilter.value !== null && { quality: qualityFilter.value }),
    ...(showTypeFilter.value &&
      typeFilter.value && {
        type: typeFilter.value,
      }),
    ...(supportsCategoryFilters.value &&
      categoryFilter.value && {
        category: categoryFilter.value,
      }),
    ...(supportsCategoryFilters.value &&
      categoryFilter.value &&
      subcategoryFilter.value && {
        subcategory: subcategoryFilter.value,
      }),
    ...(versionFilter.value && { version: versionFilter.value }),
    ...(styleFilter.value && { style: styleFilter.value }),
    ...(labelFilter.value && { label: labelFilter.value }),
    ...(obtainFilter.value && { source: obtainFilter.value }),
    ...buildAdvancedFilterQuery(),
  })

  const goToTierlist = () => {
    if (isTierlistDisabled.value) return

    navigateTo(
      localePath({
        path: '/tierlist',
        query: buildTierlistQuery(),
      })
    )
  }

  const syncListingRoute = () => {
    const listingPath = currentListingPath.value
    router.replace({
      path: localePath(listingPath.path),
      query: buildListingQuery({
        includeType: false,
        includeScopedFilters: true,
        primaryFilter: listingPath.primaryFilter,
      }),
    })
  }

  watch(qualityFilter, () => {
    currentPage.value = 1
  })

  watch(typeFilter, () => {
    currentPage.value = 1
    categoryFilter.value = null
    subcategoryFilter.value = null
    advancedFilters.value = createEmptyItemSearchAdvancedFilters()
    isAdvancedFiltersDrawerOpen.value = false
  })

  watch([routeItemType, () => route.query.type], () => {
    const nextType = resolveRouteTypeFilter()
    if (nextType !== typeFilter.value) {
      typeFilter.value = nextType
    }
  })

  watch([routeQualityFilter, () => route.query.quality], () => {
    const nextQuality = resolveRouteQualityFilter()
    if (nextQuality !== qualityFilter.value) {
      qualityFilter.value = nextQuality
    }
  })

  watch([routeVersionFilter, () => route.query.version], () => {
    const nextVersion = resolveRouteVersionFilter()
    if (nextVersion !== versionFilter.value) {
      versionFilter.value = nextVersion
    }
  })

  watch([routeStyleFilter, () => route.query.style], () => {
    const nextStyle = resolveRouteStyleFilter()
    if (nextStyle !== styleFilter.value) {
      styleFilter.value = nextStyle
    }
  })

  watch([routeLabelFilter, () => route.query.label], () => {
    const nextLabel = resolveRouteLabelFilter()
    if (nextLabel !== labelFilter.value) {
      labelFilter.value = nextLabel
    }
  })

  watch(
    [routeSourceFilter, () => route.query.source, () => route.query.obtain],
    () => {
      const nextSource = resolveRouteSourceFilter()
      if (nextSource !== obtainFilter.value) {
        obtainFilter.value = nextSource
      }
    }
  )

  watch(supportsCategoryFilters, (isSupported) => {
    if (isSupported) return

    categoryFilter.value = null
    subcategoryFilter.value = null
  })

  watch(categoryFilter, () => {
    currentPage.value = 1
    subcategoryFilter.value = null
  })

  watch(subcategoryFilter, () => {
    currentPage.value = 1
  })

  watch(versionFilter, () => {
    currentPage.value = 1
  })

  watch(styleFilter, () => {
    currentPage.value = 1
  })

  watch(labelFilter, () => {
    currentPage.value = 1
  })

  watch(obtainFilter, () => {
    currentPage.value = 1
  })

  watch(activeAdvancedFiltersKey, () => {
    currentPage.value = 1
  })

  watch(
    [
      qualityFilter,
      typeFilter,
      categoryFilter,
      subcategoryFilter,
      versionFilter,
      styleFilter,
      labelFilter,
      obtainFilter,
      activeAdvancedFiltersKey,
      currentPage,
    ],
    () => {
      syncListingRoute()
    }
  )

  onMounted(() => {
    syncListingRoute()
  })

  const retryFetch = () => {
    loadData()
  }

  const toggleAdvancedFiltersDrawer = () => {
    if (!isAdvancedFiltersEnabled.value) return

    isAdvancedFiltersDrawerOpen.value = !isAdvancedFiltersDrawerOpen.value
  }

  const clearAdvancedFilters = () => {
    if (!hasActiveAdvancedFilters.value) return

    advancedFilters.value = createEmptyItemSearchAdvancedFilters()
  }

  const clearFilters = () => {
    qualityFilter.value = null
    typeFilter.value = null
    categoryFilter.value = null
    subcategoryFilter.value = null
    versionFilter.value = null
    styleFilter.value = null
    labelFilter.value = null
    obtainFilter.value = null
    advancedFilters.value = createEmptyItemSearchAdvancedFilters()
    isAdvancedFiltersDrawerOpen.value = false
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

    const options: Array<SelectOption | SelectGroupOption> = []

    if (grouped.clothes && grouped.clothes.length > 0) {
      options.push({
        type: 'group',
        label: t('tracker.items.category.clothes'),
        key: 'clothes',
        children: grouped.clothes.map((type) => ({
          label: t(`type.${type}`),
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
          label: t(`type.${type}`),
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
          label: t(`type.${type}`),
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
          label: t(`type.${type}`),
          value: type,
        })),
      })
    }

    return options
  })

  const availableCategories = computed(
    () => itemSearchFacets.value?.categories ?? []
  )

  const availableSubcategories = computed(
    () => itemSearchFacets.value?.subcategories ?? []
  )
  const advancedFacetOptions = computed<ItemSearchAdvancedFacetMap>(
    () => itemSearchFacets.value?.advanced ?? {}
  )

  watch(
    availableCategories,
    (nextCategories) => {
      if (!categoryFilter.value) return

      const resolved = resolveItemSearchFacetValue(
        categoryFilter.value,
        nextCategories
      )
      if (!resolved) {
        categoryFilter.value = null
        subcategoryFilter.value = null
        return
      }

      if (resolved !== categoryFilter.value) {
        categoryFilter.value = resolved
      }
    },
    { immediate: true }
  )

  watch(
    availableSubcategories,
    (nextSubcategories) => {
      if (!subcategoryFilter.value) return

      const resolved = resolveItemSearchFacetValue(
        subcategoryFilter.value,
        nextSubcategories
      )
      if (!resolved) {
        subcategoryFilter.value = null
        return
      }

      if (resolved !== subcategoryFilter.value) {
        subcategoryFilter.value = resolved
      }
    },
    { immediate: true }
  )

  const validateAdvancedFilters = () => {
    if (typeFilter.value && facetsStatus.value !== 'success') {
      return
    }

    const allowedFields = new Set(advancedFilterFields.value)
    const nextFilters = {
      ...createEmptyItemSearchAdvancedFilters(),
      ...advancedFilters.value,
    }
    let hasChanges = false

    ;(Object.keys(nextFilters) as ItemSearchAdvancedField[]).forEach(
      (field) => {
        const value = nextFilters[field]
        if (!hasActiveItemSearchAdvancedFilterValue(value ?? null)) return

        if (!allowedFields.has(field)) {
          nextFilters[field] = isItemSearchArrayField(field) ? [] : null
          hasChanges = true
          return
        }

        const resolved = getItemSearchAdvancedFacetValue(
          field,
          value,
          advancedFacetOptions.value
        )
        if (!hasActiveItemSearchAdvancedFilterValue(resolved)) {
          nextFilters[field] = isItemSearchArrayField(field) ? [] : null
          hasChanges = true
          return
        }

        if (JSON.stringify(resolved) !== JSON.stringify(value)) {
          nextFilters[field] = resolved
          hasChanges = true
        }
      }
    )

    if (hasChanges) {
      advancedFilters.value = nextFilters
    }
  }

  watch(
    [
      advancedFilterFields,
      () => JSON.stringify(advancedFacetOptions.value),
      facetsStatus,
    ],
    validateAdvancedFilters,
    { immediate: true }
  )

  const updateAdvancedFilters = (nextFilters: ItemSearchAdvancedFilters) => {
    advancedFilters.value = normalizeItemSearchCompendiumAdvancedFilters(
      {
        ...createEmptyItemSearchAdvancedFilters(),
        ...advancedFilters.value,
        ...nextFilters,
      },
      typeFilter.value
    )
  }

  const categoryOptions = computed<SelectOption[]>(() =>
    sortItemSearchFacetValues(availableCategories.value).map((value) => ({
      label:
        value === ITEM_SEARCH_UNCATEGORIZED_VALUE
          ? t('compendium.uncategorized')
          : translateFilterToken('category', value, typeFilter.value),
      value,
    }))
  )

  const subcategoryOptions = computed<SelectOption[]>(() =>
    sortItemSearchFacetValues(availableSubcategories.value).map((value) => ({
      label:
        value === ITEM_SEARCH_UNCATEGORIZED_VALUE
          ? t('compendium.uncategorized')
          : translateFilterToken('subcategory', value, typeFilter.value),
      value,
    }))
  )

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

  const versionOptions = computed<SelectOption[]>(() => {
    return createVersionFilterOptions(
      availableVersions.value,
      (version) => getVersionFilterLabel(version) ?? version
    )
  })
  const renderVersionOptionLabel = (option: SelectOption) => {
    const label = String(option.label ?? option.value ?? '')
    const isMajor = Boolean((option as { isMajor?: boolean }).isMajor)

    if (!isMajor) return label

    return h(
      'span',
      {
        style: {
          fontWeight: '700',
        },
      },
      label
    )
  }

  const navigateToDetail = (id: number) => {
    navigateTo(localePath(`/items/${id}`))
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
