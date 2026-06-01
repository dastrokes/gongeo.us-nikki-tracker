type StaticReactiveInput<T> = T | { readonly value: T } | (() => T)

type UseStaticCatalogListingOptions = {
  key: StaticReactiveInput<string>
  query: StaticReactiveInput<StaticCatalogListingQuery>
  wardrobe?: {
    initialized: { readonly value: boolean }
    storageError: { readonly value: Error | null }
    ownedItemIds?: { readonly value: readonly number[] }
    ownedMakeupIds?: { readonly value: readonly number[] }
    ownedMomoIds?: { readonly value: readonly number[] }
    init: () => Promise<void>
    isItemOwned?: (itemId: number) => boolean
    getOutfitProgress?: (itemIds: readonly number[]) => {
      status: OutfitOwnershipMode
    }
    getFullMakeupProgress?: (makeupIds: readonly number[]) => {
      status: MakeupOwnershipMode
    }
  }
  onError?: (error: Error | null) => void
}

type KeyedStaticCatalogListingResult<TEntry> =
  CatalogListingHydratedResult<TEntry> & {
    cacheKey: string
  }

const resolveStaticReactiveInput = <T>(input: StaticReactiveInput<T>) => {
  if (typeof input === 'function') {
    return (input as () => T)()
  }

  if (input && typeof input === 'object' && 'value' in input) {
    return input.value
  }

  return input
}

export const useStaticCatalogListing = async <
  TEntry extends ItemListEntry | OutfitListEntry | MomoListEntry,
>({
  key,
  query,
  wardrobe,
  onError,
}: UseStaticCatalogListingOptions) => {
  const catalogIndex = useCatalogIndex()
  const attributeMatches = useItemAttributeMatches()
  const preferencesReady = useCompendiumListingPreferencesReady()

  const getQuery = () => resolveStaticReactiveInput(query)
  const getKey = () => resolveStaticReactiveInput(key)
  const createDefaultData = (): KeyedStaticCatalogListingResult<TEntry> => {
    const currentQuery = getQuery()
    return {
      ...createEmptyCatalogListingResult<TEntry>(currentQuery.page),
      cacheKey: getKey(),
    }
  }
  const getWardrobeAccess = () => ({
    ownedItemIds: wardrobe?.ownedItemIds?.value,
    ownedMakeupIds: wardrobe?.ownedMakeupIds?.value,
    ownedMomoIds: wardrobe?.ownedMomoIds?.value,
    isItemOwned: wardrobe?.isItemOwned,
    getOutfitProgress: wardrobe?.getOutfitProgress,
    getFullMakeupProgress: wardrobe?.getFullMakeupProgress,
  })
  const ensureWardrobeReady = async () => {
    if (!wardrobe) return
    if (import.meta.client && !wardrobe.initialized.value) {
      await wardrobe.init()
    }

    if (wardrobe.storageError.value) {
      throw wardrobe.storageError.value
    }
  }

  const getRequiredLocalCatalogData = async (
    currentQuery: StaticCatalogListingQuery
  ) => {
    if (import.meta.server) return null

    if (
      currentQuery.entity === 'item' &&
      catalogItemPieceFilterRequiresOutfitItems(
        typeof currentQuery.filters.piece === 'string'
          ? currentQuery.filters.piece
          : null
      )
    ) {
      await catalogIndex.load(['items', 'outfitItems'])
    } else {
      await catalogIndex.loadEntity(currentQuery.entity)
    }

    const attributeMatchingIds =
      currentQuery.entity === 'item' &&
      itemListingRequiresAttributeMatches(currentQuery.filters)
        ? await attributeMatches.fetchMatchingIds(currentQuery.filters)
        : null

    const index = catalogIndex.index.value
    if (!index) {
      throw new Error('Catalog index is unavailable')
    }

    return {
      index,
      attributeMatchingIds,
    }
  }

  const fetchMatchingIds = async () => {
    const currentQuery = getQuery()
    if (currentQuery.ownershipMode && currentQuery.ownershipMode !== 'all') {
      await ensureWardrobeReady()
    }

    const localData = await getRequiredLocalCatalogData(currentQuery)
    if (!localData) {
      return { ids: [] }
    }

    return getLocalStaticCatalogListingMatchingIds({
      query: {
        ...currentQuery,
        wardrobe: getWardrobeAccess(),
      },
      index: localData.index,
      attributeMatchingIds: localData.attributeMatchingIds,
    })
  }

  const fetchListing = async (): Promise<
    KeyedStaticCatalogListingResult<TEntry>
  > => {
    if (!preferencesReady.value) {
      return createDefaultData()
    }

    const currentQuery = getQuery()
    onError?.(null)

    if (import.meta.server) {
      return createDefaultData()
    }

    try {
      if (currentQuery.ownershipMode && currentQuery.ownershipMode !== 'all') {
        await ensureWardrobeReady()
      }

      const currentKey = getKey()
      const localData = await getRequiredLocalCatalogData(currentQuery)
      if (!localData) return createDefaultData()

      return {
        ...getLocalStaticCatalogListing<TEntry>({
          query: {
            ...currentQuery,
            wardrobe: getWardrobeAccess(),
          },
          index: localData.index,
          attributeMatchingIds: localData.attributeMatchingIds,
        }),
        cacheKey: currentKey,
      }
    } catch (caughtError) {
      const normalizedError = toError(
        caughtError,
        `Failed to load ${currentQuery.entity} listing`
      )
      onError?.(normalizedError)
      throw normalizedError
    }
  }

  const refreshKey = computed(getKey)

  const asyncData = await useAsyncData(
    () => `static-catalog-listing-${getQuery().entity}`,
    fetchListing,
    {
      default: createDefaultData,
      dedupe: 'cancel',
      deep: false,
      immediate: false,
      lazy: true,
      server: false,
      watch: [],
    }
  )

  const isCurrentDataReady = computed(
    () =>
      !preferencesReady.value ||
      asyncData.data.value?.cacheKey === refreshKey.value
  )
  const currentData = computed(() =>
    isCurrentDataReady.value ? asyncData.data.value : createDefaultData()
  )
  const currentPending = computed(
    () =>
      preferencesReady.value &&
      (asyncData.pending.value || !isCurrentDataReady.value)
  )

  watch(
    [refreshKey, preferencesReady],
    ([, ready]) => {
      if (import.meta.client && ready) {
        void asyncData.refresh()
      }
    },
    { immediate: true }
  )

  return {
    ...asyncData,
    data: currentData,
    pending: currentPending,
    fetchMatchingIds,
  }
}
