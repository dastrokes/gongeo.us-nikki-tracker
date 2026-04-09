import { useSupabaseDataClient } from '~/composables/useSupabaseClient'
import {
  getActiveItemSearchAdvancedFilters,
  getItemSearchAdvancedFields,
  normalizeItemSearchTokenKey,
  resolveItemSearchAdvancedFilters,
  serializeItemSearchAdvancedFilters,
  sortItemSearchFacetMap,
  sortItemSearchFacetValues,
} from '#shared/utils/itemSearch'
import type {
  ItemSearchAdvancedFacetMap,
  ItemSearchMetadata,
} from '#shared/types/itemSearch'

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
    const qualityParam = query.quality?.toString().trim() ?? ''
    const qualityParsed = qualityParam ? Number(qualityParam) : null
    const invalidQuality =
      qualityParam.length > 0 && !Number.isFinite(qualityParsed)
    const quality = invalidQuality ? null : qualityParsed
    const type = query.type?.toString() || null
    const selectedCategory =
      normalizeItemSearchTokenKey(query.category?.toString() ?? null) || null
    const selectedSubcategory =
      normalizeItemSearchTokenKey(query.subcategory?.toString() ?? null) || null
    const advancedFilters = getActiveItemSearchAdvancedFilters(
      resolveItemSearchAdvancedFilters(
        query as Record<string, unknown>,
        type?.toString() ?? null
      ),
      type?.toString() ?? null
    )
    const styleParam = query.style?.toString() || null
    const labelParam = query.label?.toString() || null
    const versionParam = query.version?.toString() || null
    const sourceParam = query.source
      ? query.source.toString()
      : query.obtain
        ? query.obtain.toString()
        : null
    const normalizedStyle = styleParam ? normalizeTraitKey(styleParam) : null
    const normalizedLabel = labelParam ? normalizeTraitKey(labelParam) : null
    const styleFilter = normalizedStyle
      ? STYLE_BY_KEY.get(normalizedStyle)
      : null
    const labelFilter = normalizedLabel ? TAG_BY_KEY.get(normalizedLabel) : null
    const versionPrefixRange = versionParam
      ? getVersionPrefixRange(versionParam)
      : null
    const obtainTypeRange = versionPrefixRange
      ? {
          min: getVersionRangeFromPrefix(versionPrefixRange.min, 2).min,
          max: getVersionRangeFromPrefix(versionPrefixRange.max, 2).max,
        }
      : null
    const obtainIds = sourceParam
      ? resolveObtainIdsFromValue(sourceParam)
      : null

    if (
      invalidQuality ||
      !type ||
      type === 'all' ||
      (styleParam && !styleFilter) ||
      (labelParam && !labelFilter) ||
      (versionParam && obtainTypeRange === null) ||
      (sourceParam && (!obtainIds || obtainIds.length === 0))
    ) {
      return {
        categories: [],
        subcategories: [],
        advanced: {},
      }
    }

    const supabase = useSupabaseDataClient()
    const rpcClient = supabase as unknown as RpcCapableClient
    const advancedFields = getItemSearchAdvancedFields(type)
    const allowedAdvancedFields = new Set<string>(advancedFields)
    const selectedMetadata = Object.fromEntries(
      Object.entries(advancedFilters).filter(
        (entry): entry is [string, string] => typeof entry[1] === 'string'
      )
    ) as ItemSearchMetadata

    try {
      const { data, error } = await withSupabaseRetry(() =>
        rpcClient.rpc('list_item_facets', {
          p_quality: quality ?? null,
          p_type: type && type !== 'all' ? type : null,
          p_style_key: styleFilter?.key ?? null,
          p_label_id: labelFilter?.id ?? null,
          p_obtain_min: obtainTypeRange?.min ?? null,
          p_obtain_max: obtainTypeRange?.max ?? null,
          p_obtain_ids: obtainIds ?? null,
          p_category: selectedCategory ?? null,
          p_subcategory: selectedSubcategory ?? null,
          p_selected_metadata:
            Object.keys(selectedMetadata).length > 0 ? selectedMetadata : null,
        })
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
        const query = getQuery(event)
        const qualityParam = query.quality?.toString().trim() ?? ''
        const qualityParsed = qualityParam ? Number(qualityParam) : null
        const quality = qualityParam
          ? Number.isFinite(qualityParsed)
            ? qualityParsed
            : 'invalid'
          : 'all'
        const type = query.type?.toString() || 'all'
        const category =
          normalizeItemSearchTokenKey(query.category?.toString() ?? null) ||
          'all'
        const subcategory =
          normalizeItemSearchTokenKey(query.subcategory?.toString() ?? null) ||
          'all'
        const advancedFilters = serializeItemSearchAdvancedFilters(
          resolveItemSearchAdvancedFilters(
            query as Record<string, unknown>,
            query.type?.toString() ?? null
          ),
          query.type?.toString() ?? null
        )
        const style = query.style?.toString() || 'all'
        const label = query.label?.toString() || 'all'
        const itemVersion = query.version?.toString() || 'all'
        const source = query.source
          ? query.source.toString()
          : query.obtain
            ? query.obtain.toString()
            : 'all'

        return `${version}:item-facets:q${quality}:t${type}:c${category}:sc${subcategory}:a${advancedFilters || 'none'}:s${style}:l${label}:v${itemVersion}:src${source}`
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
