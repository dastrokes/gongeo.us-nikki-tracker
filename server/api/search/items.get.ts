type SearchIndexMetadata = ItemSearchMetadata & {
  [key: string]: unknown
  quality?: number
  style_key?: string
  label_keys?: string[]
  label_ids?: string[]
  obtain_type?: number
}

type PineconeDocumentMatch = Record<string, unknown> & {
  _id?: string | number
  _score?: number
}

type SearchResponse = {
  query: string
  total: number
  data: Array<{
    id: string
    itemId: number | null
    itemType: string | null
    category: string | null
    subcategory: string | null
    score: number
    quality: number | null
    metadata: SearchIndexMetadata | null
  }>
}

const DEFAULT_LIMIT = SEARCH_DEFAULT_LIMIT
const MAX_LIMIT = SEARCH_MAX_LIMIT
const PINECONE_RESULT_FIELDS = [
  'text',
  'item_id',
  'item_type',
  'slot',
  'category',
  'subcategory',
  'quality',
  'style_key',
  'label_ids',
  'obtain_type',
  ...getItemSearchAdvancedFields(),
]
const PINECONE_NON_METADATA_FIELDS = new Set([
  '_id',
  '_score',
  'text',
  'embedding',
])

const normalizeLimit = (value: unknown) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return DEFAULT_LIMIT
  const normalized = Math.floor(parsed)
  return Math.min(Math.max(normalized, 1), MAX_LIMIT)
}

const normalizeRecordId = (value: unknown) => {
  const firstValue = Array.isArray(value) ? value[0] : value
  if (
    firstValue === null ||
    firstValue === undefined ||
    typeof firstValue === 'object'
  )
    return null

  const normalized = String(firstValue).trim()
  return normalized || null
}

const normalizeCatalogFilterResult = (query: Record<string, unknown>) => {
  const filters = normalizeCatalogSearchFilters(query)
  const styleFilter = filters.style ? STYLE_BY_KEY.get(filters.style) : null
  const labelFilter = filters.label ? TAG_BY_KEY.get(filters.label) : null
  const versionPrefixRange = filters.version
    ? getVersionPrefixRange(filters.version)
    : null
  const obtainTypeRange = versionPrefixRange
    ? {
        min: getVersionRangeFromPrefix(versionPrefixRange.min, 2).min,
        max: getVersionRangeFromPrefix(versionPrefixRange.max, 2).max,
      }
    : null
  const obtainIds = filters.source
    ? resolveObtainIdsFromValue(filters.source)
    : null

  return {
    valid:
      (!filters.style || Boolean(styleFilter)) &&
      (!filters.label || Boolean(labelFilter)) &&
      (!filters.version || obtainTypeRange !== null) &&
      (!filters.source || Boolean(obtainIds?.length)),
    filters,
    styleFilter,
    labelFilter,
    obtainTypeRange,
    obtainIds,
  }
}

const buildPineconeMetadataFilter = (
  filterResult: ReturnType<typeof normalizeCatalogFilterResult>
) => {
  const clauses: unknown[] = []
  const { filters, styleFilter, labelFilter, obtainTypeRange, obtainIds } =
    filterResult

  if (filters.itemTypes.length > 0) {
    clauses.push({
      item_type:
        filters.itemTypes.length === 1
          ? { $eq: filters.itemTypes[0] }
          : { $in: filters.itemTypes },
    })
  }

  if (filters.quality !== null) {
    clauses.push({ quality: { $eq: filters.quality } })
  }

  if (styleFilter) {
    clauses.push({ style_key: { $eq: styleFilter.key } })
  }

  if (labelFilter) {
    clauses.push({ label_ids: { $in: [String(labelFilter.id)] } })
  }

  if (obtainTypeRange) {
    clauses.push(
      { obtain_type: { $gte: obtainTypeRange.min } },
      { obtain_type: { $lte: obtainTypeRange.max } }
    )
  }

  if (obtainIds?.length) {
    clauses.push({ obtain_type: { $in: obtainIds } })
  }

  if (clauses.length === 0) return undefined
  return clauses.length === 1 ? clauses[0] : { $and: clauses }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const normalizeNullableString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : undefined
}

