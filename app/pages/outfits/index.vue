<template>
  <CompendiumListingPage
    v-model:page="currentPage"
    v-model:batch-scope="batchScope"
    :entries="entries"
    :total-count="totalItems"
    :loading="loading"
    :error="error"
    :wardrobe-error="wardrobeError"
    :grid-key="cacheKey"
    :entry-count-labels="entryCountLabels"
    :edit-mode="editMode"
    :wardrobe-ready="isWardrobeReady"
    :tierlist-disabled="isTierlistDisabled"
    :selected-count="selectedOutfitIds.size"
    :show-clear-filters="hasFilters"
    :mark-owned-menu-options="batchVariationMarkOptions"
    @toggle-edit-mode="toggleEditMode"
    @open-tierlist="goToTierlist"
    @retry="retryFetch"
    @retry-wardrobe-mode="retryWardrobeMode"
    @clear-filters="clearFilters"
    @mark-owned="applyBatchOwnership(true)"
    @mark-owned-menu-select="applyBatchVariantOwnership"
    @mark-unowned="applyBatchOwnership(false)"
    @clear-selection="clearSelection"
  >
    <template #filter-controls>
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

      <CompendiumQualityFilter
        v-model:value="qualityFilter"
        :disabled-qualities="[2]"
      />

      <n-select
        v-model:value="wardrobeFilter"
        :options="wardrobeFilterOptions"
        :render-label="renderWardrobeFilterOptionLabel"
        size="small"
        class="w-full self-start sm:w-40"
        :show-checkmark="false"
        :clearable="false"
        :disabled="!isWardrobeReady"
      />

      <CatalogVariationToggle v-model:value="variationFilter" />
    </template>

    <template #filter-row>
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

        <n-tree-select
          v-model:value="sourceTreeFilter"
          :options="sourceTreeOptions"
          size="small"
          class="min-w-0"
          clearable
          filterable
          :show-checkmark="false"
          :placeholder="t('compendium.filter_obtain')"
        />
      </div>
    </template>

    <template #entry="{ entry, index }">
      <div
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
          :size="outfitCardSize"
          :show-info="true"
          :meta="
            editMode
              ? 'edit'
              : getVisibleOutfitWardrobeStatus(entry)
                ? 'status'
                : 'default'
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

        <div
          v-if="editMode"
          class="absolute"
          :class="overlayCornerClasses['top-left']"
        >
          <n-checkbox
            :checked="isOutfitBatchSelected(entry.id)"
            :theme-overrides="getWardrobeSelectionCheckboxTheme(entry.quality)"
            :aria-label="t('common.select')"
            @click.stop
            @update:checked="
              (checked) => updateOutfitSelection(entry.id, checked)
            "
          />
        </div>

        <div
          v-if="entry.progress && getVisibleOutfitWardrobeStatus(entry)"
          class="absolute"
          :class="overlayCornerClasses.wardrobe"
          @click.stop
        >
          <WardrobeStatusBadge
            :status="getOutfitWardrobeDisplayStatus(entry)"
            :owned="entry.progress.owned"
            :total="entry.progress.total"
            :quality="entry.quality"
            :evo-level="
              variationFilter === 'base'
                ? getOutfitEvoLevel(entry.itemIds, entry.quality)
                : null
            "
            :glow-up-owned="
              variationFilter === 'base' &&
              isOutfitGlowUpOwned(entry.itemIds, entry.quality)
            "
          />
        </div>

        <div
          v-if="wardrobeInitialized && editMode"
          class="absolute"
          :class="overlayCornerClasses['top-right']"
          @click.stop
        >
          <WardrobeOwnedButton
            :owned="Boolean(getVisibleOutfitWardrobeStatus(entry))"
            :disabled="!isWardrobeReady"
            :loading="isOutfitToggleLoading(entry.id)"
            :quality="entry.quality"
            :evo-level="
              variationFilter === 'base'
                ? getOutfitEvoLevel(entry.itemIds, entry.quality)
                : null
            "
            variant="overlay"
            :menu-options="getOutfitVariationMarkOptions(entry)"
            @toggle="toggleVisibleOutfitOwned(entry.id)"
            @menu-select="(key) => markVisibleOutfitVariantOwned(entry.id, key)"
          />
        </div>
      </div>
    </template>
  </CompendiumListingPage>
