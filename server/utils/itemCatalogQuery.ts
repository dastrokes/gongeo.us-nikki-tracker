export type NormalizedItemFacetQuery = {
  quality: number | null
  type: string
  category: string | null
  subcategory: string | null
  styleKey: string | null
  labelId: number | null
  versionRange: { min: number; max: number } | null
  sourceIds: number[] | null
  metadata: Record<string, string | string[]> | null
}

export type NormalizedItemAttributeMatchQuery = {
  type: string
  category: string | null
  subcategory: string | null
  metadata: Record<string, string | string[]> | null
}

const ALLOWED_ITEM_QUALITIES = new Set([2, 3, 4, 5])
const ALLOWED_VERSION_FILTERS = new Set(
  getVersionFilters(
    Array.from(
      new Set(
        OBTAIN_GROUPS.flatMap((group) =>
          group.ids
            .map((id) => getVersionFromId(id))
            .filter((version): version is string => Boolean(version))
        )
      )
    )
  )
)

const BASE_FILTER_KEYS = [
  'quality',
  'type',
  'category',
  'subcategory',
  'style',
  'label',
  'version',
  'source',
] as const

const stringifyCacheValue = (value: unknown) => {
  if (value === null || value === undefined) return 'all'
  if (Array.isArray(value)) return value.length > 0 ? value.join(',') : 'all'
  return String(value)
}

const stringifyMetadataCacheValue = (
  metadata: NormalizedItemFacetQuery['metadata']
) => {
  if (!metadata) return 'none'

  const normalized = Object.fromEntries(
    Object.keys(metadata)
      .sort((left, right) => left.localeCompare(right))
      .map((key) => {
        const value = metadata[key]
        return [
          key,
          Array.isArray(value)
            ? [...value].sort((left, right) => left.localeCompare(right))
            : value,
        ]
      })
  )

  return encodeURIComponent(JSON.stringify(normalized))
}

const parseItemTypeFilter = (value: unknown) => {
  const raw = parseOptionalStringFilter(value)
  if (raw === null) {
    throw createCatalogBadRequestError('type is required')
  }

  const normalizedType = normalizeItemSearchItemType(raw)
  if (!isSupportedItemSearchItemType(raw)) {
    throw createCatalogBadRequestError('type must be a supported item type')
  }

  return normalizedType
}

const parseQualityFilter = (value: unknown) => {
  const quality = parseOptionalNumberFilter(value, 'quality')
  if (quality !== null && !ALLOWED_ITEM_QUALITIES.has(quality)) {
    throw createCatalogBadRequestError('quality must be one of: 2, 3, 4, 5')
  }
  return quality
}

const parseStyleFilter = (value: unknown) => {
  const raw = parseOptionalStringFilter(value)
  if (raw === null) return null

  const normalizedStyle = normalizeTraitKey(raw)
  const style = STYLE_BY_KEY.get(normalizedStyle)
  if (!style) {
    throw createCatalogBadRequestError('style must be a valid style')
  }

  return style.key
}

const parseLabelFilter = (value: unknown) => {
  const raw = parseOptionalStringFilter(value)
  if (raw === null) return null

  const normalizedLabel = normalizeTraitKey(raw)
  const label = TAG_BY_KEY.get(normalizedLabel)
  if (!label) {
    throw createCatalogBadRequestError('label must be a valid label')
  }

  return label.id
}

const parseVersionRangeFilter = (value: unknown) => {
  const raw = parseOptionalStringFilter(value)
  if (raw === null) return null

  if (!ALLOWED_VERSION_FILTERS.has(raw)) {
    throw createCatalogBadRequestError('version must be a valid version filter')
  }

  const versionPrefixRange = getVersionPrefixRange(raw)
  if (versionPrefixRange === null) {
    throw createCatalogBadRequestError('version must be a valid version filter')
  }

  return {
    min: getVersionRangeFromPrefix(versionPrefixRange.min, 2).min,
    max: getVersionRangeFromPrefix(versionPrefixRange.max, 2).max,
  }
}

const parseSourceIdsFilter = (query: Record<string, unknown>) => {
  const source = getSingleQueryValue(query.source)
  const raw = parseOptionalStringFilter(source)
  if (raw === null) return null

  if (raw.includes(',')) {
    const ids: number[] = []
    const seen = new Set<number>()

    raw.split(',').forEach((entry) => {
      const normalized = entry.trim()
      if (!normalized) {
        throw createCatalogBadRequestError(
          'source must be a valid obtain source'
        )
      }

      const entryIds = resolveObtainIdsFromValue(normalized)
      if (!entryIds || entryIds.length === 0) {
        throw createCatalogBadRequestError(
          'source must be a valid obtain source'
        )
      }

      entryIds.forEach((id) => {
        if (seen.has(id)) return
        seen.add(id)
        ids.push(id)
      })
    })

    return ids
  }

  const sourceIds = resolveObtainIdsFromValue(raw)
  if (!sourceIds || sourceIds.length === 0) {
    throw createCatalogBadRequestError('source must be a valid obtain source')
  }

  return sourceIds
}

