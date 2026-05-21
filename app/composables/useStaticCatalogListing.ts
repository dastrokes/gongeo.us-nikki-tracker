type StaticReactiveInput<T> = T | { readonly value: T } | (() => T)

type UseStaticCatalogListingOptions = {
  key: StaticReactiveInput<string>
  query: StaticReactiveInput<StaticCatalogListingQuery>
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
  onError,
}: UseStaticCatalogListingOptions) => {
  const catalogIndex = useCatalogIndex()
  const attributeMatches = useItemAttributeMatches()

  const getQuery = () => resolveStaticReactiveInput(query)
  const getKey = () => resolveStaticReactiveInput(key)
  const createDefaultData = (): KeyedStaticCatalogListingResult<TEntry> => {
    const currentQuery = getQuery()
    return {
      ...createEmptyCatalogListingResult<TEntry>(currentQuery.page),
      cacheKey: getKey(),
    }
  }

  const fetchListing = async (): Promise<
    KeyedStaticCatalogListingResult<TEntry>
  > => {
    const currentQuery = getQuery()
    const currentKey = getKey()
    onError?.(null)

    if (import.meta.server) {
      return createDefaultData()
    }

    try {
      await catalogIndex.load()

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
        ...getLocalStaticCatalogListing<TEntry>({
          query: currentQuery,
          index,
          attributeMatchingIds,
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
  }
}
