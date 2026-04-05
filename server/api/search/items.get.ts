import type { H3Event } from 'h3'
import { hash } from 'ohash'
import type { ItemSearchMetadata } from '#shared/types/itemSearch'
import {
  normalizeSearchCacheKey,
  normalizeSearchQuery,
} from '#shared/utils/searchQuery'
import {
  normalizeItemSearchItemType,
  normalizeItemSearchMetadata,
} from '#shared/utils/itemSearch'
import {
  resolveRequestUpstashSearchMode,
  resolveRequestUpstashSearchNamespace,
} from '../../utils/locale'

type UpstashSearchMetadata = ItemSearchMetadata & {
  [key: string]: unknown
}

type PineconeSearchHit = {
  _id?: string | number
  _score?: number
  fields?: Record<string, unknown> | null
}

type SearchProvider = 'pinecore' | 'upstash'

type UpstashSearchHit = {
  id?: string | number
  score?: number
  metadata?: UpstashSearchMetadata | Record<string, unknown> | null
  data?: string
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
    metadata: UpstashSearchMetadata | null
    data?: string
  }>
}

const DEFAULT_LIMIT = 24
const MAX_LIMIT = 48
const DEFAULT_PINECONE_TEXT_FIELD = 'text'
const PINECONE_API_VERSION = '2026-04'
const PINECONE_TEXT_FIELD_FALLBACKS = ['text', 'chunk_text']

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

const normalizeMetadata = (metadata: unknown): UpstashSearchMetadata | null => {
  if (!isRecord(metadata)) return null

  const legacyMetadata = normalizeItemSearchMetadata(metadata)
  const rawItemType = normalizeNullableString(
    metadata.item_type ?? metadata.slot
  )
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
    slot: itemType,
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

const resolveConfiguredSearchProvider = (
  value: unknown
): SearchProvider | null => {
  const normalized = normalizeRuntimeConfigString(value).toLowerCase()
  if (normalized === 'pinecore' || normalized === 'upstash') {
    return normalized
  }
  return null
}

const resolvePineconeBaseUrl = (host: string) => {
  const normalized = host.trim().replace(/\/$/, '')
  return /^https?:\/\//i.test(normalized) ? normalized : `https://${normalized}`
}

const normalizeSearchHit = ({
  id,
  score,
  metadata,
  data,
  fallbackId,
}: {
  id: unknown
  score: unknown
  metadata: unknown
  data?: unknown
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
    metadata: normalizedMetadata,
    data: typeof data === 'string' ? data : undefined,
  }
}

const extractSearchHits = (
  payload: Record<string, unknown>
): UpstashSearchHit[] => {
  if (Array.isArray(payload.result)) {
    return payload.result as UpstashSearchHit[]
  }

  if (isRecord(payload.result) && Array.isArray(payload.result.matches)) {
    return payload.result.matches as UpstashSearchHit[]
  }

  if (Array.isArray(payload.matches)) {
    return payload.matches as UpstashSearchHit[]
  }

  if (Array.isArray(payload.data)) {
    return payload.data as UpstashSearchHit[]
  }

  return []
}

const queryPineconeSearch = async ({
  pineconeApiKey,
  pineconeIndexHost,
  pineconeTextField,
  normalizedQuery,
  limit,
  searchNamespace,
}: {
  pineconeApiKey: string
  pineconeIndexHost: string
  pineconeTextField: string
  normalizedQuery: string
  limit: number
  searchNamespace: string
}): Promise<SearchResponse['data']> => {
  const endpoint = `${resolvePineconeBaseUrl(pineconeIndexHost)}/records/namespaces/${encodeURIComponent(searchNamespace)}/search`
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Api-Key': pineconeApiKey,
      'Content-Type': 'application/json',
      'X-Pinecone-Api-Version': PINECONE_API_VERSION,
    },
    body: JSON.stringify({
      query: {
        inputs: {
          text: normalizedQuery,
        },
        top_k: limit,
      },
    }),
  })

  if (!response.ok) {
    const message = await response.text().catch(() => '')
    throw new Error(
      `Pinecone search failed with ${response.status} ${response.statusText}${message ? `: ${message}` : ''}`
    )
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
      const data = matchedTextField ? fields[matchedTextField] : undefined
      const metadata = Object.fromEntries(
        Object.entries(fields).filter(([key]) => key !== matchedTextField)
      )

      return normalizeSearchHit({
        id: hit._id,
        score: hit._score,
        metadata: Object.keys(metadata).length > 0 ? metadata : null,
        data,
        fallbackId: normalizedQuery,
      })
    })
    .filter((hit): hit is SearchResponse['data'][number] => Boolean(hit))
}

