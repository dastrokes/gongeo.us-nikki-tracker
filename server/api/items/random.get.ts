type RandomItemAttributeRow = {
  category?: string | null
  subcategory?: string | null
  metadata?: Record<string, unknown> | null
}

type RandomItemRow = {
  id: number | null
  quality: number | null
  type: string | null
  obtain_type?: number | null
  item_attributes?: RandomItemAttributeRow | RandomItemAttributeRow[] | null
}

type RandomItemResponse = {
  item: {
    id: number
    quality: number
    type: string
    obtain_type: number | null
    category: string | null
    subcategory: string | null
    metadata: ItemSearchMetadata | null
  } | null
  total: number
}

const BASE_ITEM_ID_MIN = 1020000000
const BASE_ITEM_ID_MAX_EXCLUSIVE = 1022000000

const normalizeRandomQuality = (value: unknown) => {
  const normalized = value?.toString().trim() ?? ''
  if (!normalized || normalized === 'all') return { valid: true, value: null }

  const parsed = Number(normalized)
  return Number.isFinite(parsed)
    ? { valid: true, value: Math.floor(parsed) }
    : { valid: false, value: null }
}

const normalizeRandomItemTypes = (value: unknown) => {
  const normalized = value?.toString().trim() ?? ''
  if (!normalized || normalized === 'all') return []

  return normalized
    .split(',')
    .map((entry) => normalizeItemSearchItemType(entry.trim()))
    .filter(isCatalogSearchableItemType)
}

const normalizeRandomFilterResult = ({
  style,
  label,
  version,
  source,
  qualityValid,
}: {
  style: unknown
  label: unknown
  version: unknown
  source: unknown
  qualityValid: boolean
}) => {
  const styleParam = style?.toString() || null
  const labelParam = label?.toString() || null
  const versionParam = version?.toString() || null
  const sourceParam = source?.toString() || null
  const normalizedStyle = styleParam ? normalizeTraitKey(styleParam) : null
  const normalizedLabel = labelParam ? normalizeTraitKey(labelParam) : null
  const styleFilter = normalizedStyle ? STYLE_BY_KEY.get(normalizedStyle) : null
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
  const obtainIds = sourceParam ? resolveObtainIdsFromValue(sourceParam) : null

  return {
    valid:
      qualityValid &&
      (!styleParam || Boolean(styleFilter)) &&
      (!labelParam || Boolean(labelFilter)) &&
      (!versionParam || obtainTypeRange !== null) &&
      (!sourceParam || Boolean(obtainIds?.length)),
    styleFilter,
    labelFilter,
    obtainTypeRange,
    obtainIds,
  }
}

const getFirstItemAttribute = (
  value: RandomItemRow['item_attributes']
): RandomItemAttributeRow | null =>
  Array.isArray(value) ? (value[0] ?? null) : (value ?? null)

const compactRandomMetadata = (
  metadata: ItemSearchMetadata | null
): ItemSearchMetadata | null => {
  if (!metadata) return null

  const compactedEntries = Object.entries(metadata).filter(([, value]) => {
    if (value === null || value === undefined) {
      return false
    }

    if (Array.isArray(value)) {
      return value.length > 0
    }

    if (typeof value === 'string') {
      return value.trim().length > 0
    }

    return true
  })

  return compactedEntries.length > 0
    ? (Object.fromEntries(compactedEntries) as ItemSearchMetadata)
    : null
}

const toRandomItemResponseItem = (
  row: RandomItemRow
): NonNullable<RandomItemResponse['item']> | null => {
  if (row.id === null || row.quality === null || typeof row.type !== 'string') {
    return null
  }

  const attributes = getFirstItemAttribute(row.item_attributes)
  const metadataItemType =
    typeof attributes?.metadata?.item_type === 'string'
      ? attributes.metadata.item_type
      : null
  const itemType = normalizeItemSearchItemType(metadataItemType ?? row.type)

  return {
    id: row.id,
    quality: row.quality,
    type: itemType,
    obtain_type: row.obtain_type ?? null,
    category: attributes?.category ?? null,
    subcategory: attributes?.subcategory ?? null,
    metadata: compactRandomMetadata(
      normalizeItemSearchMetadata({
        ...(attributes?.metadata ?? {}),
        item_id: row.id,
        item_type: itemType,
        slot: itemType,
        category: attributes?.category ?? null,
        subcategory: attributes?.subcategory ?? null,
      })
    ),
  }
}

