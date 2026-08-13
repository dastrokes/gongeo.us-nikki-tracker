<template>
  <CompendiumListingPage
    v-model:page="currentPage"
    v-model:batch-scope="batchScope"
    :entries="pagedEntries"
    :total-count="filteredEntries.length"
    :loading="loading"
    :error="catalogError"
    :wardrobe-error="wardrobeError"
    :grid-key="cacheKey"
    :entry-count-labels="entryCountLabels"
    :edit-mode="editMode"
    :wardrobe-ready="isWardrobeReady"
    :tierlist-disabled="true"
    :selected-count="selectedPropIds.size"
    :show-clear-filters="hasFilters"
    skeleton-aspect-class="aspect-square"
    @toggle-edit-mode="toggleEditMode"
    @open-tierlist="noop"
    @retry="loadCatalogProps"
    @retry-wardrobe-mode="retryWardrobe"
    @clear-filters="clearFilters"
    @mark-owned="applyBatchOwnership(true)"
    @mark-unowned="applyBatchOwnership(false)"
    @clear-selection="clearSelection"
  >
    <template #filter-controls>
      <n-select
        :value="compendiumSection"
        :options="compendiumSectionOptions"
        :render-label="renderIconSelectOptionLabel"
        size="small"
        class="w-full self-start sm:w-40"
        :show-checkmark="false"
        :clearable="false"
        @update:value="handleCompendiumSectionChange"
      />

      <CompendiumQualityFilter
        v-model:value="qualityFilter"
        :quality-options="[6, 5, 4, 3]"
      />

      <n-select
        v-model:value="ownershipFilter"
        :options="ownershipOptions"
        :render-label="renderIconSelectOptionLabel"
        size="small"
        class="w-full self-start sm:w-40"
        :show-checkmark="false"
        :clearable="false"
        :disabled="!isWardrobeReady"
      />
    </template>

    <template #filter-row>
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-6">
        <n-input
          v-model:value="searchQuery"
          clearable
          size="small"
          class="col-span-2 min-w-0"
          :placeholder="t('compendium.prop_search_placeholder')"
          :aria-label="t('compendium.prop_search_placeholder')"
        >
          <template #prefix>
            <n-icon><Search /></n-icon>
          </template>
        </n-input>

        <n-select
          v-model:value="versionFilter"
          :options="versionOptions"
          :render-label="renderVersionOptionLabel"
          size="small"
          class="min-w-0 sm:col-span-2"
          clearable
          filterable
          :show-checkmark="false"
          :placeholder="t('compendium.filter_version')"
        />

        <n-select
          v-model:value="sourceFilter"
          :options="sourceOptions"
          size="small"
          class="min-w-0 sm:col-span-2"
          clearable
          :show-checkmark="false"
          :placeholder="t('compendium.filter_obtain')"
        />
      </div>
    </template>

    <template #entry="{ entry, index }">
      <component
        :is="editMode ? 'div' : NuxtLinkLocaleComponent"
        :to="editMode ? undefined : getPropDetailPath(entry.id)"
        class="relative cursor-pointer rounded-lg focus-visible:ring-2 focus-visible:ring-rose-500/70 focus-visible:ring-offset-2 focus-visible:outline-hidden dark:focus-visible:ring-offset-slate-950"
        :class="getListingCardAnimationClass(index)"
        :style="getListingCardAnimationStyle(index)"
        :aria-label="entry.name"
        @click="editMode && handlePropCardClick(entry.id, $event)"
      >
        <div
          class="relative aspect-square overflow-hidden rounded-lg bg-[url('/images/bg.webp')] bg-cover bg-center shadow-md transition-shadow duration-300 hover:shadow-xl"
          :style="
            isPropBatchSelected(entry.id)
              ? getQualityRingStyle(entry.quality)
              : undefined
          "
        >
          <div
            class="absolute inset-0"
            :class="getListingQualityOverlayClass(entry.quality)"
          />

          <NuxtImg
            v-if="!failedImageIds.has(entry.id)"
            :src="entry.image"
            :alt="entry.name"
            class="absolute inset-0 z-10 h-full w-full object-contain p-2 transition-transform duration-500 ease-out hover:scale-110"
            :preset="propImagePreset"
            fit="contain"
            :loading="getListingImageLoading(index)"
            :fetchpriority="getListingImageFetchPriority(index)"
            :sizes="imageSizes"
            @error="markImageFailed(entry.id)"
          />
          <div
            v-else
            class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 p-4 text-center text-white/75"
          >
            <n-icon :size="isThumbnailView ? 24 : 38"><Box /></n-icon>
          </div>

          <div
            v-if="editMode"
            class="absolute flex flex-col items-start gap-1"
            :class="overlayCornerClasses['top-left']"
          >
            <n-checkbox
              v-if="editMode"
              :checked="isPropBatchSelected(entry.id)"
              :theme-overrides="
                getWardrobeSelectionCheckboxTheme(entry.quality)
              "
              :aria-label="t('common.select')"
              @click.stop
              @update:checked="
                (checked) => updatePropSelection(entry.id, checked)
              "
            />
          </div>

          <div
            class="absolute"
            :class="overlayCornerClasses['top-right']"
            @click.stop
          >
            <n-tag
              v-if="!editMode && !isThumbnailView"
              round
              size="small"
              :bordered="false"
              :color="getQualityTagTheme(entry.quality)"
              class="backdrop-blur-xs"
            >
              <span class="flex items-center gap-1">
                {{ entry.quality }}
                <n-icon><Star /></n-icon>
              </span>
            </n-tag>
            <WardrobeOwnedButton
              v-else-if="wardrobeInitialized && editMode"
              :owned="isPropOwned(entry.id)"
              :disabled="!isWardrobeReady"
              :loading="togglingPropIds.has(entry.id)"
              :quality="entry.quality"
              variant="overlay"
              @toggle="toggleVisibleProp(entry.id)"
            />
          </div>

          <div
            v-if="
              wardrobeInitialized &&
              !hideOwnershipStatus &&
              isPropOwned(entry.id)
            "
            class="absolute"
            :class="overlayCornerClasses.wardrobe"
            @click.stop
          >
            <WardrobeStatusBadge
              status="owned"
              :quality="entry.quality"
            />
          </div>

          <div
            :class="
              isThumbnailView
                ? [propNameFadeThumbnailClass, 'pr-6']
                : [propNameFadeStandardClass, 'p-2', 'pr-8']
            "
          >
            <p
              class="font-semibold text-white"
              :class="
                isThumbnailView
                  ? 'line-clamp-2 w-full min-w-0 text-left text-[10px] leading-snug'
                  : 'line-clamp-2 text-xs leading-snug sm:text-sm'
              "
            >
              {{ entry.name }}
            </p>
          </div>
        </div>
      </component>
    </template>
  </CompendiumListingPage>
