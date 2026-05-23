<template>
  <div class="mx-auto max-w-7xl space-y-2 sm:space-y-4">
    <!-- Filter Card -->
    <n-card
      size="small"
      class="rounded-xl p-0 sm:p-2"
      content-class="p-2 sm:p-4"
    >
      <div class="flex flex-col gap-2">
        <div class="flex items-start justify-between gap-2">
          <div
            class="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center"
          >
            <n-select
              :value="compendiumSection"
              :options="compendiumSectionOptions"
              :render-label="renderCompendiumSectionOptionLabel"
              size="small"
              class="w-full max-w-40 self-start sm:w-40"
              :show-checkmark="false"
              :clearable="false"
              @update:value="handleCompendiumSectionChange"
            />

            <n-select
              v-model:value="wardrobeFilter"
              :options="wardrobeFilterOptions"
              :render-label="renderWardrobeFilterOptionLabel"
              size="small"
              class="w-full max-w-40 self-start sm:w-40"
              :show-checkmark="false"
              :clearable="false"
              :disabled="!isWardrobeReady"
            />

            <CatalogVariationToggle v-model:value="variationFilter" />

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
                  v-for="q in [5, 4, 3, 2]"
                  :key="q"
                  size="small"
                  v-bind="getQualityButtonTheme(q, qualityFilter === q)"
                  class="min-w-10"
                  :disabled="q === 2"
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

          <div class="flex shrink-0 items-center gap-2 self-start">
            <n-tooltip
              :disabled="totalItems <= TIER_ENTRY_LIMIT"
              trigger="hover"
            >
              <template #trigger>
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
              </template>
              {{
                t('tierlist.over_limit.description', {
                  max: TIER_ENTRY_LIMIT,
                })
              }}
            </n-tooltip>

            <n-tooltip trigger="hover">
              <template #trigger>
                <n-button
                  size="small"
                  text
                  :type="editMode ? 'primary' : 'default'"
                  :disabled="!isWardrobeReady"
                  class="w-8"
                  :aria-label="
                    editMode
                      ? t('wardrobe.actions.view_mode')
                      : t('wardrobe.actions.edit_mode')
                  "
                  @click="toggleEditMode"
                >
                  <template #icon>
                    <n-icon>
                      <BookOpen v-if="editMode" />
                      <UserEdit v-else />
                    </n-icon>
                  </template>
                </n-button>
              </template>
              {{
                editMode
                  ? t('wardrobe.actions.view_mode')
                  : t('wardrobe.actions.edit_mode')
              }}
            </n-tooltip>
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
                v-for="q in [5, 4, 3, 2]"
                :key="q"
                size="small"
                v-bind="getQualityButtonTheme(q, qualityFilter === q)"
                class="min-w-10"
                :disabled="q === 2"
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
      </div>
    </n-card>

    <WardrobeBatchToolbar
      v-if="editMode"
      v-model:scope="batchScope"
      :edit-mode="editMode"
      :selected-count="selectedOutfitIds.size"
      :page-count="entries.length"
      :all-matching-count="totalItems"
      :disabled="!isWardrobeReady || loading"
      @mark-owned="applyBatchOwnership(true)"
      @mark-unowned="applyBatchOwnership(false)"
      @clear-selection="clearSelection"
    />

    <!-- Grid Card -->
    <n-card
      size="small"
      class="rounded-xl p-0 sm:flex sm:flex-1 sm:flex-col sm:p-2"
      content-class="p-2 sm:p-4 sm:flex-1 sm:flex sm:flex-col"
    >
      <div class="min-h-0 sm:flex sm:flex-1 sm:flex-col">
        <div class="space-y-3 sm:space-y-4">
          <div
            v-if="wardrobeError"
            class="py-12 text-center"
          >
            <n-result
              size="small"
              status="error"
              :title="t('wardrobe.error.mode_title')"
              :description="t('wardrobe.error.mode_description')"
            >
              <template #footer>
                <n-button
                  type="primary"
                  @click="retryWardrobeMode"
                >
                  {{ t('wardrobe.actions.retry') }}
                </n-button>
              </template>
            </n-result>
          </div>

          <div
            v-else-if="error"
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
                  {{ $t('common.retry') }}
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
              v-if="!error && entries.length > 0"
              :key="listingAnimationKey"
              class="grid grid-cols-3 gap-2 sm:grid-cols-6 sm:content-start sm:gap-3"
            >
              <div
                v-for="(entry, index) in entries"
                :key="entry.id"
                class="group relative block cursor-pointer"
                :class="getListingCardAnimationClass(index)"
                :style="getListingCardAnimationStyle(index)"
                @click="handleOutfitCardClick(entry.id, $event)"
              >
                <OutfitCard
                  :outfit-id="entry.id"
                  :quality="entry.quality"
                  :name="entry.name"
                  :style-key="entry.styleKey"
                  :labels="entry.labels"
                  :show-info="true"
                  :meta="
                    editMode ? 'edit' : entry.progress ? 'status' : 'default'
                  "
                  :loading="getListingImageLoading(index)"
                  :fetchpriority="getListingImageFetchPriority(index)"
                  class="transition-shadow duration-300 group-hover:shadow-xl"
                  :style="
                    isOutfitBatchSelected(entry.id)
                      ? getQualityRingStyle(entry.quality)
                      : undefined
                  "
                />
                <div class="absolute top-2 left-2 z-30">
                  <n-checkbox
                    v-if="editMode"
                    :checked="isOutfitBatchSelected(entry.id)"
                    :theme-overrides="
                      getWardrobeSelectionCheckboxTheme(entry.quality)
                    "
                    :aria-label="t('common.select')"
                    @click.stop
                    @update:checked="
                      (checked) => updateOutfitSelection(entry.id, checked)
                    "
                  />
                </div>
                <div
                  v-if="entry.progress && !editMode"
                  class="absolute right-2 bottom-2 z-30"
                  @click.stop
                >
                  <WardrobeStatusBadge
                    :status="entry.progress.status"
                    :owned="entry.progress.owned"
                    :total="entry.progress.total"
                    :quality="entry.quality"
                  />
                </div>
                <div
                  v-else-if="
                    wardrobeInitialized && editMode && entry.itemIds.length > 0
                  "
                  class="absolute right-2 bottom-2 z-30"
                  @click.stop
                >
                  <WardrobeOwnedButton
                    :owned="entry.progress?.status === 'owned'"
                    :disabled="!isWardrobeReady"
                    :loading="isOutfitToggleLoading(entry.id)"
                    :quality="entry.quality"
                    variant="overlay"
                    @toggle="toggleVisibleOutfitOwned(entry.id)"
                  />
                </div>
              </div>
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
                :style="getListingCardAnimationStyle(index)"
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
  </div>
