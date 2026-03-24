import type { H3Event } from 'h3'

type UpstashSearchMetadata = {
  item_id?: number | string
  item_type?: string
  dominant_colors?: string[]
  accent_colors?: string[]
  primary_color?: string
  secondary_color?: string
  motifs?: string[]
  patterns?: string[]
  subtypes?: string[]
  accepted_facets?: string[]
  review_facets?: string[]
  search_terms?: string[]
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
    score: number
    metadata: UpstashSearchMetadata | Record<string, unknown> | null
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

const normalizeMetadata = (
  metadata: UpstashSearchHit['metadata']
): UpstashSearchMetadata | null => {
  if (!isRecord(metadata)) return null

  const itemId = metadata.item_id
  const normalizedItemId =
    typeof itemId === 'number' || typeof itemId === 'string'
      ? itemId
      : undefined

  return {
    item_id: normalizedItemId,
    item_type:
      typeof metadata.item_type === 'string' ? metadata.item_type : undefined,
    dominant_colors: Array.isArray(metadata.dominant_colors)
      ? metadata.dominant_colors.filter(
          (value): value is string => typeof value === 'string'
        )
      : undefined,
    accent_colors: Array.isArray(metadata.accent_colors)
      ? metadata.accent_colors.filter(
          (value): value is string => typeof value === 'string'
        )
      : undefined,
    primary_color:
      typeof metadata.primary_color === 'string'
        ? metadata.primary_color
        : undefined,
    secondary_color:
      typeof metadata.secondary_color === 'string'
        ? metadata.secondary_color
        : undefined,
    motifs: Array.isArray(metadata.motifs)
      ? metadata.motifs.filter(
          (value): value is string => typeof value === 'string'
        )
      : undefined,
    patterns: Array.isArray(metadata.patterns)
      ? metadata.patterns.filter(
          (value): value is string => typeof value === 'string'
        )
      : undefined,
    subtypes: Array.isArray(metadata.subtypes)
      ? metadata.subtypes.filter(
          (value): value is string => typeof value === 'string'
        )
      : undefined,
    accepted_facets: Array.isArray(metadata.accepted_facets)
      ? metadata.accepted_facets.filter(
          (value): value is string => typeof value === 'string'
        )
      : undefined,
    review_facets: Array.isArray(metadata.review_facets)
      ? metadata.review_facets.filter(
          (value): value is string => typeof value === 'string'
        )
      : undefined,
    search_terms: Array.isArray(metadata.search_terms)
      ? metadata.search_terms.filter(
          (value): value is string => typeof value === 'string'
        )
      : undefined,
  }
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
        }),
      })

      if (!response.ok) {
        const message = await response.text().catch(() => '')
        throw new Error(
          `Upstash search failed with ${response.status} ${response.statusText}${message ? `: ${message}` : ''}`
        )
      }

      const payload = (await response.json()) as Record<string, unknown>
      const rawResults = ((Array.isArray(payload.result) && payload.result) ||
        (Array.isArray(payload.matches) && payload.matches) ||
        (Array.isArray(payload.data) && payload.data) ||
        []) as UpstashSearchHit[]

      const data = rawResults
        .map((hit) => {
          const metadata = normalizeMetadata(hit.metadata)
          const itemIdValue = metadata?.item_id ?? hit.id
          const itemId =
            typeof itemIdValue === 'number'
              ? itemIdValue
              : Number(itemIdValue ?? NaN)

          return {
            id: String(hit.id ?? itemIdValue ?? rawQuery),
            itemId: Number.isFinite(itemId) ? itemId : null,
            score: Number.isFinite(Number(hit.score)) ? Number(hit.score) : 0,
            metadata: isRecord(hit.metadata)
              ? { ...hit.metadata, ...normalizeMetadata(hit.metadata) }
              : null,
            data: hit.data,
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
