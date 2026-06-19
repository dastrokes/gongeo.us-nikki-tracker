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
    :selected-count="selectedMomoIds.size"
    :show-clear-filters="hasFilters"
    @toggle-edit-mode="toggleEditMode"
    @open-tierlist="goToTierlist"
    @retry="retryFetch"
    @retry-wardrobe-mode="retryWardrobeMode"
    @clear-filters="clearFilters"
    @mark-owned="applyBatchOwnership(true)"
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
    </template>

    <template #entry="{ entry, index }">
      <div
        class="group relative block cursor-pointer"
        :class="getListingCardAnimationClass(index)"
        :style="getListingCardAnimationStyle(index)"
        @click="handleMomoCardClick(entry.id, $event)"
      >
        <div
          class="relative aspect-2/3 overflow-hidden rounded-lg bg-[url('/images/momo_bg.webp')] bg-cover bg-center shadow-md transition-shadow duration-300 group-hover:shadow-xl"
          :style="
            isMomoBatchSelected(entry.id)
              ? getQualityRingStyle(entry.quality)
              : undefined
          "
        >
          <div
            class="absolute inset-0"
            :class="getListingQualityOverlayClass(entry.quality)"
          ></div>
          <NuxtImg
            :src="entry.image"
            :alt="entry.name"
            class="absolute inset-0 z-10 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
            :preset="imagePreset"
            fit="cover"
            :loading="getListingImageLoading(index)"
            :fetchpriority="getListingImageFetchPriority(index)"
            :sizes="imageSizes"
          />

          <div
            v-if="!isThumbnailView || editMode"
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
                <n-icon>
                  <Star />
                </n-icon>
              </span>
            </n-tag>
            <WardrobeOwnedButton
              v-else-if="wardrobeInitialized && editMode"
              :owned="isMomoOwned(entry.id)"
              :disabled="!isWardrobeReady"
              :loading="isMomoToggleLoading(entry.id)"
              :quality="entry.quality"
              variant="overlay"
              @toggle="toggleVisibleMomoOwned(entry.id)"
            />
          </div>

          <div
            v-if="editMode"
            class="absolute"
            :class="overlayCornerClasses['top-left']"
          >
            <n-checkbox
              :checked="isMomoBatchSelected(entry.id)"
              :theme-overrides="
                getWardrobeSelectionCheckboxTheme(entry.quality)
              "
              :aria-label="t('common.select')"
              @click.stop
              @update:checked="
                (checked) => updateMomoSelection(entry.id, checked)
              "
            />
          </div>

          <div
            v-if="
              wardrobeInitialized &&
              !hideOwnershipStatus &&
              isMomoOwned(entry.id)
            "
            class="absolute"
            :class="overlayCornerClasses.wardrobe"
            @click.stop
          >
            <WardrobeStatusBadge
              status="item-owned"
              :quality="entry.quality"
            />
          </div>

          <div
            :class="
              isThumbnailView
                ? [nameFadeThumbnailClass, 'pr-6']
                : [nameFadeStandardClass, 'p-3', 'pr-8']
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
      </div>
    </template>
  </CompendiumListingPage>
</template>

