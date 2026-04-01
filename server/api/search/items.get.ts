import type { H3Event } from 'h3'
import { hash } from 'ohash'
import type { ItemSearchMetadata } from '#shared/types/itemSearch'
import {
  normalizeItemSearchItemType,
  normalizeItemSearchMetadata,
} from '#shared/utils/itemSearch'
import { resolveRequestLocale } from '../../utils/locale'

type UpstashSearchMetadata = ItemSearchMetadata & {
  [key: string]: unknown
}

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

const normalizeMetadata = (
  metadata: UpstashSearchHit['metadata']
): UpstashSearchMetadata | null => {
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

export default defineCachedApiEventHandler(
  async (event): Promise<SearchResponse> => {
    const query = getQuery(event)
    const rawQuery = query.q?.toString().trim() ?? ''
    const limit = normalizeLimit(query.limit)

    if (!rawQuery) {
      return {
        query: '',
        total: 0,
        data: [],
      }
    }

    const runtimeConfig = useRuntimeConfig()
    const restUrl = runtimeConfig.upstashVectorRestUrl?.trim()
    const restToken = runtimeConfig.upstashVectorRestToken?.trim()

    if (!restUrl || !restToken) {
      throw createUpstreamUnavailableError('search')
    }

    const locale = resolveRequestLocale(event)
    const isEnglish = locale === 'en'
    const endpoint = `${restUrl.replace(/\/$/, '')}/query-data`

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${restToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: rawQuery,
          topK: limit,
          includeMetadata: true,
          includeData: true,
          includeVectors: false,
          ...(!isEnglish ? { queryMode: 'DENSE' } : {}),
        }),
      })

      if (!response.ok) {
        const message = await response.text().catch(() => '')
        throw new Error(
          `Upstash search failed with ${response.status} ${response.statusText}${message ? `: ${message}` : ''}`
        )
      }

      const payload = (await response.json()) as Record<string, unknown>
      const data = extractSearchHits(payload)
        .map((hit) => {
          const metadata = normalizeMetadata(hit.metadata)
          const itemId = normalizeItemId(metadata?.item_id ?? hit.id)

          return {
            id: String(hit.id ?? metadata?.item_id ?? rawQuery),
            itemId,
            itemType: metadata?.item_type ?? null,
            category: metadata?.category ?? null,
            subcategory: metadata?.subcategory ?? null,
            score: Number.isFinite(Number(hit.score)) ? Number(hit.score) : 0,
            metadata,
            data: typeof hit.data === 'string' ? hit.data : undefined,
          }
        })
        .filter((hit) => hit.id.length > 0)

      return {
        query: rawQuery,
        total: data.length,
        data,
      }
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'statusCode' in error) {
        throw error
      }

      const message = toErrorMessage(error, 'Failed to query search index')
      console.error(`Failed to query search index: ${message}`)
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
        const q = String(query.q || '')
          .trim()
          .toLowerCase()
        const qHash = q ? hash(q) : 'empty'
        const limit = normalizeLimit(query.limit)
        const locale = resolveRequestLocale(event)
        const localeBucket = locale === 'en' ? 'en' : 'intl'
        return `${version}:search:${localeBucket}:q${qHash}:l${limit}`
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