</template>

<script setup lang="ts">
  import {
    Tshirt,
    ListAlt,
    PaintBrush,
    Paw,
    CheckCircle,
    Adjust,
    TimesCircle,
    DotCircle,
  } from '@vicons/fa'
  import { NIcon } from 'naive-ui'
  import type { DropdownOption, SelectOption, TreeSelectOption } from 'naive-ui'

  definePageMeta({
    key: 'outfits-listing',
  })

  const { t, locale, getLocaleMessage } = useI18n()
  const dialog = useDialog()
  const message = useMessage()
  const localePath = useLocalePath()
  const route = useRoute()
  const router = useRouter()

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

  type WardrobeVariantMarkKey = VariantType | 'all-variations'
  type WardrobeVariantMarkOption = DropdownOption & {
    key: WardrobeVariantMarkKey
  }

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
  const sourceTreeOptions = computed<TreeSelectOption[]>(() =>
    createSourceTreeFilterOptions(obtainOptions.value, t, 'outfit')
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
  const resolveRouteSourceDetailFilter = (source: string | null) =>
    resolveSourceDetailFilterValue(
      route.query.sourceDetail?.toString() ?? null,
      source,
      'outfit'
    )
  const versionFilter = ref<string | null>(resolveRouteVersionFilter())
  const styleFilter = ref<string | null>(resolveRouteStyleFilter())
  const labelFilter = ref<string | null>(resolveRouteLabelFilter())
  const obtainFilter = ref<string | null>(resolveRouteSourceFilter())
  const sourceDetailFilter = ref<string | null>(
    resolveRouteSourceDetailFilter(obtainFilter.value)
  )
  const sourceTreeFilter = computed({
    get: () =>
      getSourceTreeFilterValue(
        obtainFilter.value,
        sourceDetailFilter.value,
        'outfit'
      ),
    set: (value: string | null) => {
      const next = parseSourceTreeFilterValue(value, 'outfit')
      obtainFilter.value = resolveObtain(next.source)
      sourceDetailFilter.value = next.sourceDetail
    },
  })
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
  const getSourceDetailFilterLabel = (sourceDetail?: string | null) => {
    if (!sourceDetail) return null
    const detail = getLimitedBannerSourceDetails('outfit').find(
      (entry) => entry.key === sourceDetail
    )
    return detail ? t(detail.labelKey) : null
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
      getSourceDetailFilterLabel(sourceDetailFilter.value) ??
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
  const { viewMode, pageSize, outfitCardSize, overlayCornerClasses } =
    provideCompendiumListingView({ currentPage })
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
  const catalogIndex = useCatalogIndex()
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
  const ownedItemIdSet = computed(() => new Set(ownedItemIds.value))
  const { activeRegionScope } = useWardrobeSettings()
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
      sourceDetailFilter.value !== null ||
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
      sourceDetail: sourceDetailFilter.value,
      variations: variationFilter.value,
      wardrobe: wardrobeFilter.value,
    })
  )

  const cacheKey = computed(
    () =>
      `outfits-${qualityFilter.value ?? 'all'}-${styleFilter.value ?? 'all'}-${
        labelFilter.value ?? 'all'
      }-${versionFilter.value ?? 'all'}-${obtainFilter.value ?? 'all'}-${
        sourceDetailFilter.value ?? 'all'
      }-${
        variationFilter.value
      }-${wardrobeFilter.value}-${activeRegionScope.value}-${getListingWardrobeCacheKey(
        wardrobeFilter.value,
        wardrobeMutationVersion.value
      )}-${currentPage.value}-${pageSize.value}-${viewMode.value}`
  )
  const buildOutfitFetchFilters = () => ({
    quality: qualityFilter.value,
    version: versionFilter.value,
    style: styleFilter.value,
    label: labelFilter.value,
    source: obtainFilter.value,
    sourceDetail: sourceDetailFilter.value,
    variations: variationFilter.value,
  })

  const catalogListingQuery = computed(() => ({
    entity: 'outfit' as const,
    filters: buildOutfitFetchFilters(),
    page: currentPage.value,
    pageSize: pageSize.value,
    ownershipMode: wardrobeFilter.value,
    regionScope: activeRegionScope.value,
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
  const entryCountLabels = computed(() => ({
    singular: t('common.outfit'),
    plural: t('common.outfits'),
  }))
  const totalItems = computed(() => compendiumData.value?.total || 0)
  const wardrobeFilterOptions = computed<IconSelectOption[]>(() => [
    { label: t('common.all'), value: 'all', icon: DotCircle },
    { label: t('wardrobe.status.owned'), value: 'owned', icon: CheckCircle },
    { label: t('wardrobe.filters.partial'), value: 'partial', icon: Adjust },
    {
      label: t('wardrobe.status.missing'),
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
    ...(sourceDetailFilter.value && {
      sourceDetail: sourceDetailFilter.value,
    }),
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
    ...(sourceDetailFilter.value && {
      sourceDetail: sourceDetailFilter.value,
    }),
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
    ...(sourceDetailFilter.value && {
      sourceDetail: sourceDetailFilter.value,
    }),
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

  const getVariantMarkOptions = (
    glowUpOwned: boolean
  ): WardrobeVariantMarkOption[] => [
    {
      key: 'all-variations',
      label: t('wardrobe.actions.mark_all_variations'),
    },
    { key: 'base', label: t('banner.outfit.level.1') },
    { key: 'evo1', label: t('banner.outfit.level.2') },
    { key: 'evo2', label: t('banner.outfit.level.3') },
    { key: 'evo3', label: t('banner.outfit.level.4') },
    {
      key: 'glowup',
      label: t(
        glowUpOwned
          ? 'wardrobe.actions.unmark_glowup'
          : 'wardrobe.actions.mark_glowup'
      ),
    },
  ]

  const isVariantMarkApplicableToQuality = (key: string, quality: number) => {
    if (quality < 4) return false
    if (key === 'evo2' || key === 'evo3') return quality >= 5
    return true
  }
  const getApplicableVariantMarkOptions = (
    qualities: readonly number[],
    glowUpOwned: boolean
  ) =>
    variationFilter.value === 'base' && qualities.length > 0
      ? getVariantMarkOptions(glowUpOwned).filter((option) =>
          qualities.every((quality) =>
            isVariantMarkApplicableToQuality(option.key, quality)
          )
        )
      : []
  const outfitQualityById = computed(
    () => new Map(entries.value.map((entry) => [entry.id, entry.quality]))
  )
  const resolveOutfitQuality = (outfitId: number) =>
    outfitQualityById.value.get(outfitId) ??
    catalogIndex.index.value?.outfitById.get(outfitId)?.quality ??
    null
  const isOutfitGlowUpOwned = (itemIds: readonly number[], quality: number) => {
    if (itemIds.length === 0) return false
    return itemIds.every((itemId) =>
      getRelatedItemIds(itemId, quality).some(
        (relatedId) =>
          getItemVariantType(relatedId) === 'glowup' &&
          ownedItemIdSet.value.has(relatedId)
      )
    )
  }
  const outfitItemsByIdForMenu = computed(
    () => new Map(entries.value.map((entry) => [entry.id, entry.itemIds]))
  )
  const areOutfitGlowUpsOwned = (outfitIds: readonly number[]) =>
    outfitIds.length > 0 &&
    outfitIds.every((outfitId) => {
      const quality = resolveOutfitQuality(outfitId)
      const itemIds = outfitItemsByIdForMenu.value.get(outfitId) ?? []
      return (
        quality !== null &&
        itemIds.length > 0 &&
        isOutfitGlowUpOwned(itemIds, quality)
      )
    })
  const getSelectedOutfitQualities = () => {
    const qualities = Array.from(selectedOutfitIds.value).map(
      resolveOutfitQuality
    )
    return qualities.every((quality): quality is number => quality !== null)
      ? qualities
      : []
  }
  const batchOutfitQualities = computed(() => {
    if (batchScope.value === 'selected') return getSelectedOutfitQualities()
    if (batchScope.value === 'page')
      return entries.value.map((entry) => entry.quality)
    if (qualityFilter.value !== null && totalItems.value > 0) {
      return [qualityFilter.value]
    }
    return totalItems.value === entries.value.length
      ? entries.value.map((entry) => entry.quality)
      : []
  })
  const batchOutfitIdsForMenu = computed(() => {
    if (batchScope.value === 'selected') {
      return Array.from(selectedOutfitIds.value)
    }
    if (batchScope.value === 'page') {
      return entries.value.map((entry) => entry.id)
    }
    return totalItems.value === entries.value.length
      ? entries.value.map((entry) => entry.id)
      : []
  })
  const batchVariationMarkOptions = computed(() =>
    getApplicableVariantMarkOptions(
      batchOutfitQualities.value,
      areOutfitGlowUpsOwned(batchOutfitIdsForMenu.value)
    )
  )
  const getOutfitVariationMarkOptions = (entry: {
    itemIds: readonly number[]
    quality: number
  }) =>
    getApplicableVariantMarkOptions(
      [entry.quality],
      isOutfitGlowUpOwned(entry.itemIds, entry.quality)
    )
  const getVariantMarkMaxRank = (key: WardrobeVariantMarkKey) => {
    if (key === 'all-variations') return Number.POSITIVE_INFINITY
    if (key === 'base') return 0
    if (key === 'glowup') return 1
    if (key === 'evo1') return 2
    if (key === 'evo2') return 3
    return 4
  }
  const getVariantRank = (variantType: VariantType) => {
    if (variantType === 'base') return 0
    if (variantType === 'glowup') return 1
    if (variantType === 'evo1') return 2
    if (variantType === 'evo2') return 3
    return 4
  }
  const getEvoLevel = (variantType: VariantType) => {
    if (variantType === 'evo1') return 1
    if (variantType === 'evo2') return 2
    if (variantType === 'evo3') return 3
    return null
  }
  const getOutfitIdsForVariantMark = async (
    outfitIds: readonly number[],
    key: string
  ) => {
    await catalogIndex.load(['outfits', 'outfitItems'])
    const index = catalogIndex.index.value
    const variantKey = key as WardrobeVariantMarkKey

    return outfitIds.flatMap((outfitId) => {
      const outfit = index?.outfitById.get(outfitId)
      const quality = outfit?.quality ?? 5
      const relatedIds = getRelatedOutfitIds(outfitId, quality).filter(
        (relatedId) => !index || index.outfitById.has(relatedId)
      )
      const maxRank = getVariantMarkMaxRank(variantKey)
      return relatedIds.filter(
        (relatedId) =>
          getVariantRank(getOutfitVariantType(String(relatedId))) <= maxRank
      )
    })
  }
  const getOutfitIdsForVariantMarkClear = async (
    outfitIds: readonly number[],
    key: string
  ) => {
    await catalogIndex.load(['outfits', 'outfitItems'])
    const index = catalogIndex.index.value
    const variantKey = key as WardrobeVariantMarkKey
    const maxRank = getVariantMarkMaxRank(variantKey)
    if (!Number.isFinite(maxRank) || variantKey === 'glowup') return []

    return Array.from(
      new Set(
        outfitIds.flatMap((outfitId) => {
          const outfit = index?.outfitById.get(outfitId)
          const quality = outfit?.quality ?? 5
          return getRelatedOutfitIds(outfitId, quality)
            .filter((relatedId) => !index || index.outfitById.has(relatedId))
            .filter((relatedId) => {
              const variantType = getOutfitVariantType(String(relatedId))
              return (
                variantType !== 'glowup' &&
                getVariantRank(variantType) > maxRank
              )
            })
        })
      )
    )
  }
  const getOutfitIdsForVariantUnmark = async (outfitIds: readonly number[]) => {
    await catalogIndex.load(['outfits', 'outfitItems'])
    const index = catalogIndex.index.value

    return Array.from(
      new Set(
        outfitIds.flatMap((outfitId) => {
          const outfit = index?.outfitById.get(outfitId)
          const quality = outfit?.quality ?? 5
          const minRank = getVariantRank(getOutfitVariantType(String(outfitId)))
          return getRelatedOutfitIds(outfitId, quality)
            .filter((relatedId) => !index || index.outfitById.has(relatedId))
            .filter(
              (relatedId) =>
                getVariantRank(getOutfitVariantType(String(relatedId))) >=
                minRank
            )
        })
      )
    )
  }
  const getOutfitItemIdsForVariantMark = async (
    outfitIds: readonly number[],
    key: string
  ) => {
    const targetOutfitIds = await getOutfitIdsForVariantMark(outfitIds, key)
    const index = catalogIndex.index.value
    return normalizeWardrobeItemIds(
      targetOutfitIds.flatMap(
        (outfitId) => index?.outfitItemsById.get(outfitId) ?? []
      )
    )
  }
  const getOutfitItemIdsForVariantMarkClear = async (
    outfitIds: readonly number[],
    key: string
  ) => {
    const targetOutfitIds = await getOutfitIdsForVariantMarkClear(
      outfitIds,
      key
    )
    const index = catalogIndex.index.value
    return normalizeWardrobeItemIds(
      targetOutfitIds.flatMap(
        (outfitId) => index?.outfitItemsById.get(outfitId) ?? []
      )
    )
  }
  const getOutfitItemIdsForGlowUp = async (outfitIds: readonly number[]) => {
    await catalogIndex.load(['outfits', 'outfitItems'])
    const index = catalogIndex.index.value
    const targetOutfitIds = outfitIds.flatMap((outfitId) => {
      const outfit = index?.outfitById.get(outfitId)
      const quality = outfit?.quality ?? 5
      return getRelatedOutfitIds(outfitId, quality)
        .filter((relatedId) => !index || index.outfitById.has(relatedId))
        .filter(
          (relatedId) => getOutfitVariantType(String(relatedId)) === 'glowup'
        )
    })
    return normalizeWardrobeItemIds(
      targetOutfitIds.flatMap(
        (outfitId) => index?.outfitItemsById.get(outfitId) ?? []
      )
    )
  }
  const getOutfitItemIdsForVariantUnmark = async (
    outfitIds: readonly number[]
  ) => {
    const targetOutfitIds = await getOutfitIdsForVariantUnmark(outfitIds)
    const index = catalogIndex.index.value
    return normalizeWardrobeItemIds(
      targetOutfitIds.flatMap(
        (outfitId) => index?.outfitItemsById.get(outfitId) ?? []
      )
    )
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

  const getOutfitEvoLevel = (itemIds: readonly number[], quality: number) => {
    if (quality < 4 || itemIds.length === 0) return null

    return (
      (['evo3', 'evo2', 'evo1'] as const)
        .map((variantType) => ({
          variantType,
          level: getEvoLevel(variantType),
        }))
        .find(({ variantType }) =>
          itemIds.every((itemId) =>
            getRelatedItemIds(itemId, quality).some(
              (relatedId) =>
                getItemVariantType(relatedId) === variantType &&
                ownedItemIdSet.value.has(relatedId)
            )
          )
        )?.level ?? null
    )
  }

  const getOutfitWardrobeStatus = (entry: {
    progress?: WardrobeOutfitProgress | null
    itemIds: readonly number[]
    quality: number
  }) => {
    if (!entry.progress) return null
    if (getOutfitEvoLevel(entry.itemIds, entry.quality)) return 'evo-owned'
    if (isOutfitGlowUpOwned(entry.itemIds, entry.quality)) {
      return 'glowup-owned'
    }
    return entry.progress.status === 'missing' ? null : entry.progress.status
  }
  const getVisibleOutfitWardrobeStatus = (entry: {
    progress?: WardrobeOutfitProgress | null
    itemIds: readonly number[]
    quality: number
  }) => {
    if (!entry.progress) return null
    if (variationFilter.value === 'base') {
      return getOutfitWardrobeStatus(entry)
    }
    return entry.progress.status === 'missing' ? null : entry.progress.status
  }
  const getOutfitWardrobeDisplayStatus = (entry: {
    progress?: WardrobeOutfitProgress | null
    itemIds: readonly number[]
    quality: number
  }) => {
    const status = getVisibleOutfitWardrobeStatus(entry)
    return variationFilter.value === 'base' ||
      (status !== 'evo-owned' && status !== 'glowup-owned')
      ? status
      : 'owned'
  }

  const toggleVisibleOutfitOwned = async (outfitId: number) => {
    if (isOutfitToggleLoading(outfitId)) return

    const entry = entries.value.find((candidate) => candidate.id === outfitId)
    if (!entry) return

    setOutfitToggleLoading(outfitId, true)
    try {
      const itemIds = entry.itemIds.length
        ? entry.itemIds
        : getOutfitItemIdsFromRecord([outfitId], await fetchOutfitRelations())
      if (itemIds.length === 0) return

      const entryWithProgress = {
        ...entry,
        itemIds,
        progress: getOutfitProgress(itemIds),
      }

      if (getVisibleOutfitWardrobeStatus(entryWithProgress)) {
        const itemIds = await getOutfitItemIdsForVariantUnmark([outfitId])
        if (itemIds.length > 0) {
          await markOutfitOwned(itemIds, false)
        }
        return
      }

      await markOutfitOwned(itemIds, true)
    } catch {
      message.error(t('wardrobe.error.save'))
    } finally {
      setOutfitToggleLoading(outfitId, false)
    }
  }

  const markVisibleOutfitVariantOwned = async (
    outfitId: number,
    key: string
  ) => {
    if (isOutfitToggleLoading(outfitId)) return

    setOutfitToggleLoading(outfitId, true)
    try {
      if (key === 'glowup') {
        const glowUpItemIds = await getOutfitItemIdsForGlowUp([outfitId])
        if (
          glowUpItemIds.length > 0 &&
          glowUpItemIds.every((itemId) => ownedItemIdSet.value.has(itemId))
        ) {
          await markOutfitOwned(glowUpItemIds, false)
          return
        }
      }

      const itemIds = await getOutfitItemIdsForVariantMark([outfitId], key)
      const clearItemIds = await getOutfitItemIdsForVariantMarkClear(
        [outfitId],
        key
      )
      if (itemIds.length > 0) {
        await markOutfitOwned(itemIds, true)
      }
      if (clearItemIds.length > 0) {
        await markOutfitOwned(clearItemIds, false)
      }
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

  const getBatchOutfitIds = async () => {
    if (batchScope.value === 'selected') {
      return Array.from(selectedOutfitIds.value)
    }

    if (batchScope.value === 'page') {
      return entries.value.map((entry) => entry.id)
    }

    const idResponse = await fetchMatchingOutfitIds()
    return idResponse.ids
  }

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
      const itemIds = normalizeWardrobeItemIds(
        owned
          ? await getBatchOutfitItemIds()
          : await getOutfitItemIdsForVariantUnmark(await getBatchOutfitIds())
      )
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

  const applyBatchVariantOwnership = async (key: string) => {
    try {
      const outfitIds = await getBatchOutfitIds()
      if (outfitIds.length === 0) return

      if (key === 'glowup') {
        const glowUpItemIds = await getOutfitItemIdsForGlowUp(outfitIds)
        if (
          glowUpItemIds.length > 0 &&
          glowUpItemIds.every((itemId) => ownedItemIdSet.value.has(itemId))
        ) {
          if (
            batchScope.value === 'all' &&
            !(await confirmBroadOutfitChange(false, glowUpItemIds.length))
          ) {
            return
          }

          await markOutfitOwned(glowUpItemIds, false)
          if (batchScope.value === 'selected') {
            clearSelection()
          }
          return
        }
      }

      const itemIds = await getOutfitItemIdsForVariantMark(outfitIds, key)
      const clearItemIds = await getOutfitItemIdsForVariantMarkClear(
        outfitIds,
        key
      )
      const affectedItemIds = normalizeWardrobeItemIds([
        ...itemIds,
        ...clearItemIds,
      ])
      if (affectedItemIds.length === 0) return

      if (
        batchScope.value === 'all' &&
        !(await confirmBroadOutfitChange(true, affectedItemIds.length))
      ) {
        return
      }

      if (itemIds.length > 0) {
        await markOutfitOwned(itemIds, true)
      }
      if (clearItemIds.length > 0) {
        await markOutfitOwned(clearItemIds, false)
      }
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
    sourceDetailFilter.value = resolveSourceDetailFilterValue(
      sourceDetailFilter.value,
      obtainFilter.value,
      'outfit'
    )
  })

  watch(sourceDetailFilter, () => {
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
    [
      routeSourceFilter,
      () => route.query.source,
      () => route.query.obtain,
      () => route.query.sourceDetail,
    ],
    () => {
      const nextSource = resolveRouteSourceFilter()
      if (nextSource !== obtainFilter.value) {
        obtainFilter.value = nextSource
      }
      const nextSourceDetail = resolveRouteSourceDetailFilter(nextSource)
      if (nextSourceDetail !== sourceDetailFilter.value) {
        sourceDetailFilter.value = nextSourceDetail
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
      sourceDetailFilter,
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
    sourceDetailFilter.value = null
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
