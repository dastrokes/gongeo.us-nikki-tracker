import type { H3Event } from 'h3'
import { hash } from 'ohash'

import { resolveRequestSearchNamespace } from '../../utils/locale'

type SearchIndexMetadata = ItemSearchMetadata & {
  [key: string]: unknown
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
    metadata: SearchIndexMetadata | null
  }>
}

const DEFAULT_LIMIT = 24
const MAX_LIMIT = 48
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
    metadata: compactMetadata(normalizedMetadata),
  }
}

const queryPineconeSearch = async ({
  pineconeApiKey,
  pineconeIndexHost,
  pineconeTextField,
  normalizedQuery,
  limit,
  searchNamespace,
  itemTypeFilters,
}: {
  pineconeApiKey: string
  pineconeIndexHost: string
  pineconeTextField: string
  normalizedQuery: string
  limit: number
  searchNamespace: string
  itemTypeFilters: string[]
}): Promise<SearchResponse['data']> => {
  const endpoint = `${resolvePineconeBaseUrl(pineconeIndexHost)}/records/namespaces/${encodeURIComponent(searchNamespace)}/search`
  let attempt = 0
  let lastError: unknown

  while (true) {
    try {
      const queryBody: {
        query: {
          inputs: { text: string }
          top_k: number
          filter?: unknown
        }
      } = {
        query: {
          inputs: {
            text: normalizedQuery,
          },
          top_k: limit,
        },
      }

      // Add metadata filter for item types if specified
      if (itemTypeFilters.length > 0) {
        queryBody.query = {
          ...queryBody.query,
          filter:
            itemTypeFilters.length === 1
              ? { item_type: { $eq: itemTypeFilters[0] } }
              : {
                  $or: itemTypeFilters.map((type) => ({
                    item_type: { $eq: type },
                  })),
                },
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
          lastError = error
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
            fallbackId: normalizedQuery,
          })
        })
        .filter((hit): hit is SearchResponse['data'][number] => Boolean(hit))
    } catch (error: unknown) {
      if (
        attempt < PINECONE_SEARCH_RETRIES &&
        isRetryablePineconeError(error)
      ) {
        lastError = error
        const delay = PINECONE_SEARCH_RETRY_BASE_DELAY_MS * Math.pow(2, attempt)
        attempt += 1
        await sleep(delay)
        continue
      }

      throw error
    }
  }

  throw lastError
}

export default defineCachedApiEventHandler(
  async (event): Promise<SearchResponse> => {
    const query = getQuery(event)
    const rawQuery = query.q?.toString() ?? ''
    const normalizedQuery = normalizeSearchQuery(rawQuery)
    const limit = normalizeLimit(query.limit)
    const rawItemTypes = query.type?.toString() ?? ''
    const itemTypeFilters = rawItemTypes
      ? rawItemTypes
          .split(',')
          .map((type) => normalizeItemSearchItemType(type.trim()))
          .filter(Boolean)
      : []

    if (!normalizedQuery) {
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
        limit,
        searchNamespace,
        itemTypeFilters,
      })

      return {
        query: normalizedQuery,
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
    cache: {
      maxAge: 60 * 60 * 24,
      staleMaxAge: 60 * 60 * 24,
      name: 'search-items',
      getKey: (event: H3Event) => {
        const version = getGameVersion()
        const query = getQuery(event)
        const q = normalizeSearchCacheKey(query.q)
        const qHash = q ? hash(q) : 'empty'
        const limit = normalizeLimit(query.limit)
        const searchNamespace = resolveRequestSearchNamespace(event)
        const rawItemTypes = query.type?.toString() ?? ''
        const itemTypes = rawItemTypes
          ? rawItemTypes
              .split(',')
              .map((type) => normalizeItemSearchItemType(type.trim()))
              .filter(Boolean)
              .sort()
              .join(',')
          : ''
        const typeHash = itemTypes ? hash(itemTypes) : 'all'
        return `${version}:search:pinecore:${searchNamespace}:q${qHash}:l${limit}:t${typeHash}`
      },
      swr: true,
    },
    headers: {
      varyQuery: true,
      varyHeaders: [GAME_VERSION_HEADER],
    },
    profile: 'search',
  }
)