const normalizeRuntimeConfigString = (value: unknown) =>
  normalizeNullableString(value) ?? ''

const normalizeItemId = (value: unknown) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

const normalizeMetadata = (metadata: unknown): SearchIndexMetadata | null => {
  if (!isRecord(metadata)) return null

  const legacyMetadata = normalizeItemSearchMetadata(metadata)
  const rawItemType = normalizeNullableString(metadata.item_type)
  const itemType = rawItemType
    ? normalizeItemSearchItemType(rawItemType)
    : undefined

  return {
    ...metadata,
    ...(legacyMetadata ?? {}),
    item_id:
      normalizeItemId(metadata.item_id) ??
      normalizeItemId(legacyMetadata?.item_id) ??
      undefined,
    item_type: itemType,
    category:
      legacyMetadata?.category ??
      normalizeNullableString(metadata.category) ??
      null,
    subcategory:
      legacyMetadata?.subcategory ??
      normalizeNullableString(metadata.subcategory) ??
      null,
    quality:
      typeof metadata.quality === 'number' && Number.isFinite(metadata.quality)
        ? metadata.quality
        : undefined,
  }
}

const compactMetadata = (
  metadata: SearchIndexMetadata | null
): SearchIndexMetadata | null => {
  if (!metadata) return null

  const compactedEntries = Object.entries(metadata).filter(([key, value]) => {
    if (
      key === 'item_id' ||
      key === 'item_type' ||
      key === 'slot' ||
      key === 'category' ||
      key === 'subcategory'
    ) {
      return false
    }

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
    ? (Object.fromEntries(compactedEntries) as SearchIndexMetadata)
    : null
}

const normalizeSearchHit = ({
  id,
  score,
  metadata,
  fallbackId,
}: {
  id: unknown
  score: unknown
  metadata: unknown
  fallbackId: string
}): SearchResponse['data'][number] | null => {
  const normalizedMetadata = normalizeMetadata(metadata)
  const normalizedId = String(id ?? normalizedMetadata?.item_id ?? fallbackId)

  if (!normalizedId.trim()) {
    return null
  }

  return {
    id: normalizedId,
    itemId: normalizeItemId(normalizedMetadata?.item_id ?? id),
    itemType: normalizedMetadata?.item_type ?? null,
    category: normalizedMetadata?.category ?? null,
    subcategory: normalizedMetadata?.subcategory ?? null,
    score: Number.isFinite(Number(score)) ? Number(score) : 0,
    quality:
      typeof normalizedMetadata?.quality === 'number'
        ? normalizedMetadata.quality
        : null,
    metadata: compactMetadata(normalizedMetadata),
  }
}

const queryPineconeSearch = async ({
  pineconeApiKey,
  pineconeSearchHost,
  normalizedQuery,
  recordId,
  limit,
  searchNamespace,
  metadataFilter,
}: {
  pineconeApiKey: string
  pineconeSearchHost: string
  normalizedQuery?: string
  recordId?: string
  limit: number
  searchNamespace: string
  metadataFilter?: unknown
}): Promise<SearchResponse['data']> => {
  let matches: PineconeDocumentMatch[]

  if (recordId) {
    const embedding = await fetchPineconeDocumentEmbedding({
      apiKey: pineconeApiKey,
      host: pineconeSearchHost,
      namespace: searchNamespace,
      id: recordId,
    })
    if (!embedding) return []

    matches = await searchPineconeDocuments({
      apiKey: pineconeApiKey,
      host: pineconeSearchHost,
      namespace: searchNamespace,
      scoreBy: { type: 'dense_vector', field: 'embedding', values: embedding },
      topK: limit,
      filter: metadataFilter,
      includeFields: PINECONE_RESULT_FIELDS,
    })
  } else {
    const query = normalizedQuery ?? ''
    const [embedding] = await embedPineconeTexts({
      apiKey: pineconeApiKey,
      texts: [query],
      inputType: 'query',
    })
    if (!embedding) {
      throw new Error('Pinecone did not return a query embedding')
    }
    const candidateLimit = Math.min(limit * 4, MAX_LIMIT)
    const [lexicalMatches, denseMatches] = await Promise.all([
      searchPineconeDocuments({
        apiKey: pineconeApiKey,
        host: pineconeSearchHost,
        namespace: searchNamespace,
        scoreBy: { type: 'text', field: 'text', query },
        topK: candidateLimit,
        filter: metadataFilter,
        includeFields: PINECONE_RESULT_FIELDS,
      }),
      searchPineconeDocuments({
        apiKey: pineconeApiKey,
        host: pineconeSearchHost,
        namespace: searchNamespace,
        scoreBy: {
          type: 'dense_vector',
          field: 'embedding',
          values: embedding,
        },
        topK: candidateLimit,
        filter: metadataFilter,
        includeFields: PINECONE_RESULT_FIELDS,
      }),
    ])
    matches = fusePineconeDocumentMatches({
      lexicalMatches,
      denseMatches,
      limit,
    })
  }

  return matches
    .map((match) => {
      const metadata = Object.fromEntries(
        Object.entries(match).filter(
          ([key]) => !PINECONE_NON_METADATA_FIELDS.has(key)
        )
      )
      return normalizeSearchHit({
        id: match._id,
        score: match._score,
        metadata,
        fallbackId: recordId ?? normalizedQuery ?? '',
      })
    })
    .filter((hit): hit is SearchResponse['data'][number] => Boolean(hit))
}

export default defineCachedApiEventHandler(
  async (event): Promise<SearchResponse> => {
    const query = getQuery(event)
    const rawQuery = query.q?.toString() ?? ''
    const normalizedQuery = normalizeSearchQuery(rawQuery)
    const recordId = normalizeRecordId(
      query.id ?? query.recordId ?? query.record_id
    )
    const limit = normalizeLimit(query.limit)
    const filterResult = normalizeCatalogFilterResult(query)

    if (
      (!normalizedQuery && !recordId) ||
      (!recordId && !filterResult.valid) ||
      (recordId && !filterResult.valid)
    ) {
      return {
        query: '',
        total: 0,
        data: [],
      }
    }

    const runtimeConfig = useRuntimeConfig()
    const searchNamespace = resolveRequestSearchNamespace(event)
    const pineconeApiKey = normalizeRuntimeConfigString(
      runtimeConfig.pineconeApiKey
    )
    const pineconeSearchHost = normalizeRuntimeConfigString(
      runtimeConfig.pineconeSearchHost
    )

    try {
      if (!pineconeApiKey || !pineconeSearchHost) {
        throw createUpstreamUnavailableError('search')
      }

      const data = await queryPineconeSearch({
        pineconeApiKey,
        pineconeSearchHost,
        normalizedQuery,
        recordId: recordId ?? undefined,
        limit,
        searchNamespace,
        metadataFilter: buildPineconeMetadataFilter(filterResult),
      })

      return {
        query: recordId ?? normalizedQuery,
        total: data.length,
        data,
      }
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'statusCode' in error) {
        throw error
      }

      const message = toErrorMessage(error, 'Failed to query search index')
      console.error(
        `Failed to query search index namespace ${searchNamespace}: ${message}`
      )
      throw createUpstreamUnavailableError('search')
    }
  },
  {
    cache: false,
    headers: {
      varyQuery: true,
      varyHeaders: [REQUEST_LOCALE_HEADER],
      varyCookies: [REQUEST_LOCALE_COOKIE],
    },
    profile: 'search',
  }
)
