type CatalogFacetFilterKey = string | 'ownershipMode'

type CatalogFacetQuery = StaticCatalogListingQuery

type UseCatalogListingFacetsOptions = {
  key: () => string
  query: () => CatalogFacetQuery
  filterKeys: readonly CatalogFacetFilterKey[]
  enabled?: () => boolean
}

type CatalogFacetEntries = Record<
  string,
  Array<ItemListEntry | OutfitListEntry | MomoListEntry>
>

type CatalogFacetResult = {
  entriesByFilter: CatalogFacetEntries
  cacheKey: string
}

const getCatalogFacetEntry = (
  index: CatalogLocalIndex,
  entity: StaticCatalogListingEntity,
  id: number
) => {
  if (entity === 'item') return index.itemById.get(id)
  if (entity === 'outfit') return index.outfitById.get(id)
  if (entity === 'makeup') return index.makeupById.get(id)
  return index.momoById.get(id)
}

/**
 * Builds disjunctive facets for a local catalog listing. Each facet is
 * evaluated with its own filter removed while every other active filter stays
 * in place. This keeps filter menus useful without making the current choice
 * hide its valid alternatives.
 */
export const useCatalogListingFacets = async ({
  key,
  query,
  filterKeys,
  enabled,
}: UseCatalogListingFacetsOptions) => {
  const catalog = useCatalogIndex()
  const attributeMatches = useItemAttributeMatches()

  const createDefaultData = (): CatalogFacetResult => ({
    entriesByFilter: {},
    cacheKey: '',
  })

  const loadFacets = async (): Promise<CatalogFacetResult> => {
    if (import.meta.server || (enabled && !enabled())) {
      return { ...createDefaultData(), cacheKey: key() }
    }

    const currentQuery = query()
    const currentKey = key()
    if (currentQuery.entity === 'item' && filterKeys.includes('piece')) {
      await catalog.load(['items', 'outfitItems'])
    } else {
      await catalog.loadEntity(currentQuery.entity)
    }

    const index = catalog.index.value
    if (!index) throw new Error('Catalog index is unavailable')

    const attributeIdsByFilters = new Map<string, Promise<number[] | null>>()
    const getAttributeMatchingIds = (
      filters: Record<string, unknown>
    ): Promise<number[] | null> => {
      if (
        currentQuery.entity !== 'item' ||
        !itemListingRequiresAttributeMatches(filters)
      ) {
        return Promise.resolve(null)
      }

      const attributeKey = JSON.stringify({
        type: filters.type ?? null,
        category: filters.category ?? null,
        subcategory: filters.subcategory ?? null,
        advanced: getActiveItemSearchAdvancedFilters(
          filters as ItemSearchAdvancedFilters,
          typeof filters.type === 'string' ? filters.type : null
        ),
      })
      const existing = attributeIdsByFilters.get(attributeKey)
      if (existing) return existing

      const request = attributeMatches.fetchMatchingIds(filters)
      attributeIdsByFilters.set(attributeKey, request)
      return request
    }

    const facetEntries = await Promise.all(
      filterKeys.map(async (filterKey) => {
        const filters = Object.fromEntries(
          Object.entries(currentQuery.filters).filter(
            ([key]) =>
              filterKey === 'ownershipMode' ||
              (filterKey === 'source' || filterKey === 'sourceDetail'
                ? key !== 'source' && key !== 'sourceDetail'
                : key !== filterKey)
          )
        )
        const facetQuery: CatalogFacetQuery = {
          ...currentQuery,
          filters,
          page: 1,
          pageSize: Number.MAX_SAFE_INTEGER,
        }

        if (filterKey === 'ownershipMode') {
          facetQuery.ownershipMode = 'all'
        }

        const attributeMatchingIds = await getAttributeMatchingIds(filters)
        const ids = getLocalStaticCatalogListingMatchingIds({
          query: facetQuery,
          index,
          attributeMatchingIds,
        }).ids

        return [
          filterKey,
          ids.flatMap((id) => {
            const entry = getCatalogFacetEntry(index, currentQuery.entity, id)
            return entry ? [entry] : []
          }),
        ] as const
      })
    )

    return {
      entriesByFilter: Object.fromEntries(facetEntries),
      cacheKey: currentKey,
    }
  }

  const refreshKey = computed(key)
  const asyncData = await useAsyncData(
    () => `catalog-listing-facets-${query().entity}`,
    loadFacets,
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

  watch(
    refreshKey,
    () => {
      if (import.meta.client) void asyncData.refresh()
    },
    { immediate: true }
  )

  const isCurrentDataReady = computed(
    () => asyncData.data.value?.cacheKey === refreshKey.value
  )
  const entriesByFilter = computed<CatalogFacetEntries>(() =>
    isCurrentDataReady.value
      ? (asyncData.data.value?.entriesByFilter ?? {})
      : {}
  )

  return {
    ...asyncData,
    entriesByFilter,
    ready: isCurrentDataReady,
  }
}