const parseTaxonomyFilters = (query: Record<string, unknown>, type: string) => {
  const categoryInput = parseOptionalStringFilter(query.category)
  const subcategoryInput = parseOptionalStringFilter(query.subcategory)

  if (categoryInput === null && subcategoryInput === null) {
    return {
      category: null,
      subcategory: null,
    }
  }

  const normalizedCategoryInput = normalizeItemSearchTokenKey(categoryInput)
  const normalizedSubcategoryInput =
    normalizeItemSearchTokenKey(subcategoryInput)
  const validCategories = new Set(
    getItemSearchAttributeValues('category', type)
  )
  const validSubcategories = new Set(
    getItemSearchAttributeValues('subcategory', type)
  )

  if (
    categoryInput !== null &&
    (!normalizedCategoryInput ||
      (!isItemSearchUncategorizedValue(normalizedCategoryInput) &&
        !validCategories.has(normalizedCategoryInput)))
  ) {
    throw createCatalogBadRequestError('category must be a valid category')
  }

  if (
    subcategoryInput !== null &&
    (!normalizedSubcategoryInput ||
      (!isItemSearchUncategorizedValue(normalizedSubcategoryInput) &&
        !validSubcategories.has(normalizedSubcategoryInput)))
  ) {
    throw createCatalogBadRequestError(
      'subcategory must be a valid subcategory'
    )
  }

  const subcategoryParent =
    normalizedSubcategoryInput &&
    !isItemSearchUncategorizedValue(normalizedSubcategoryInput)
      ? getItemSearchSubcategoryParent(type, normalizedSubcategoryInput)
      : null

  if (
    normalizedCategoryInput &&
    normalizedSubcategoryInput &&
    !isItemSearchUncategorizedValue(normalizedSubcategoryInput) &&
    subcategoryParent &&
    subcategoryParent !== normalizedCategoryInput
  ) {
    throw createCatalogBadRequestError(
      'subcategory must belong to the selected category'
    )
  }

  return {
    category: normalizedCategoryInput || subcategoryParent || null,
    subcategory: normalizedSubcategoryInput || null,
  }
}

const parseMetadataFilter = (query: Record<string, unknown>, type: string) => {
  const advancedFilters = getActiveItemSearchAdvancedFilters(
    resolveItemSearchAdvancedFilters(query, type),
    type
  )

  const metadata = Object.fromEntries(
    Object.entries(advancedFilters).filter(
      (entry): entry is [string, string | string[]] =>
        typeof entry[1] === 'string' ||
        (Array.isArray(entry[1]) && entry[1].length > 0)
    )
  )

  return Object.keys(metadata).length > 0 ? metadata : null
}

const rejectUnknownItemFacetQueryParams = (
  query: Record<string, unknown>,
  type: string
) => {
  const allowedKeys = new Set<string>(BASE_FILTER_KEYS)
  getItemSearchAdvancedFields(type).forEach((field) => {
    allowedKeys.add(field)
  })

  rejectUnknownQueryParams(query, allowedKeys)
}

export const parseItemFacetsCatalogQuery = (
  query: Record<string, unknown>
): NormalizedItemFacetQuery => {
  const type = parseItemTypeFilter(query.type)
  rejectUnknownItemFacetQueryParams(query, type)
  const taxonomy = parseTaxonomyFilters(query, type)

  return {
    quality: parseQualityFilter(query.quality),
    type,
    category: taxonomy.category,
    subcategory: taxonomy.subcategory,
    styleKey: parseStyleFilter(query.style),
    labelId: parseLabelFilter(query.label),
    versionRange: parseVersionRangeFilter(query.version),
    sourceIds: parseSourceIdsFilter(query),
    metadata: parseMetadataFilter(query, type),
  }
}

export const parseItemAttributeMatchQuery = (
  query: Record<string, unknown>
): NormalizedItemAttributeMatchQuery => {
  const type = parseItemTypeFilter(query.type)
  rejectUnknownItemFacetQueryParams(query, type)
  const taxonomy = parseTaxonomyFilters(query, type)

  return {
    type,
    category: taxonomy.category,
    subcategory: taxonomy.subcategory,
    metadata: parseMetadataFilter(query, type),
  }
}

const buildBaseRpcParams = (query: NormalizedItemFacetQuery) => ({
  p_quality: query.quality,
  p_type: query.type,
  p_style_key: query.styleKey,
  p_label_id: query.labelId,
  p_obtain_min: query.versionRange?.min ?? null,
  p_obtain_max: query.versionRange?.max ?? null,
  p_obtain_ids: query.sourceIds,
  p_category: query.category,
  p_subcategory: query.subcategory,
})

export const buildItemFacetsRpcParams = (
  query: NormalizedItemFacetQuery
): Record<string, unknown> => ({
  ...buildBaseRpcParams(query),
  p_selected_metadata: query.metadata,
})

export const buildItemAttributeMatchRpcParams = (
  query: NormalizedItemAttributeMatchQuery
): Record<string, unknown> => ({
  p_type: query.type,
  p_category: query.category,
  p_subcategory: query.subcategory,
  p_selected_metadata: query.metadata,
})

export const buildItemCatalogCacheKey = (
  prefix: 'item-facets' | 'item-attributes',
  query: NormalizedItemFacetQuery | NormalizedItemAttributeMatchQuery,
  gameVersion: string
) => {
  const version =
    'versionRange' in query && query.versionRange
      ? `${query.versionRange.min}-${query.versionRange.max}`
      : null
  const parts = [
    gameVersion,
    prefix,
    `q${stringifyCacheValue('quality' in query ? query.quality : null)}`,
    `t${stringifyCacheValue(query.type)}`,
    `c${stringifyCacheValue(query.category)}`,
    `sc${stringifyCacheValue(query.subcategory)}`,
    `a${stringifyMetadataCacheValue(query.metadata)}`,
    `s${stringifyCacheValue('styleKey' in query ? query.styleKey : null)}`,
    `l${stringifyCacheValue('labelId' in query ? query.labelId : null)}`,
    `v${stringifyCacheValue(version)}`,
    `src${stringifyCacheValue('sourceIds' in query ? query.sourceIds : null)}`,
  ]

  return parts.join(':')
}
