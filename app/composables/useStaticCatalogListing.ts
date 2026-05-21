type StaticReactiveInput<T> = T | { readonly value: T } | (() => T)

type UseStaticCatalogListingOptions = {
  key: StaticReactiveInput<string>
  query: StaticReactiveInput<StaticCatalogListingQuery>
  onError?: (error: Error | null) => void
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

  const fetchListing = async () => {
    const currentQuery = getQuery()
    onError?.(null)

    if (import.meta.server) {
      return createEmptyCatalogListingResult<TEntry>(currentQuery.page)
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

      return getLocalStaticCatalogListing<TEntry>({
        query: currentQuery,
        index,
        attributeMatchingIds,
      })
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

  return await useAsyncData(
    () => `static-catalog-listing-${getQuery().entity}`,
    fetchListing,
    {
      default: () => createEmptyCatalogListingResult<TEntry>(getQuery().page),
      dedupe: 'defer',
      deep: false,
      lazy: true,
      server: false,
      watch: [refreshKey],
    }
  )
}