const queryUpstashSearch = async ({
  restUrl,
  restToken,
  normalizedQuery,
  limit,
  searchNamespace,
  searchMode,
}: {
  restUrl: string
  restToken: string
  normalizedQuery: string
  limit: number
  searchNamespace: string
  searchMode: 'HYBRID' | 'DENSE'
}): Promise<SearchResponse['data']> => {
  const endpoint = `${restUrl.replace(/\/$/, '')}/query-data/${encodeURIComponent(searchNamespace)}`
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${restToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      data: normalizedQuery,
      topK: limit,
      includeMetadata: true,
      includeData: true,
      includeVectors: false,
      ...(searchMode === 'DENSE' ? { queryMode: 'DENSE' } : {}),
    }),
  })

  if (!response.ok) {
    const message = await response.text().catch(() => '')
    throw new Error(
      `Upstash search failed with ${response.status} ${response.statusText}${message ? `: ${message}` : ''}`
    )
  }

  const payload = (await response.json()) as Record<string, unknown>
  return extractSearchHits(payload)
    .map((hit) =>
      normalizeSearchHit({
        id: hit.id,
        score: hit.score,
        metadata: hit.metadata,
        data: hit.data,
        fallbackId: normalizedQuery,
      })
    )
    .filter((hit): hit is SearchResponse['data'][number] => Boolean(hit))
}

export default defineCachedApiEventHandler(
  async (event): Promise<SearchResponse> => {
    const query = getQuery(event)
    const rawQuery = query.q?.toString() ?? ''
    const normalizedQuery = normalizeSearchQuery(rawQuery)
    const limit = normalizeLimit(query.limit)

    if (!normalizedQuery) {
      return {
        query: '',
        total: 0,
        data: [],
      }
    }

    const runtimeConfig = useRuntimeConfig()
    const searchProvider = resolveConfiguredSearchProvider(
      runtimeConfig.searchProvider
    )

    if (!searchProvider) {
      throw createUpstreamUnavailableError('search')
    }

    const searchNamespace = resolveRequestUpstashSearchNamespace(event)
    const searchMode = resolveRequestUpstashSearchMode(event)
    const pineconeApiKey = normalizeRuntimeConfigString(
      runtimeConfig.pineconeApiKey
    )
    const pineconeIndexHost = normalizeRuntimeConfigString(
      runtimeConfig.pineconeIndexHost
    )
    const pineconeTextField = DEFAULT_PINECONE_TEXT_FIELD
    const restUrl = normalizeRuntimeConfigString(
      runtimeConfig.upstashVectorRestUrl
    )
    const restToken = normalizeRuntimeConfigString(
      runtimeConfig.upstashVectorRestToken
    )

    try {
      let data: SearchResponse['data']

      if (searchProvider === 'pinecore') {
        if (!pineconeApiKey || !pineconeIndexHost) {
          throw createUpstreamUnavailableError('search')
        }

        data = await queryPineconeSearch({
          pineconeApiKey,
          pineconeIndexHost,
          pineconeTextField,
          normalizedQuery,
          limit,
          searchNamespace,
        })
      } else if (searchProvider === 'upstash') {
        if (!restUrl || !restToken) {
          throw createUpstreamUnavailableError('search')
        }

        data = await queryUpstashSearch({
          restUrl,
          restToken,
          normalizedQuery,
          limit,
          searchNamespace,
          searchMode,
        })
      } else {
        throw createUpstreamUnavailableError('search')
      }

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
        `Failed to query search index namespace ${searchNamespace} mode ${searchMode}: ${message}`
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
        const searchNamespace = resolveRequestUpstashSearchNamespace(event)
        const searchMode = resolveRequestUpstashSearchMode(event)
        const searchProvider =
          resolveConfiguredSearchProvider(useRuntimeConfig().searchProvider) ??
          'unconfigured'
        return `${version}:search:${searchProvider}:${searchNamespace}:${searchMode.toLowerCase()}:q${qHash}:l${limit}`
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
