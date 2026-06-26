type SearchIndexMetadata = ItemSearchMetadata & {
  [key: string]: unknown
  quality?: number
  style_key?: string
  label_keys?: string[]
  label_ids?: string[]
  obtain_type?: number
}

type PineconeSearchHit = {
  _id?: string | number
  _score?: number
  fields?: Record<string, unknown> | null
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
const DEFAULT_PINECONE_TEXT_FIELD = 'text'
const PINECONE_API_VERSION = '2026-04'
const PINECONE_TEXT_FIELD_FALLBACKS = ['text', 'chunk_text']
const PINECONE_SEARCH_RETRIES = 2
const PINECONE_SEARCH_RETRY_BASE_DELAY_MS = 150
const PINECONE_TRANSIENT_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504])
const PINECONE_TRANSIENT_ERROR_HINTS = [
  'aborted',
  'connection reset',
  'eai_again',
  'econnreset',
  'etimedout',
  'fetch failed',
  'network',
  'timeout',
  'timed out',
]

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

const resolvePineconeBaseUrl = (host: string) => {
  const normalized = host.trim().replace(/\/$/, '')
  return /^https?:\/\//i.test(normalized) ? normalized : `https://${normalized}`
}

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

const isRetryablePineconeError = (error: unknown): boolean => {
  const message = toErrorMessage(error, '').toLowerCase()
  return PINECONE_TRANSIENT_ERROR_HINTS.some((hint) => message.includes(hint))
}

const createPineconeSearchError = async (response: Response) => {
  const message = await response.text().catch(() => '')
  return new Error(
    `Pinecone search failed with ${response.status} ${response.statusText}${message ? `: ${message}` : ''}`
  )
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
  pineconeIndexHost,
  pineconeTextField,
  normalizedQuery,
  recordId,
  limit,
  searchNamespace,
  metadataFilter,
}: {
  pineconeApiKey: string
  pineconeIndexHost: string
  pineconeTextField: string
  normalizedQuery?: string
  recordId?: string
  limit: number
  searchNamespace: string
  metadataFilter?: unknown
}): Promise<SearchResponse['data']> => {
  const endpoint = `${resolvePineconeBaseUrl(pineconeIndexHost)}/records/namespaces/${encodeURIComponent(searchNamespace)}/search`
  let attempt = 0

  while (true) {
    try {
      const queryBody: {
        query: {
          inputs?: { text: string }
          id?: string
          top_k: number
          filter?: unknown
        }
      } = {
        query: {
          ...(recordId
            ? { id: recordId }
            : { inputs: { text: normalizedQuery ?? '' } }),
          top_k: limit,
        },
      }

      if (metadataFilter) {
        queryBody.query = {
          ...queryBody.query,
          filter: metadataFilter,
        }
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Api-Key': pineconeApiKey,
          'Content-Type': 'application/json',
          'X-Pinecone-Api-Version': PINECONE_API_VERSION,
        },
        body: JSON.stringify(queryBody),
      })

      if (!response.ok) {
        const error = await createPineconeSearchError(response)
        if (
          attempt < PINECONE_SEARCH_RETRIES &&
          PINECONE_TRANSIENT_STATUS_CODES.has(response.status)
        ) {
          const delay =
            PINECONE_SEARCH_RETRY_BASE_DELAY_MS * Math.pow(2, attempt)
          attempt += 1
          await sleep(delay)
          continue
        }

        throw error
      }

      const payload = (await response.json()) as Record<string, unknown>
      const hits =
        isRecord(payload.result) && Array.isArray(payload.result.hits)
          ? (payload.result.hits as PineconeSearchHit[])
          : []

      return hits
        .map((hit) => {
          const fields = isRecord(hit.fields) ? { ...hit.fields } : {}
          const candidateTextFields = Array.from(
            new Set([pineconeTextField, ...PINECONE_TEXT_FIELD_FALLBACKS])
          )
          const matchedTextField = candidateTextFields.find(
            (field) => typeof fields[field] === 'string'
          )
          const metadata = Object.fromEntries(
            Object.entries(fields).filter(([key]) => key !== matchedTextField)
          )

          return normalizeSearchHit({
            id: hit._id,
            score: hit._score,
            metadata: Object.keys(metadata).length > 0 ? metadata : null,
            fallbackId: recordId ?? normalizedQuery ?? '',
          })
        })
        .filter((hit): hit is SearchResponse['data'][number] => Boolean(hit))
    } catch (error: unknown) {
      if (
        attempt < PINECONE_SEARCH_RETRIES &&
        isRetryablePineconeError(error)
      ) {
        const delay = PINECONE_SEARCH_RETRY_BASE_DELAY_MS * Math.pow(2, attempt)
        attempt += 1
        await sleep(delay)
        continue
      }

      throw error
    }
  }
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
    const pineconeIndexHost = normalizeRuntimeConfigString(
      runtimeConfig.pineconeIndexHost
    )
    const pineconeTextField = DEFAULT_PINECONE_TEXT_FIELD

    try {
      if (!pineconeApiKey || !pineconeIndexHost) {
        throw createUpstreamUnavailableError('search')
      }

      const data = await queryPineconeSearch({
        pineconeApiKey,
        pineconeIndexHost,
        pineconeTextField,
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
