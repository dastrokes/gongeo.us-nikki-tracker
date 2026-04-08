import { useSupabaseDataClient } from '~/composables/useSupabaseClient'
import {
  getActiveItemSearchAdvancedFilters,
  getItemSearchAdvancedFields,
  getItemSearchAdvancedScalarFields,
  getItemSearchFieldValues,
  ITEM_SEARCH_UNCATEGORIZED_VALUE,
  normalizeItemSearchTokenKey,
  resolveItemSearchAdvancedFilters,
  serializeItemSearchAdvancedFilters,
  sortItemSearchFacetMap,
  sortItemSearchFacetValues,
} from '#shared/utils/itemSearch'
import type {
  ItemSearchAdvancedFacetMap,
  ItemSearchAdvancedField,
  ItemSearchMetadata,
} from '#shared/types/itemSearch'

type FacetRow = {
  item_attributes?:
    | {
        category?: string | null
        subcategory?: string | null
        metadata?: ItemSearchMetadata | null
      }
    | Array<{
        category?: string | null
        subcategory?: string | null
        metadata?: ItemSearchMetadata | null
      }>
    | null
}

type ResolvedFacetRow = {
  category: string
  subcategory: string
  metadata: ItemSearchMetadata | null
}

const BASE_ITEM_PREFIX_RANGES = [
  [1020000000, 1020999999],
  [1021000000, 1021999999],
  [1027000000, 1027999999],
  [1028000000, 1028999999],
  [1029000000, 1029999999],
] as const

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

    const baseItemRangeFilters = BASE_ITEM_PREFIX_RANGES.map(
      ([min, max]) => `and(id.gte.${min},id.lte.${max})`
    ).join(',')

    const supabase = useSupabaseDataClient()
    const advancedFields = getItemSearchAdvancedFields(type)
    const advancedScalarFields = getItemSearchAdvancedScalarFields(type)
    const shouldSelectMetadata = advancedFields.length > 0

    try {
      const facetSelect = shouldSelectMetadata
        ? 'item_attributes!inner(category,subcategory,metadata)'
        : 'item_attributes!inner(category,subcategory)'
      let facetQuery = supabase
        .from('items')
        .select(facetSelect)
        .or(baseItemRangeFilters)
        .eq('type', type)

      if (obtainTypeRange) {
        facetQuery = facetQuery
          .gte('obtain_type', obtainTypeRange.min)
          .lte('obtain_type', obtainTypeRange.max)
      }

      if (quality !== null && quality !== undefined) {
        facetQuery = facetQuery.eq('quality', quality)
      }

      if (obtainIds) {
        facetQuery = facetQuery.in('obtain_type', obtainIds)
      }

      if (styleFilter) {
        facetQuery = facetQuery.eq('style_key', styleFilter.key)
      }

      if (labelFilter) {
        facetQuery = facetQuery.contains('tags', [labelFilter.id])
      }

      const { data, error } = await withSupabaseRetry(() => facetQuery)

      if (error) {
        throw error
      }

      const rows = (data as FacetRow[] | null) ?? []
      const resolvedRows = rows
        .map((row) => {
          const searchAttributes = row.item_attributes
          if (!searchAttributes) return null
          const resolvedSearchAttributes = Array.isArray(searchAttributes)
            ? (searchAttributes[0] ?? null)
            : searchAttributes
          if (!resolvedSearchAttributes) return null

          return {
            category:
              resolvedSearchAttributes.category?.trim() ||
              ITEM_SEARCH_UNCATEGORIZED_VALUE,
            subcategory:
              resolvedSearchAttributes.subcategory?.trim() ||
              ITEM_SEARCH_UNCATEGORIZED_VALUE,
            metadata: resolvedSearchAttributes.metadata ?? null,
          }
        })
        .filter((row): row is ResolvedFacetRow => Boolean(row))
      const selectedAdvancedEntries = advancedScalarFields.flatMap((field) => {
        const selectedValue = advancedFilters[field]
        return selectedValue ? [[field, selectedValue] as const] : []
      })

      const matchesAdvancedSelection = (
        row: ResolvedFacetRow,
        excludedField?: ItemSearchAdvancedField
      ) =>
        selectedAdvancedEntries.every(
          ([field, selectedValue]) =>
            field === excludedField ||
            getItemSearchFieldValues(row.metadata ?? null, field).includes(
              selectedValue
            )
        )

      const categoryMatchedRows = selectedCategory
        ? resolvedRows.filter((row) => row.category === selectedCategory)
        : resolvedRows
      const subcategoryMatchedRows = selectedSubcategory
        ? categoryMatchedRows.filter(
            (row) => row.subcategory === selectedSubcategory
          )
        : categoryMatchedRows

      const categories = sortItemSearchFacetValues(
        Array.from(new Set(resolvedRows.map((row) => row.category)))
      )

      const subcategories = sortItemSearchFacetValues(
        Array.from(new Set(categoryMatchedRows.map((row) => row.subcategory)))
      )

      const advancedFacets: ItemSearchAdvancedFacetMap = {}
      advancedFields.forEach((field) => {
        const values = Array.from(
          new Set(
            subcategoryMatchedRows
              .filter((row) => matchesAdvancedSelection(row, field))
              .flatMap((row) => getItemSearchFieldValues(row.metadata, field))
          )
        )

        if (values.length > 0) {
          advancedFacets[field] = values
        }
      })

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