</template>

<script setup lang="ts">
  import {
    BookOpen,
    UserEdit,
    Star,
    Tshirt,
    ListAlt,
    PaintBrush,
    Paw,
    SortAmountDown,
    CheckCircle,
    Adjust,
    TimesCircle,
    DotCircle,
  } from '@vicons/fa'
  import { NIcon } from 'naive-ui'
  import type { SelectOption } from 'naive-ui'
  import { h, type Component } from 'vue'

  definePageMeta({
    key: 'outfits-listing',
  })

  const { t, locale, getLocaleMessage } = useI18n()
  const dialog = useDialog()
  const message = useMessage()
  const localePath = useLocalePath()
  const route = useRoute()
  const router = useRouter()
  const { getImageSrc } = imageProvider()

  const routeSeoFilter = computed(() =>
    getSeoListRouteFilter(route.path, 'outfits')
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
  type OutfitListingPrimaryFilter =
    | 'quality'
    | 'version'
    | 'style'
    | 'label'
    | 'source'
    | null
  type CompendiumSection = 'outfits' | 'items' | 'momo' | 'makeups'
  type IconSelectOption = SelectOption & { icon: Component }
  type BuildListingQueryOptions = {
    primaryFilter?: OutfitListingPrimaryFilter
    includePage?: boolean
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

  const obtainOptions = computed(() =>
    createObtainFilterOptions(availableObtains.value, t, {
      includeGroup: isObtainGroupVisibleInOutfits,
      fallbackLabel: (id) => `Obtain ${id}`,
    })
  )

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

  const resolveObtain = (value?: string | null) =>
    resolveObtainFilterValue(value, availableObtainValues.value)

  const resolveQuality = (value?: string | number | null) => {
    if (value === null || value === undefined || value === '') return null
    const parsed =
      typeof value === 'number' && Number.isFinite(value)
        ? value
        : Number(value)
    return resolveSeoOutfitQualitySlug(parsed) !== null ? parsed : null
  }
  type CatalogVariationFilter =
    | 'base'
    | 'all'
    | 'glowup'
    | 'evo1'
    | 'evo2'
    | 'evo3'
    | 'all-evos'

  const variationFilterValues = new Set<CatalogVariationFilter>([
    'base',
    'all',
    'glowup',
    'evo1',
    'evo2',
    'evo3',
    'all-evos',
  ])
  const resolveVariationFilter = (
    value?: string | null
  ): CatalogVariationFilter => {
    if (value === 'show' || value === 'true' || value === '1') return 'all'
    return variationFilterValues.has(value as CatalogVariationFilter)
      ? (value as CatalogVariationFilter)
      : 'base'
  }
  const resolveRouteQualityFilter = () =>
    routeQualityFilter.value ??
    resolveQuality(route.query.quality?.toString() ?? null)
  const qualityFilter = ref<number | null>(resolveRouteQualityFilter())
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
  const versionFilter = ref<string | null>(resolveRouteVersionFilter())
  const styleFilter = ref<string | null>(resolveRouteStyleFilter())
  const labelFilter = ref<string | null>(resolveRouteLabelFilter())
  const obtainFilter = ref<string | null>(resolveRouteSourceFilter())
  const variationFilter = ref<CatalogVariationFilter>(
    resolveVariationFilter(route.query.variations?.toString() ?? null)
  )
  const activeSourceLabel = computed(() => {
    const labelKey = resolveObtainGroupLabelKey(obtainFilter.value)
    if (!labelKey) return null
    const translated = t(labelKey)
    return translated !== labelKey ? translated : null
  })
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
      getQualityFilterLabel(qualityFilter.value) ??
      getVersionFilterLabel(versionFilter.value) ??
      getStyleFilterLabel(styleFilter.value) ??
      getTagFilterLabel(labelFilter.value) ??
      activeSourceLabel.value ??
      getSourceFilterLabel(obtainFilter.value)
  )
  const pageTitle = computed(() => {
    const title = activeListFilterLabel.value
      ? `${t('navigation.outfit')} - ${activeListFilterLabel.value}`
      : t('navigation.outfit')
    return `${title} - ${t('meta.game_title')} - ${t('navigation.title')}`
  })
  const description = computed(() => {
    const baseDescription = t('meta.description.outfits')
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

  const currentPage = ref(normalizeCatalogListingPage(route.query.page))
  type OutfitWardrobeFilter = 'all' | WardrobeOutfitStatus
  type BatchScope = 'selected' | 'page' | 'all'
  const resolveWardrobeFilter = (
    value?: string | null
  ): OutfitWardrobeFilter => {
    if (value === 'owned' || value === 'partial' || value === 'missing') {
      return value
    }
    return 'all'
  }
  const wardrobeFilter = ref<OutfitWardrobeFilter>(
    resolveWardrobeFilter(route.query.wardrobe?.toString() ?? null)
  )
  const editMode = ref(false)
  const batchScope = ref<BatchScope>('selected')
  const selectedOutfitIds = ref<Set<number>>(new Set())
  const togglingOutfitIds = ref<Set<number>>(new Set())
  const {
    initialized: wardrobeInitialized,
    ownedItemIds,
    error: storageError,
    canMutate: isWardrobeReady,
    mutationVersion: wardrobeMutationVersion,
    init: initWardrobe,
    retry: retryWardrobeStorage,
    getOutfitProgress,
    markOutfitOwned,
  } = useWardrobe()
  const wardrobeModeError = ref<Error | null>(null)
  const wardrobeError = computed(() =>
    wardrobeFilter.value !== 'all' || editMode.value
      ? (storageError.value ?? wardrobeModeError.value)
      : wardrobeModeError.value
  )
  const hasFilters = computed(
    () =>
      qualityFilter.value !== null ||
      versionFilter.value !== null ||
      styleFilter.value !== null ||
      labelFilter.value !== null ||
      obtainFilter.value !== null ||
      variationFilter.value !== 'base' ||
      wardrobeFilter.value !== 'all'
  )
  const selectionFilterKey = computed(() =>
    JSON.stringify({
      quality: qualityFilter.value,
      version: versionFilter.value,
      style: styleFilter.value,
      label: labelFilter.value,
      obtain: obtainFilter.value,
      variations: variationFilter.value,
      wardrobe: wardrobeFilter.value,
    })
  )

  const cacheKey = computed(
    () =>
      `outfits-${qualityFilter.value ?? 'all'}-${styleFilter.value ?? 'all'}-${
        labelFilter.value ?? 'all'
      }-${versionFilter.value ?? 'all'}-${obtainFilter.value ?? 'all'}-${
        variationFilter.value
      }-${wardrobeFilter.value}-${wardrobeMutationVersion.value}-${
        currentPage.value
      }-${pageSize}`
  )
  const buildOutfitFetchFilters = () => ({
    quality: qualityFilter.value,
    version: versionFilter.value,
    style: styleFilter.value,
    label: labelFilter.value,
    source: obtainFilter.value,
    variations: variationFilter.value,
  })

  const catalogListingQuery = computed(() => ({
    entity: 'outfit' as const,
    filters: buildOutfitFetchFilters(),
    page: currentPage.value,
    pageSize,
    ownershipMode: wardrobeFilter.value,
  }))

  const {
    data: compendiumData,
    pending: isListingPending,
    status: requestStatus,
    error,
    refresh: loadData,
    fetchMatchingIds: fetchMatchingOutfitIds,
    fetchOutfitRelations,
  } = await useCatalogListing<OutfitListEntry>({
    key: cacheKey,
    query: catalogListingQuery,
    wardrobe: {
      initialized: wardrobeInitialized,
      storageError,
      ownedItemIds,
      init: initWardrobe,
      getOutfitProgress,
    },
    onWardrobeModeError: (nextError) => {
      wardrobeModeError.value = nextError
    },
  })

  const entries = computed(() => {
    const data = (compendiumData.value?.data || []) as OutfitListEntry[]
    const outfitItems =
      (
        compendiumData.value as {
          wardrobeOutfitItems?: Record<string, number[]>
        } | null
      )?.wardrobeOutfitItems ?? {}

    return data.map((entry) => ({
      id: entry.id,
      quality: entry.quality,
      name: t(`outfit.${entry.id}.name`),
      styleKey: entry.style ? resolveStyleKeyFromI18nKey(entry.style) : null,
      labels: entry.labels || [],
      itemIds: outfitItems[entry.id] ?? [],
      progress: outfitItems[entry.id]
        ? getOutfitProgress(outfitItems[entry.id]!)
        : null,
    }))
  })
  const loading = computed(() =>
    isListingInitialLoading({
      error: error.value,
      entryCount: entries.value.length,
      pending: isListingPending.value,
      status: requestStatus.value,
    })
  )
  const listingAnimationKey = computed(() => cacheKey.value)

  const totalItems = computed(() => compendiumData.value?.total || 0)

  const countLabels = computed(() => ({
    singular: t('common.outfit'),
    plural: t('common.outfits'),
  }))
  const wardrobeFilterOptions = computed<IconSelectOption[]>(() => [
    { label: t('wardrobe.filters.all'), value: 'all', icon: DotCircle },
    { label: t('wardrobe.filters.owned'), value: 'owned', icon: CheckCircle },
    { label: t('wardrobe.filters.partial'), value: 'partial', icon: Adjust },
    {
      label: t('wardrobe.filters.missing'),
      value: 'missing',
      icon: TimesCircle,
    },
  ])
  const renderWardrobeFilterOptionLabel = (option: SelectOption) => {
    const { icon } = option as IconSelectOption
    return h('div', { class: 'flex items-center gap-2' }, [
      h(NIcon, { size: 16 }, { default: () => h(icon) }),
      h('span', null, String(option.label ?? '')),
    ])
  }
  const TIER_ENTRY_LIMIT = 200
  const isTierlistDisabled = computed(
    () =>
      editMode.value ||
      loading.value ||
      !!error.value ||
      totalItems.value > TIER_ENTRY_LIMIT
  )

  const currentListingPath = computed(() => {
    const qualitySlug = resolveSeoOutfitQualitySlug(qualityFilter.value)
    if (qualitySlug) {
      return {
        path: `/outfits/quality/${qualitySlug}`,
        primaryFilter: 'quality' as OutfitListingPrimaryFilter,
      }
    }

    const versionSlug = resolveSeoVersionSlug(versionFilter.value)
    if (versionSlug) {
      return {
        path: `/outfits/version/${versionSlug}`,
        primaryFilter: 'version' as OutfitListingPrimaryFilter,
      }
    }

    const styleSlug = resolveSeoStyleSlug(styleFilter.value)
    if (styleSlug) {
      return {
        path: `/outfits/style/${styleSlug}`,
        primaryFilter: 'style' as OutfitListingPrimaryFilter,
      }
    }

    const labelSlug = resolveSeoTagSlug(labelFilter.value)
    if (labelSlug) {
      return {
        path: `/outfits/tag/${labelSlug}`,
        primaryFilter: 'label' as OutfitListingPrimaryFilter,
      }
    }

    const sourceSlug = resolveSeoOutfitSourceSlug(obtainFilter.value)
    if (sourceSlug) {
      return {
        path: `/outfits/source/${sourceSlug}`,
        primaryFilter: 'source' as OutfitListingPrimaryFilter,
      }
    }

    return {
      path: '/outfits',
      primaryFilter: null,
    }
  })
  const compendiumSection = 'outfits' as const
  const compendiumSectionOptions = computed<IconSelectOption[]>(() => [
    { label: t('common.outfits'), value: 'outfits', icon: Tshirt },
    { label: t('common.items'), value: 'items', icon: ListAlt },
    { label: t('common.makeups'), value: 'makeups', icon: PaintBrush },
    { label: t('common.momo'), value: 'momo', icon: Paw },
  ])
  const renderCompendiumSectionOptionLabel = (option: SelectOption) => {
    const { icon } = option as IconSelectOption
    return h('div', { class: 'flex items-center gap-2' }, [
      h(NIcon, { size: 16 }, { default: () => h(icon) }),
      h('span', null, String(option.label ?? '')),
    ])
  }

  const buildListingQuery = ({
    primaryFilter = null,
    includePage = true,
  }: BuildListingQueryOptions = {}) => ({
    ...(primaryFilter !== 'quality' &&
      qualityFilter.value && { quality: qualityFilter.value }),
    ...(primaryFilter !== 'version' &&
      versionFilter.value && { version: versionFilter.value }),
    ...(primaryFilter !== 'style' &&
      styleFilter.value && { style: styleFilter.value }),
    ...(primaryFilter !== 'label' &&
      labelFilter.value && { label: labelFilter.value }),
    ...(primaryFilter !== 'source' &&
      obtainFilter.value && { source: obtainFilter.value }),
    ...(variationFilter.value !== 'base' && {
      variations: variationFilter.value,
    }),
    ...(wardrobeFilter.value !== 'all' && { wardrobe: wardrobeFilter.value }),
    ...(includePage && currentPage.value > 1 && { page: currentPage.value }),
  })
  const buildMakeupListingQuery = ({
    includePage = true,
  }: {
    includePage?: boolean
  } = {}) => ({
    ...(qualityFilter.value !== null && { quality: qualityFilter.value }),
    ...(versionFilter.value && { version: versionFilter.value }),
    ...(styleFilter.value && { style: styleFilter.value }),
    ...(obtainFilter.value && { source: obtainFilter.value }),
    ...(variationFilter.value !== 'base' && {
      variations: variationFilter.value,
    }),
    ...(includePage && currentPage.value > 1 && { page: currentPage.value }),
  })

  const buildTierlistQuery = () => ({
    mode: 'outfits',
    ...(qualityFilter.value !== null && { quality: qualityFilter.value }),
    ...(versionFilter.value && { version: versionFilter.value }),
    ...(styleFilter.value && { style: styleFilter.value }),
    ...(labelFilter.value && { label: labelFilter.value }),
    ...(obtainFilter.value && { source: obtainFilter.value }),
    ...(variationFilter.value !== 'base' && {
      variations: variationFilter.value,
    }),
    ...(wardrobeFilter.value !== 'all' && { wardrobe: wardrobeFilter.value }),
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

  const toggleEditMode = () => {
    editMode.value = !editMode.value
    if (!editMode.value) {
      clearSelection()
    }
  }

  const isOutfitBatchSelected = (outfitId: number) =>
    batchScope.value === 'selected'
      ? selectedOutfitIds.value.has(outfitId)
      : true

  const materializeVisibleOutfitSelection = () => {
    selectedOutfitIds.value = new Set(entries.value.map((entry) => entry.id))
    batchScope.value = 'selected'
  }

  const updateOutfitSelection = (outfitId: number, checked: boolean) => {
    if (batchScope.value !== 'selected') {
      materializeVisibleOutfitSelection()
    }

    const nextSelection = new Set(selectedOutfitIds.value)
    if (checked) {
      nextSelection.add(outfitId)
    } else {
      nextSelection.delete(outfitId)
    }
    selectedOutfitIds.value = nextSelection
  }

  const clearSelection = () => {
    selectedOutfitIds.value = new Set()
    batchScope.value = 'selected'
  }

  const getWardrobeSelectionCheckboxTheme = (quality: number) => {
    const color = getQualityColor(quality)
    return {
      color: `${color}22`,
      colorChecked: color,
      border: `1px solid ${color}AA`,
      borderChecked: `1px solid ${color}`,
      borderFocus: `1px solid ${color}`,
      boxShadowFocus: 'none',
      checkMarkColor: '#ffffff',
    }
  }

  const setOutfitToggleLoading = (outfitId: number, loading: boolean) => {
    const nextIds = new Set(togglingOutfitIds.value)
    if (loading) {
      nextIds.add(outfitId)
    } else {
      nextIds.delete(outfitId)
    }
    togglingOutfitIds.value = nextIds
  }

  const isOutfitToggleLoading = (outfitId: number) =>
    togglingOutfitIds.value.has(outfitId)

  const toggleVisibleOutfitOwned = async (outfitId: number) => {
    if (isOutfitToggleLoading(outfitId)) return

    const entry = entries.value.find((candidate) => candidate.id === outfitId)
    if (!entry?.itemIds.length) return

    setOutfitToggleLoading(outfitId, true)
    try {
      await markOutfitOwned(entry.itemIds, entry.progress?.status !== 'owned')
    } catch {
      message.error(t('wardrobe.error.save'))
    } finally {
      setOutfitToggleLoading(outfitId, false)
    }
  }

  const isListingCardControlClick = (event: MouseEvent) => {
    const target = event.target
    return (
      target instanceof HTMLElement &&
      Boolean(target.closest('button, input, label, [role="button"]'))
    )
  }

  const handleOutfitCardClick = (outfitId: number, event: MouseEvent) => {
    if (isListingCardControlClick(event)) return

    if (editMode.value) {
      updateOutfitSelection(outfitId, !isOutfitBatchSelected(outfitId))
      return
    }

    navigateTo(localePath(`/outfits/${outfitId}`))
  }

  const getOutfitItemIdsFromRecord = (
    outfitIds: number[],
    outfitItems: Record<string, number[]>
  ) => outfitIds.flatMap((outfitId) => outfitItems[String(outfitId)] ?? [])

  const getVisibleOutfitItems = () =>
    Object.fromEntries(
      entries.value.map((entry) => [String(entry.id), entry.itemIds])
    )

  const getBatchOutfitItemIds = async () => {
    if (batchScope.value === 'selected') {
      const outfitIds = Array.from(selectedOutfitIds.value)
      const visibleOutfitItems = getVisibleOutfitItems()
      const missingRelations = outfitIds.some(
        (outfitId) => !visibleOutfitItems[String(outfitId)]?.length
      )
      return getOutfitItemIdsFromRecord(
        outfitIds,
        missingRelations ? await fetchOutfitRelations() : visibleOutfitItems
      )
    }

    if (batchScope.value === 'page') {
      const outfitIds = entries.value.map((entry) => entry.id)
      return getOutfitItemIdsFromRecord(outfitIds, getVisibleOutfitItems())
    }

    const idResponse = await fetchMatchingOutfitIds()
    return getOutfitItemIdsFromRecord(
      idResponse.ids,
      idResponse.outfitItems ?? (await fetchOutfitRelations())
    )
  }

  const confirmBroadOutfitChange = (owned: boolean, itemCount: number) =>
    new Promise<boolean>((resolve) => {
      dialog.warning({
        title: t('common.confirm'),
        content: owned
          ? t('wardrobe.confirm.all_owned', { count: itemCount })
          : t('wardrobe.confirm.outfit_unowned', { count: itemCount }),
        positiveText: t('common.confirm'),
        negativeText: t('common.cancel'),
        onPositiveClick: () => resolve(true),
        onNegativeClick: () => resolve(false),
        onClose: () => resolve(false),
      })
    })

  const applyBatchOwnership = async (owned: boolean) => {
    try {
      const itemIds = normalizeWardrobeItemIds(await getBatchOutfitItemIds())
      if (itemIds.length === 0) return

      if (
        (batchScope.value === 'all' || !owned) &&
        !(await confirmBroadOutfitChange(owned, itemIds.length))
      ) {
        return
      }

      await markOutfitOwned(itemIds, owned)
      if (batchScope.value === 'selected') {
        clearSelection()
      }
    } catch {
      message.error(t('wardrobe.error.save'))
    }
  }

  const handleCompendiumSectionChange = (value: string) => {
    const nextSection = value as CompendiumSection
    if (nextSection === 'outfits') return

    if (nextSection === 'items') {
      navigateTo(
        localePath({
          path: '/items',
          query: buildListingQuery({ includePage: false }),
        })
      )
      return
    }

    if (nextSection === 'momo') {
      navigateTo(
        localePath({
          path: '/momo',
          query: {
            ...(qualityFilter.value !== null && {
              quality: qualityFilter.value,
            }),
            ...(versionFilter.value && { version: versionFilter.value }),
            ...(obtainFilter.value && { source: obtainFilter.value }),
          },
        })
      )
      return
    }

    navigateTo(
      localePath({
        path: '/makeups',
        query: buildMakeupListingQuery({ includePage: false }),
      })
    )
  }

  const syncListingRoute = () => {
    const listingPath = currentListingPath.value
    router.replace({
      path: localePath(listingPath.path),
      query: buildListingQuery({
        primaryFilter: listingPath.primaryFilter,
      }),
    })
  }

  watch(qualityFilter, () => {
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

  watch(variationFilter, () => {
    currentPage.value = 1
  })

  watch(wardrobeFilter, () => {
    currentPage.value = 1
  })

  watch(selectionFilterKey, () => {
    if (editMode.value) {
      clearSelection()
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
    () => route.query.variations,
    () => {
      const nextVariations = resolveVariationFilter(
        route.query.variations?.toString() ?? null
      )
      if (nextVariations !== variationFilter.value) {
        variationFilter.value = nextVariations
      }
    }
  )

  watch(
    () => route.query.wardrobe,
    () => {
      const nextWardrobeFilter = resolveWardrobeFilter(
        route.query.wardrobe?.toString() ?? null
      )
      if (nextWardrobeFilter !== wardrobeFilter.value) {
        wardrobeFilter.value = nextWardrobeFilter
      }
    }
  )

  watch(
    [
      qualityFilter,
      versionFilter,
      styleFilter,
      labelFilter,
      obtainFilter,
      variationFilter,
      wardrobeFilter,
      currentPage,
    ],
    () => {
      syncListingRoute()
    }
  )

  onMounted(() => {
    syncListingRoute()
    if (wardrobeFilter.value !== 'all') {
      loadData()
    }
  })

  const retryFetch = () => {
    loadData()
  }

  const retryWardrobeMode = () => {
    wardrobeModeError.value = null
    retryWardrobeStorage()
    loadData()
  }

  const clearFilters = () => {
    qualityFilter.value = null
    versionFilter.value = null
    styleFilter.value = null
    labelFilter.value = null
    obtainFilter.value = null
    variationFilter.value = 'base'
    wardrobeFilter.value = 'all'
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

  const versionOptions = computed(() =>
    createVersionFilterOptions(
      availableVersions.value,
      (version) => getVersionFilterLabel(version) ?? version
    )
  )
  const renderVersionOptionLabel = (option: {
    label?: string | number
    value?: string | number
    isMajor?: boolean
  }) => {
    const label = String(option.label ?? option.value ?? '')
    if (!option.isMajor) return label

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
</script>