</template>

<script setup lang="ts">
  import {
    Box,
    CheckCircle,
    DotCircle,
    ListAlt,
    PaintBrush,
    Paw,
    Search,
    Star,
    TimesCircle,
    Tshirt,
  } from '@vicons/fa'
  import { NIcon } from 'naive-ui'
  import type { SelectOption } from 'naive-ui'

  definePageMeta({ key: 'props-listing' })

  type OwnershipFilter = 'all' | 'owned' | 'missing'
  type BatchScope = 'selected' | 'page' | 'all'
  type CompendiumSection = 'outfits' | 'items' | 'momo' | 'makeups' | 'props'
  const PROP_SOURCES = [
    'resonance',
    'starlit',
    'store',
    'event',
    'home',
  ] as const
  type IconSelectOption = SelectOption & { icon: Component }
  type PropListingEntry = PropCatalogEntry & {
    name: string
    image: string
  }

  const { t } = useI18n()
  const route = useRoute()
  const router = useRouter()
  const localePath = useLocalePath()
  const message = useMessage()
  const { getImageSrc } = imageProvider()
  const catalog = useCatalogIndex()
  const NuxtLinkLocaleComponent = resolveComponent('NuxtLinkLocale')

  const resolveNumberQuery = (value: unknown) => {
    const parsed = Number(Array.isArray(value) ? value[0] : value)
    return Number.isFinite(parsed) ? parsed : null
  }
  const resolveStringQuery = (value: unknown) =>
    String(Array.isArray(value) ? (value[0] ?? '') : (value ?? ''))
  const resolveEnumQuery = <T extends string>(
    value: unknown,
    values: readonly T[],
    fallback: T
  ) => {
    const normalized = String(Array.isArray(value) ? value[0] : value || '')
    return values.includes(normalized as T) ? (normalized as T) : fallback
  }
  const resolveVersionQuery = (value: unknown) => {
    const version = resolveStringQuery(value)
    return /^\d+\.(?:\d+|x)$/i.test(version) ||
      isListingMissingFilterValue(version)
      ? version
      : null
  }
  const resolveSourceQuery = (value: unknown) => {
    const source = resolveStringQuery(value)
    if (isListingMissingFilterValue(source)) return source
    if (resolvePropSourceFromObtainGroupKey(source)) return source
    return PROP_SOURCES.includes(source as PropSource)
      ? resolveObtainGroupKeyFromPropSource(source as PropSource)
      : null
  }

  const currentPage = ref(
    Math.max(1, resolveNumberQuery(route.query.page) || 1)
  )
  const {
    isThumbnailView,
    hideOwnershipStatus,
    pageSize,
    imageSizes,
    overlayCornerClasses,
  } = provideCompendiumListingView({ currentPage })
  const propImagePreset = computed(() =>
    isThumbnailView.value ? 'squareSm' : 'squareLg'
  )
  const propNameFadeThumbnailClass =
    "absolute inset-x-0 bottom-0 z-20 flex h-12 w-full flex-col justify-end bg-[url('/images/fade.png')] [background-size:100%_100%] bg-bottom bg-no-repeat px-1.5 pb-1"
  const propNameFadeStandardClass =
    "absolute right-0 bottom-0 left-0 z-20 flex h-20 flex-col justify-end bg-[url('/images/fade.png')] [background-size:100%_100%] bg-no-repeat"
  const searchQuery = ref(resolveStringQuery(route.query.search))
  const versionFilter = ref<string | null>(
    resolveVersionQuery(route.query.version)
  )
  const initialSource = resolveStringQuery(route.query.source)
  const normalizedInitialSource = resolveSourceQuery(initialSource)
  const sourceFilter = ref<string | null>(normalizedInitialSource)
  const qualityFilter = ref<number | null>(
    resolveNumberQuery(route.query.quality)
  )
  const ownershipFilter = ref<OwnershipFilter>(
    resolveEnumQuery(
      route.query.wardrobe,
      ['all', 'owned', 'missing'] as const,
      'all'
    )
  )
  const editMode = ref(false)
  const batchScope = ref<BatchScope>('selected')
  const selectedPropIds = ref<Set<number>>(new Set())
  const togglingPropIds = ref<Set<number>>(new Set())
  const failedImageIds = ref<Set<number>>(new Set())
  const loading = ref(true)
  const catalogError = ref<Error | null>(null)

  const {
    initialized: wardrobeInitialized,
    error: wardrobeError,
    canMutate: isWardrobeReady,
    init: initWardrobe,
    retry: retryWardrobe,
    isPropOwned,
    togglePropOwned,
    markPropsOwned,
  } = useWardrobe()

  const compendiumSection = 'props' as const
  const compendiumSectionOptions = computed<IconSelectOption[]>(() => [
    { label: t('common.outfits'), value: 'outfits', icon: Tshirt },
    { label: t('common.items'), value: 'items', icon: ListAlt },
    { label: t('common.makeups'), value: 'makeups', icon: PaintBrush },
    { label: t('common.momo'), value: 'momo', icon: Paw },
    { label: t('common.props'), value: 'props', icon: Box },
  ])
  const ownershipOptions = computed<IconSelectOption[]>(() => [
    { label: t('common.all'), value: 'all', icon: DotCircle },
    { label: t('wardrobe.status.owned'), value: 'owned', icon: CheckCircle },
    {
      label: t('wardrobe.status.missing'),
      value: 'missing',
      icon: TimesCircle,
    },
  ])
  const entryCountLabels = computed(() => ({
    singular: t('common.prop'),
    plural: t('common.props'),
  }))

  const renderIconSelectOptionLabel = (option: SelectOption) => {
    const { icon } = option as IconSelectOption
    return h('div', { class: 'flex items-center gap-2' }, [
      h(NIcon, { size: 16 }, { default: () => h(icon) }),
      h('span', null, String(option.label ?? '')),
    ])
  }

  const entries = computed<PropListingEntry[]>(() =>
    catalog.props.value
      .filter((entry) => entry.variantRootId === undefined)
      .map((entry) => ({
        ...entry,
        name: t(`prop.${entry.id}.name`),
        image: getImageSrc('prop', entry.id),
      }))
  )
  const availableVersions = computed(() =>
    Array.from(
      new Set(
        entries.value
          .map((entry) => entry.version)
          .filter((version): version is string => !!version)
      )
    )
  )
  const versionOptions = computed(() => [
    ...createVersionFilterOptions(availableVersions.value, (version) => {
      const key = `version.${version}`
      const translated = t(key)
      return translated === key ? version : `${version} - ${translated}`
    }),
    ...(SHOW_LISTING_MISSING_FILTER_OPTIONS
      ? [
          {
            label: t('compendium.missing_value'),
            value: LISTING_MISSING_FILTER_VALUE,
          },
        ]
      : []),
  ])
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
  const sourceOptions = computed(() => {
    const availableSources = new Set(
      entries.value.flatMap((entry) => entry.sources ?? [])
    )
    const options = PROP_SOURCES.filter((source) =>
      availableSources.has(source)
    ).map((source) => {
      const labelKey = resolvePropSourceLabelKey(source)
      const translated = labelKey ? t(labelKey) : source
      const value = resolveObtainGroupKeyFromPropSource(source)
      return {
        label: labelKey && translated !== labelKey ? translated : value,
        value,
      }
    })

    if (SHOW_LISTING_MISSING_FILTER_OPTIONS) {
      options.push({
        label: t('compendium.missing_value'),
        value: LISTING_MISSING_FILTER_VALUE,
      })
    }

    return options
  })
  const matchesVersionFilter = (version?: string) => {
    if (!versionFilter.value) return true
    if (isListingMissingFilterValue(versionFilter.value)) return !version
    if (!version) return false
    if (versionFilter.value.endsWith('.x')) {
      return version.startsWith(`${versionFilter.value.slice(0, -2)}.`)
    }
    return version === versionFilter.value
  }
  const filteredEntries = computed(() => {
    const query = searchQuery.value.trim().toLocaleLowerCase()
    const selectedSource = sourceFilter.value
      ? resolvePropSourceFromObtainGroupKey(sourceFilter.value)
      : null

    return entries.value.filter((entry) => {
      if (
        qualityFilter.value !== null &&
        entry.quality !== qualityFilter.value
      ) {
        return false
      }
      if (!matchesVersionFilter(entry.version)) return false
      if (
        sourceFilter.value !== null &&
        (isListingMissingFilterValue(sourceFilter.value)
          ? Boolean(entry.sources?.length)
          : !selectedSource || !entry.sources?.includes(selectedSource))
      ) {
        return false
      }
      if (ownershipFilter.value === 'owned' && !isPropOwned(entry.id)) {
        return false
      }
      if (ownershipFilter.value === 'missing' && isPropOwned(entry.id)) {
        return false
      }
      return !query || entry.name.toLocaleLowerCase().includes(query)
    })
  })
  const pagedEntries = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    return filteredEntries.value.slice(start, start + pageSize.value)
  })
  const hasFilters = computed(
    () =>
      searchQuery.value.trim().length > 0 ||
      qualityFilter.value !== null ||
      versionFilter.value !== null ||
      sourceFilter.value !== null ||
      ownershipFilter.value !== 'all'
  )
  const cacheKey = computed(() =>
    JSON.stringify({
      search: searchQuery.value,
      quality: qualityFilter.value,
      version: versionFilter.value,
      source: sourceFilter.value,
      wardrobe: ownershipFilter.value,
      page: currentPage.value,
    })
  )

  const loadCatalogProps = async () => {
    loading.value = true
    catalogError.value = null
    try {
      await catalog.load(['props'])
    } catch (error) {
      catalogError.value = toError(error, 'Failed to load props catalog')
    } finally {
      loading.value = false
    }
  }

  const handleCompendiumSectionChange = (value: string) => {
    const nextSection = value as CompendiumSection
    if (nextSection === 'props') return

    navigateTo(
      localePath({
        path: `/${nextSection}`,
        query: buildCompendiumSwitchQuery('props', nextSection, {
          quality: qualityFilter.value,
          version: versionFilter.value,
          source: sourceFilter.value,
          wardrobe: ownershipFilter.value,
        }),
      })
    )
  }
  const clearFilters = () => {
    searchQuery.value = ''
    qualityFilter.value = null
    versionFilter.value = null
    sourceFilter.value = null
    ownershipFilter.value = 'all'
  }
  const toggleEditMode = () => {
    editMode.value = !editMode.value
    if (!editMode.value) clearSelection()
  }
  const clearSelection = () => {
    selectedPropIds.value = new Set()
    batchScope.value = 'selected'
  }
  const isPropBatchSelected = (propId: number) =>
    batchScope.value === 'selected' ? selectedPropIds.value.has(propId) : true
  const materializeVisibleSelection = () => {
    selectedPropIds.value = new Set(pagedEntries.value.map((entry) => entry.id))
    batchScope.value = 'selected'
  }
  const updatePropSelection = (propId: number, checked: boolean) => {
    if (batchScope.value !== 'selected') materializeVisibleSelection()
    const nextSelection = new Set(selectedPropIds.value)
    if (checked) nextSelection.add(propId)
    else nextSelection.delete(propId)
    selectedPropIds.value = nextSelection
  }
  const handlePropCardClick = (propId: number, event: MouseEvent) => {
    if ((event.target as HTMLElement).closest('button, input')) return
    updatePropSelection(propId, !isPropBatchSelected(propId))
  }
  const toggleVisibleProp = async (propId: number) => {
    if (togglingPropIds.value.has(propId)) return
    togglingPropIds.value = new Set(togglingPropIds.value).add(propId)
    try {
      await togglePropOwned(propId)
    } catch {
      message.error(t('wardrobe.error.save'))
    } finally {
      const nextIds = new Set(togglingPropIds.value)
      nextIds.delete(propId)
      togglingPropIds.value = nextIds
    }
  }
  const applyBatchOwnership = async (owned: boolean) => {
    const propIds =
      batchScope.value === 'selected'
        ? Array.from(selectedPropIds.value)
        : batchScope.value === 'page'
          ? pagedEntries.value.map((entry) => entry.id)
          : filteredEntries.value.map((entry) => entry.id)
    if (propIds.length === 0) return

    try {
      await markPropsOwned(propIds, owned)
      if (batchScope.value === 'selected') clearSelection()
    } catch {
      message.error(t('wardrobe.error.save'))
    }
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
  const markImageFailed = (propId: number) => {
    failedImageIds.value = new Set(failedImageIds.value).add(propId)
  }
  const noop = () => undefined
  let applyingRouteQuery = false

  const syncRoute = () => {
    const query = {
      ...(searchQuery.value.trim() && { search: searchQuery.value.trim() }),
      ...(qualityFilter.value !== null && { quality: qualityFilter.value }),
      ...(versionFilter.value && { version: versionFilter.value }),
      ...(sourceFilter.value && { source: sourceFilter.value }),
      ...(ownershipFilter.value !== 'all' && {
        wardrobe: ownershipFilter.value,
      }),
      ...(currentPage.value > 1 && { page: currentPage.value }),
    }
    router.replace({ path: localePath('/props'), query })
  }

  const applyRouteQuery = () => {
    applyingRouteQuery = true

    const nextSearch = resolveStringQuery(route.query.search)
    const nextQuality = resolveNumberQuery(route.query.quality)
    const nextVersion = resolveVersionQuery(route.query.version)
    const rawSource = resolveStringQuery(route.query.source)
    const nextSource = resolveSourceQuery(rawSource)
    const nextOwnership = resolveEnumQuery(
      route.query.wardrobe,
      ['all', 'owned', 'missing'] as const,
      'all'
    )
    const nextPage = Math.max(1, resolveNumberQuery(route.query.page) || 1)

    if (searchQuery.value !== nextSearch) searchQuery.value = nextSearch
    if (qualityFilter.value !== nextQuality) qualityFilter.value = nextQuality
    if (versionFilter.value !== nextVersion) versionFilter.value = nextVersion
    if (sourceFilter.value !== nextSource) sourceFilter.value = nextSource
    if (ownershipFilter.value !== nextOwnership) {
      ownershipFilter.value = nextOwnership
    }
    if (currentPage.value !== nextPage) currentPage.value = nextPage

    void nextTick(() => {
      applyingRouteQuery = false
      if (nextSource && nextSource !== rawSource) syncRoute()
    })
  }

  watch(
    [searchQuery, qualityFilter, versionFilter, sourceFilter, ownershipFilter],
    () => {
      if (applyingRouteQuery) return
      currentPage.value = 1
      syncRoute()
    }
  )
  watch(currentPage, () => {
    if (!applyingRouteQuery) syncRoute()
  })
  watch(() => route.fullPath, applyRouteQuery)
  watch(
    () => filteredEntries.value.length,
    () => {
      const maxPage = Math.max(
        1,
        Math.ceil(filteredEntries.value.length / pageSize.value)
      )
      if (currentPage.value > maxPage) currentPage.value = maxPage
    }
  )

  onMounted(() => {
    if (normalizedInitialSource && normalizedInitialSource !== initialSource) {
      syncRoute()
    }
    void loadCatalogProps()
    void initWardrobe()
  })

  useSeoMeta({
    title: () =>
      `${t('common.props')} - ${t('meta.game_title')} - ${t('navigation.title')}`,
    description: () => t('meta.description.props'),
    ogTitle: () => t('common.props'),
    ogDescription: () => t('meta.description.props'),
    twitterTitle: () => t('common.props'),
    twitterDescription: () => t('meta.description.props'),
  })
</script>
