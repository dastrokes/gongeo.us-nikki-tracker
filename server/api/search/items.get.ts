import type { H3Event } from 'h3'
import { useSupabaseDataClient } from '~/composables/useSupabaseClient'
import type { ItemSearchMetadata } from '#shared/types/itemSearch'
import { normalizeItemSearchMetadata } from '#shared/utils/itemSearch'

type SupabaseSearchRow = {
  item_id?: number | string
  item_type?: string | null
  category?: string | null
  subcategory?: string | null
  score?: number | string | null
  metadata?: Record<string, unknown> | null
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
    metadata: ItemSearchMetadata | null
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

const buildSearchHit = ({
  id,
  score,
  metadata,
  data,
}: {
  id: string | number
  score: unknown
  metadata: unknown
  data?: string
}) => {
  const normalizedMetadata = normalizeItemSearchMetadata(metadata)
  const itemId =
    normalizeItemId(normalizedMetadata?.item_id) ?? normalizeItemId(id)

  return {
    id: String(id),
    itemId,
    itemType: normalizedMetadata?.item_type ?? null,
    category: normalizedMetadata?.category ?? null,
    subcategory: normalizedMetadata?.subcategory ?? null,
    score: Number.isFinite(Number(score)) ? Number(score) : 0,
    metadata: normalizedMetadata,
    data,
  }
}

const runSupabaseSearch = async ({
  query,
  limit,
}: {
  query: string
  limit: number
}) => {
  const supabase = useSupabaseDataClient()
  const { data, error } = await withSupabaseRetry(() =>
    supabase.rpc(
      'search_items' as never,
      {
        p_query: query,
        p_limit: limit,
      } as never
    )
  )

  if (error) {
    throw error
  }

  const rows = (data as SupabaseSearchRow[] | null) ?? []

  return rows
    .map((row) =>
      buildSearchHit({
        id: row.item_id ?? query,
        score: row.score,
        metadata: {
          ...(isRecord(row.metadata) ? row.metadata : {}),
          item_id: row.item_id,
          item_type: row.item_type,
          slot: row.item_type,
          category:
            row.category ??
            (isRecord(row.metadata) ? row.metadata.category : null),
          subcategory:
            row.subcategory ??
            (isRecord(row.metadata) ? row.metadata.subcategory : null),
        },
      })
    )
    .filter((hit) => hit.id.length > 0)
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

    try {
      const data = await runSupabaseSearch({
        query: rawQuery,
        limit,
      })

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
      maxAge: 3600,
      name: 'search-items',
      getKey: (event: H3Event) => {
        const version = getGameVersion()
        const query = getQuery(event)
        const q = String(query.q || '')
          .trim()
          .toLowerCase()
        const limit = normalizeLimit(query.limit)
        return `${version}:search:q${q}:l${limit}`
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
