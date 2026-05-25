type FacetRpcRow = {
  facet_group?: string | null
  facet_key?: string | null
  facet_value?: string | null
}

type RpcCapableClient = {
  rpc: (
    fn: string,
    args?: Record<string, unknown>
  ) => PromiseLike<{ data: unknown; error: unknown }>
}

/**
 * API endpoint for fetching distinct item-search facet values.
 * Response is intentionally minimal so the client can humanize labels locally.
 */
export default defineCachedApiEventHandler(
  async (event) => {
    const query = getQuery(event)
    const catalogQuery = parseItemFacetsCatalogQuery(query)
    const type = catalogQuery.type

    const supabase = useSupabaseDataClient()
    const rpcClient = supabase as unknown as RpcCapableClient
    const advancedFields = getItemSearchAdvancedFields(type)
    const allowedAdvancedFields = new Set<string>(advancedFields)

    try {
      const { data, error } = await withSupabaseRetry(() =>
        rpcClient.rpc(
          'list_item_facets',
          buildItemFacetsRpcParams(catalogQuery)
        )
      )

      if (error) {
        throw error
      }

      const rows = (data as FacetRpcRow[] | null) ?? []
      const categorySet = new Set<string>()
      const subcategorySet = new Set<string>()
      const advancedFacets: ItemSearchAdvancedFacetMap = {}

      rows.forEach((row) => {
        const facetGroup = row.facet_group?.trim()
        const facetKey = row.facet_key?.trim()
        const facetValue = row.facet_value?.trim()

        if (!facetGroup || !facetKey || !facetValue) {
          return
        }

        if (facetGroup === 'category' && facetKey === 'category') {
          categorySet.add(facetValue)
          return
        }

        if (facetGroup === 'subcategory' && facetKey === 'subcategory') {
          subcategorySet.add(facetValue)
          return
        }

        if (facetGroup !== 'advanced' || !allowedAdvancedFields.has(facetKey)) {
          return
        }

        const field = facetKey as keyof ItemSearchAdvancedFacetMap
        const fieldValues = (advancedFacets[field] ??= [])
        if (!fieldValues.includes(facetValue)) {
          fieldValues.push(facetValue)
        }
      })

      const categories = sortItemSearchFacetValues(Array.from(categorySet))
      const subcategories = sortItemSearchFacetValues(
        Array.from(subcategorySet)
      )
      const advanced = sortItemSearchFacetMap(advancedFacets)

      return {
        categories,
        subcategories,
        advanced,
      }
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'statusCode' in error) {
        throw error
      }

      const message = toErrorMessage(error, 'Failed to fetch item facets')
      if (isTransientSupabaseError(error)) {
        console.warn(`Failed to fetch item facets: ${message}`)
        throw createUpstreamUnavailableError('item facets')
      }

      console.error(`Failed to fetch item facets: ${message}`)
      throw createInternalError('item facets')
    }
  },
  {
    cache: {
      maxAge: 60 * 60 * 24 * 30,
      staleMaxAge: 60 * 60 * 24 * 7,
      name: 'item-facets',
      getKey: (event) => {
        const version = getGameVersion()
        const query = parseItemFacetsCatalogQuery(getQuery(event))
        return buildItemCatalogCacheKey('item-facets', query, version)
      },
      swr: true,
    },
    headers: {
      varyQuery: true,
      varyHeaders: [GAME_VERSION_HEADER],
    },
    profile: 'catalog',
  }
)
