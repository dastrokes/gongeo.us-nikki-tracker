type ReactiveInput<T> = T | { readonly value: T } | (() => T)

type ItemCatalogListingQuery = CatalogListingQuery & {
  entity: 'item'
  ownershipMode: ItemOwnershipMode
}

type OutfitCatalogListingQuery = CatalogListingQuery & {
  entity: 'outfit'
  ownershipMode: OutfitOwnershipMode
}

type CatalogListingQueryInput =
  | ItemCatalogListingQuery
  | OutfitCatalogListingQuery

type CatalogListingWardrobeContext = {
  initialized: { readonly value: boolean }
  storageError: { readonly value: Error | null }
  ownedItemIds?: { readonly value: readonly number[] }
  init: () => Promise<void>
  isItemOwned?: (itemId: number) => boolean
  getOutfitProgress?: (itemIds: readonly number[]) => {
    status: OutfitOwnershipMode
  }
}

type UseCatalogListingOptions = {
  key: ReactiveInput<string>
  query: ReactiveInput<CatalogListingQueryInput>
  wardrobe: CatalogListingWardrobeContext
  onWardrobeModeError?: (error: Error | null) => void
}

type KeyedCatalogListingResult<TEntry> =
  CatalogListingHydratedResult<TEntry> & {
    cacheKey: string
  }

const resolveReactiveInput = <T>(input: ReactiveInput<T>) => {
  if (typeof input === 'function') {
    return (input as () => T)()
  }

  if (input && typeof input === 'object' && 'value' in input) {
    return input.value
  }

  return input
}

export const useCatalogListing = async <
  TEntry extends ItemListEntry | OutfitListEntry,
>({
  key,
  query,
  wardrobe,
  onWardrobeModeError,
}: UseCatalogListingOptions) => {
  const catalogIndex = useCatalogIndex()
  const attributeMatches = useItemAttributeMatches()

  const getQuery = () => resolveReactiveInput(query)
  const getKey = () => resolveReactiveInput(key)
  const createDefaultData = (): KeyedCatalogListingResult<TEntry> => {
    const currentQuery = getQuery()
    return {
      ...createEmptyCatalogListingResult<TEntry>(currentQuery.page),
      cacheKey: getKey(),
    }
  }
  const getWardrobeAccess = () => ({
    ownedItemIds: wardrobe.ownedItemIds?.value,
    isItemOwned: wardrobe.isItemOwned,
    getOutfitProgress: wardrobe.getOutfitProgress,
  })

  const ensureWardrobeReady = async () => {
    if (import.meta.client && !wardrobe.initialized.value) {
      await wardrobe.init()
    }

    if (wardrobe.storageError.value) {
      throw wardrobe.storageError.value
    }
  }

  const getRequiredLocalCatalogData = async (
    currentQuery: CatalogListingQueryInput
  ) => {
    if (import.meta.server) return null

    await catalogIndex.load()
    const index = catalogIndex.index.value
    if (!index) {
      throw new Error('Catalog index is unavailable')
    }

    const attributeMatchingIds =
      currentQuery.entity === 'item' &&
      itemListingRequiresAttributeMatches(currentQuery.filters)
        ? await attributeMatches.fetchMatchingIds(currentQuery.filters)
        : null

    return {
      index,
      attributeMatchingIds,
    }
  }

  const tryFetchLocalListing = async (
    currentQuery: CatalogListingQueryInput
  ): Promise<CatalogListingHydratedResult<TEntry>> => {
    if (currentQuery.ownershipMode !== 'all') {
      await ensureWardrobeReady()
    }

    const localData = await getRequiredLocalCatalogData(currentQuery)
    if (!localData) {
      return createEmptyCatalogListingResult<TEntry>(currentQuery.page)
    }

    return getLocalCatalogListing<TEntry>({
      query: currentQuery,
      index: localData.index,
      attributeMatchingIds: localData.attributeMatchingIds,
      wardrobe: getWardrobeAccess(),
    })
  }

  const tryFetchLocalMatchingIds = async (
    currentQuery: CatalogListingQueryInput
  ): Promise<CatalogListingIdsResult> => {
    if (currentQuery.ownershipMode !== 'all') {
      await ensureWardrobeReady()
    }

    const localData = await getRequiredLocalCatalogData(currentQuery)
    if (!localData) {
      return {
        ids: [],
        outfitItems: currentQuery.entity === 'outfit' ? {} : undefined,
      }
    }

    return getLocalCatalogListingMatchingIds({
      query: currentQuery,
      index: localData.index,
      attributeMatchingIds: localData.attributeMatchingIds,
      wardrobe: getWardrobeAccess(),
    })
  }

  const fetchMatchingIds = async (): Promise<CatalogListingIdsResult> => {
    return tryFetchLocalMatchingIds(getQuery())
  }

  const fetchOutfitRelations = async () => {
    const currentQuery = getQuery()
    if (currentQuery.entity !== 'outfit') return {}

    const localData = await getRequiredLocalCatalogData(currentQuery)
    if (localData) {
      const idResult = getLocalCatalogListingMatchingIds({
        query: currentQuery,
        index: localData.index,
        wardrobe: getWardrobeAccess(),
      })

      return idResult.outfitItems ?? {}
    }

    return {}
  }

  const fetchListing = async (): Promise<KeyedCatalogListingResult<TEntry>> => {
    const currentQuery = getQuery()
    const currentKey = getKey()
    onWardrobeModeError?.(null)

    try {
      return {
        ...(await tryFetchLocalListing(currentQuery)),
        cacheKey: currentKey,
      }
    } catch (caughtError) {
      const normalizedError = toError(
        caughtError,
        `Failed to load ${currentQuery.entity} listing`
      )
      onWardrobeModeError?.(normalizedError)
      throw normalizedError
    }
  }

  const refreshKey = computed(getKey)
  const asyncData = await useAsyncData(
    () => `catalog-listing-${getQuery().entity}`,
    fetchListing,
    {
      default: createDefaultData,
      dedupe: 'cancel',
      deep: false,
      lazy: true,
      server: false,
      watch: [refreshKey],
    }
  )
  const isCurrentDataReady = computed(
    () => asyncData.data.value?.cacheKey === refreshKey.value
  )
  const currentData = computed(() =>
    isCurrentDataReady.value ? asyncData.data.value : createDefaultData()
  )
  const currentPending = computed(
    () => asyncData.pending.value || !isCurrentDataReady.value
  )

  return {
    ...asyncData,
    data: currentData,
    pending: currentPending,
    fetchMatchingIds,
    fetchOutfitRelations,
  }
}