<script setup lang="ts">
  import {
    Star,
    Tshirt,
    ListAlt,
    PaintBrush,
    Paw,
    CheckCircle,
    TimesCircle,
    DotCircle,
  } from '@vicons/fa'
  import { NIcon } from 'naive-ui'
  import type { SelectOption } from 'naive-ui'

  definePageMeta({
    key: 'momo-listing',
  })

  const { t, locale, getLocaleMessage } = useI18n()
  const dialog = useDialog()
  const message = useMessage()
  const localePath = useLocalePath()
  const route = useRoute()
  const router = useRouter()
  const { getImageSrc } = imageProvider()

  const routeSeoFilter = computed(() =>
    getSeoListRouteFilter(route.path, 'momo')
  )
  const routeSourceFilter = computed(() =>
    routeSeoFilter.value?.kind === 'source'
      ? String(routeSeoFilter.value.value)
      : null
  )
  const routeVersionFilter = computed(() =>
    routeSeoFilter.value?.kind === 'version'
      ? String(routeSeoFilter.value.value)
      : null
  )

  const qualityOptions = [5, 4, 3, 2] as const
  type MomoListingPrimaryFilter = 'version' | 'source' | null
  type MomoWardrobeFilter = 'all' | 'owned' | 'missing'
  type CompendiumSection = 'outfits' | 'items' | 'momo' | 'makeups'
  type IconSelectOption = SelectOption & { icon: Component }
  type BuildListingQueryOptions = {
    primaryFilter?: MomoListingPrimaryFilter
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
  const resolveWardrobeFilter = (value?: string | null): MomoWardrobeFilter => {
    if (value === 'owned' || value === 'missing') return value
    return 'all'
  }

  const obtainOptions = computed(() => createMomoSourceFilterOptions(t))
  const availableObtainValues = computed(() =>
    obtainOptions.value.map((option) => option.value as string)
  )

  const resolveObtain = (value?: string | null) =>
    resolveMomoSourceFilterValue(value, availableObtainValues.value)
  const resolveVersion = (value?: string | null) =>
    resolveVersionFilter(value, availableVersionFilters.value)
  const resolveRouteVersionFilter = () =>
    resolveVersion(routeVersionFilter.value ?? route.query.version?.toString())
  const resolveRouteSourceFilter = () =>
    routeSourceFilter.value ??
    resolveObtain(
      (route.query.source ?? route.query.obtain)?.toString() ?? null
    )
  const resolveRouteQualityFilter = () => parseQuality(route.query.quality)

  const currentPage = ref(parsePage(route.query.page))
  const {
    viewMode,
    pageSize,
    imageSizes,
    imagePreset,
    isThumbnailView,
    hideOwnershipStatus,
    overlayCornerClasses,
    nameFadeThumbnailClass,
    nameFadeStandardClass,
  } = provideCompendiumListingView({ currentPage })
  const qualityFilter = ref<number | null>(resolveRouteQualityFilter())
  const versionFilter = ref<string | null>(resolveRouteVersionFilter())
  const obtainFilter = ref<string | null>(resolveRouteSourceFilter())
  const wardrobeFilter = ref<MomoWardrobeFilter>(
    resolveWardrobeFilter(route.query.wardrobe?.toString() ?? null)
  )
  type BatchScope = 'selected' | 'page' | 'all'
  const editMode = ref(false)
  const batchScope = ref<BatchScope>('selected')
  const selectedMomoIds = ref<Set<number>>(new Set())
  const togglingMomoIds = ref<Set<number>>(new Set())
  const {
    initialized: wardrobeInitialized,
    ownedMomoIds,
    error: storageError,
    canMutate: isWardrobeReady,
    mutationVersion: wardrobeMutationVersion,
    init: initWardrobe,
    retry: retryWardrobeStorage,
    isMomoOwned,
    toggleMomoOwned,
    markMomoOwned,
  } = useWardrobe()
  const { activeRegionScope } = useWardrobeSettings()
  const wardrobeModeError = ref<Error | null>(null)
  const wardrobeError = computed(() =>
    wardrobeFilter.value !== 'all'
      ? (storageError.value ?? wardrobeModeError.value)
      : null
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
    () =>
      qualityFilter.value !== null ||
      versionFilter.value !== null ||
      obtainFilter.value !== null ||
      wardrobeFilter.value !== 'all'
  )

  const cacheKey = computed(
    () =>
      `momo-${qualityFilter.value ?? 'all'}-${
        versionFilter.value ?? 'all'
      }-${obtainFilter.value ?? 'all'}-${wardrobeFilter.value}-${
        activeRegionScope.value
      }-${getListingWardrobeCacheKey(
        wardrobeFilter.value,
        wardrobeMutationVersion.value
      )}-${currentPage.value}-${pageSize.value}-${viewMode.value}`
  )
  const {
    data,
    pending: isListingPending,
    status: requestStatus,
    error,
    refresh: loadData,
    fetchMatchingIds: fetchMatchingMomoIds,
  } = await useStaticCatalogListing<MomoListEntry>({
    key: () => cacheKey.value,
    query: () => ({
      entity: 'momo',
      filters: {
        quality: qualityFilter.value,
        version: versionFilter.value,
        source: obtainFilter.value,
      },
      page: currentPage.value,
      pageSize: pageSize.value,
      ownershipMode: wardrobeFilter.value,
      regionScope: activeRegionScope.value,
    }),
    wardrobe: {
      initialized: wardrobeInitialized,
      storageError,
      ownedMomoIds,
      init: initWardrobe,
    },
    onError: (nextError) => {
      wardrobeModeError.value = nextError
    },
  })

  const entries = computed(() => {
    const rows = (data.value?.data || []) as MomoListEntry[]
    return rows.map((entry) => ({
      id: entry.id,
      quality: entry.quality,
      name: t(`momo.${entry.id}.name`),
      image: getImageSrc('momo', entry.id),
      version: entry.version ?? null,
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
    singular: t('common.momo_entry'),
    plural: t('common.momo'),
  }))
  const totalItems = computed(() => data.value?.total || 0)
  const TIER_ENTRY_LIMIT = 200
  const isTierlistDisabled = computed(
    () =>
      editMode.value ||
      loading.value ||
      !!error.value ||
      totalItems.value > TIER_ENTRY_LIMIT
  )
  const selectionFilterKey = computed(() =>
    JSON.stringify({
      quality: qualityFilter.value,
      version: versionFilter.value,
      obtain: obtainFilter.value,
      wardrobe: wardrobeFilter.value,
    })
  )
  const compendiumSection = 'momo' as const
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
  const wardrobeFilterOptions = computed<IconSelectOption[]>(() => [
    { label: t('common.all'), value: 'all', icon: DotCircle },
    { label: t('wardrobe.status.owned'), value: 'owned', icon: CheckCircle },
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
  const buildListingQuery = ({
    includePage = true,
    primaryFilter = null,
  }: BuildListingQueryOptions = {}) => ({
    ...(qualityFilter.value !== null && { quality: qualityFilter.value }),
    ...(primaryFilter !== 'version' &&
      versionFilter.value && { version: versionFilter.value }),
    ...(primaryFilter !== 'source' &&
      obtainFilter.value && { source: obtainFilter.value }),
    ...(wardrobeFilter.value !== 'all' && { wardrobe: wardrobeFilter.value }),
    ...(includePage && currentPage.value > 1 && { page: currentPage.value }),
  })
  const buildTierlistQuery = () => ({
    mode: 'momo',
    ...(qualityFilter.value !== null && { quality: qualityFilter.value }),
    ...(versionFilter.value && { version: versionFilter.value }),
    ...(obtainFilter.value && { source: obtainFilter.value }),
  })

  const buildListingLocation = () => {
    const versionSlug = resolveSeoVersionSlug(versionFilter.value)
    if (versionSlug) {
      return {
        path: `/momo/version/${versionSlug}`,
        primaryFilter: 'version' as const,
      }
    }

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

  const isMomoBatchSelected = (momoId: number) =>
    batchScope.value === 'selected' ? selectedMomoIds.value.has(momoId) : true

  const materializeVisibleMomoSelection = () => {
    selectedMomoIds.value = new Set(entries.value.map((entry) => entry.id))
    batchScope.value = 'selected'
  }

  const updateMomoSelection = (momoId: number, checked: boolean) => {
    if (batchScope.value !== 'selected') {
      materializeVisibleMomoSelection()
    }

    const nextSelection = new Set(selectedMomoIds.value)
    if (checked) {
      nextSelection.add(momoId)
    } else {
      nextSelection.delete(momoId)
    }
    selectedMomoIds.value = nextSelection
  }

  const clearSelection = () => {
    selectedMomoIds.value = new Set()
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

  const setMomoToggleLoading = (momoId: number, loading: boolean) => {
    const nextIds = new Set(togglingMomoIds.value)
    if (loading) {
      nextIds.add(momoId)
    } else {
      nextIds.delete(momoId)
    }
    togglingMomoIds.value = nextIds
  }

  const isMomoToggleLoading = (momoId: number) =>
    togglingMomoIds.value.has(momoId)

  const toggleVisibleMomoOwned = async (momoId: number) => {
    if (isMomoToggleLoading(momoId)) return

    setMomoToggleLoading(momoId, true)
    try {
      await toggleMomoOwned(momoId)
    } catch {
      message.error(t('wardrobe.error.save'))
    } finally {
      setMomoToggleLoading(momoId, false)
    }
  }

  const isListingCardControlClick = (event: MouseEvent) => {
    const target = event.target
    return (
      target instanceof HTMLElement &&
      Boolean(target.closest('button, input, label, [role="button"]'))
    )
  }

  const handleMomoCardClick = (momoId: number, event: MouseEvent) => {
    if (isListingCardControlClick(event)) return

    if (editMode.value) {
      updateMomoSelection(momoId, !isMomoBatchSelected(momoId))
      return
    }

    navigateTo(localePath(getEntityDetailPath('momo', momoId)))
  }

  const getBatchMomoIds = async () => {
    if (batchScope.value === 'selected') {
      return Array.from(selectedMomoIds.value)
    }

    if (batchScope.value === 'page') {
      return entries.value.map((entry) => entry.id)
    }

    const idResponse = await fetchMatchingMomoIds()
    return idResponse.ids
  }

  const confirmAllMatching = (owned: boolean, count: number) =>
    new Promise<boolean>((resolve) => {
      dialog.warning({
        title: t('common.confirm'),
        content: t(
          owned ? 'wardrobe.confirm.all_owned' : 'wardrobe.confirm.all_unowned',
          { count }
        ),
        positiveText: t('common.confirm'),
        negativeText: t('common.cancel'),
        onPositiveClick: () => resolve(true),
        onNegativeClick: () => resolve(false),
        onClose: () => resolve(false),
      })
    })

  const applyBatchOwnership = async (owned: boolean) => {
    try {
      const momoIds = await getBatchMomoIds()
      if (momoIds.length === 0) return

      if (
        batchScope.value === 'all' &&
        !(await confirmAllMatching(owned, momoIds.length))
      ) {
        return
      }

      await markMomoOwned(momoIds, owned)
      if (batchScope.value === 'selected') {
        clearSelection()
      }
    } catch {
      message.error(t('wardrobe.error.save'))
    }
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
  watch(versionFilter, () => {
    currentPage.value = 1
  })
  watch(obtainFilter, () => {
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
    () => route.query.quality,
    () => {
      const nextQuality = resolveRouteQualityFilter()
      if (nextQuality !== qualityFilter.value) {
        qualityFilter.value = nextQuality
      }
    }
  )
  watch([routeVersionFilter, () => route.query.version], () => {
    const nextVersion = resolveRouteVersionFilter()
    if (nextVersion !== versionFilter.value) {
      versionFilter.value = nextVersion
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
    [qualityFilter, versionFilter, obtainFilter, wardrobeFilter, currentPage],
    () => {
      syncListingRoute()
    }
  )

  onMounted(() => {
    syncListingRoute()
  })

  const clearFilters = () => {
    qualityFilter.value = null
    versionFilter.value = null
    obtainFilter.value = null
    wardrobeFilter.value = 'all'
    currentPage.value = 1
  }

  const retryFetch = () => {
    loadData()
  }

  const retryWardrobeMode = () => {
    wardrobeModeError.value = null
    retryWardrobeStorage()
    loadData()
  }

  const getVersionFilterLabel = (version?: string | null) => {
    if (!version) return null
    const key = `version.${version}`
    const translated = t(key)
    return translated !== key ? `${version} - ${translated}` : version
  }

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