export default defineEventHandler(
  async (event): Promise<RandomItemResponse> => {
    setHeader(event, 'Cache-Control', 'no-store')

    const query = getQuery(event)
    const quality = normalizeRandomQuality(query.quality)
    const itemTypes = normalizeRandomItemTypes(
      query.type ?? query.item_type ?? query.slot
    )
    const category =
      normalizeItemSearchTokenKey(query.category?.toString() ?? null) || null
    const subcategory =
      normalizeItemSearchTokenKey(query.subcategory?.toString() ?? null) || null
    const filters = normalizeRandomFilterResult({
      style: query.style,
      label: query.label,
      version: query.version,
      source: query.source ?? query.obtain,
      qualityValid: quality.valid,
    })

    if (!filters.valid) {
      return { item: null, total: 0 }
    }

    const supabase = useSupabaseDataClient()
    const selectAttributes =
      category || subcategory
        ? 'item_attributes!inner(category,subcategory,metadata)'
        : 'item_attributes(category,subcategory,metadata)'

    try {
      const applyFilters = (builder: ReturnType<typeof supabase.from>) => {
        let filtered = builder
          .select(`id,quality,type,obtain_type,${selectAttributes}`, {
            count: 'exact',
          })
          .gte('id', BASE_ITEM_ID_MIN)
          .lt('id', BASE_ITEM_ID_MAX_EXCLUSIVE)

        if (quality.value !== null) {
          filtered = filtered.eq('quality', quality.value)
        }

        if (itemTypes.length === 1) {
          filtered = filtered.eq('type', itemTypes[0])
        } else if (itemTypes.length > 1) {
          filtered = filtered.in('type', itemTypes)
        } else {
          for (const itemType of CATALOG_SEARCH_EXCLUDED_ITEM_TYPES) {
            filtered = filtered.neq('type', itemType)
          }
        }

        if (filters.styleFilter) {
          filtered = filtered.eq('style_key', filters.styleFilter.key)
        }

        if (filters.labelFilter) {
          filtered = filtered.contains('tags', [filters.labelFilter.id])
        }

        if (filters.obtainTypeRange) {
          filtered = filtered
            .gte('obtain_type', filters.obtainTypeRange.min)
            .lte('obtain_type', filters.obtainTypeRange.max)
        }

        if (filters.obtainIds) {
          filtered = filtered.in('obtain_type', filters.obtainIds)
        }

        if (category) {
          filtered = filtered.eq('item_attributes.category', category)
        }

        if (subcategory) {
          filtered = filtered.eq('item_attributes.subcategory', subcategory)
        }

        return filtered
      }

      const { count, error: countError } = await withSupabaseRetry(() =>
        applyFilters(supabase.from('items')).limit(1)
      )

      if (countError) {
        throw countError
      }

      const total = count ?? 0
      if (total <= 0) {
        return { item: null, total: 0 }
      }

      const randomIndex = Math.floor(Math.random() * total)
      const { data, error: itemError } = await withSupabaseRetry(() =>
        applyFilters(supabase.from('items'))
          .order('id', { ascending: true })
          .range(randomIndex, randomIndex)
      )

      if (itemError) {
        throw itemError
      }

      const item = toRandomItemResponseItem(
        ((data as RandomItemRow[] | null) ?? [])[0] ?? {
          id: null,
          quality: null,
          type: null,
        }
      )

      return { item, total }
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'statusCode' in error) {
        throw error
      }

      const message = toErrorMessage(error, 'Failed to fetch random item')
      if (isTransientSupabaseError(error)) {
        console.warn(`Failed to fetch random item: ${message}`)
        throw createUpstreamUnavailableError('random item')
      }
      console.error(`Failed to fetch random item: ${message}`)
      throw createInternalError('random item')
    }
  }
)
