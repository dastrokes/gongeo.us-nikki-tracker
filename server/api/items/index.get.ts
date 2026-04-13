import { useSupabaseDataClient } from '~/composables/useSupabaseClient'

type ItemRow = {
  id: number | null
  quality: number | null
  type: string | null
  props: Array<number | string> | null
  style_key?: string | null
  tags: Array<number | string> | null
  obtain_type?: number | null
  total_count?: number | string | null
}

type RpcCapableClient = {
  rpc: (
    fn: string,
    args?: Record<string, unknown>
  ) => PromiseLike<{ data: unknown; error: unknown }>
}

const DEFAULT_PAGE_SIZE = 18
const TIERLIST_PAGE_SIZE = 200
const ALLOWED_PAGE_SIZES = new Set([DEFAULT_PAGE_SIZE, TIERLIST_PAGE_SIZE])

const parsePageSize = (value: unknown): number => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return DEFAULT_PAGE_SIZE
  const normalized = Math.floor(parsed)
  return ALLOWED_PAGE_SIZES.has(normalized) ? normalized : DEFAULT_PAGE_SIZE
}

const normalizeTotalCount = (value: unknown): number => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return 0
  return Math.floor(parsed)
}

/**
 * API endpoint for fetching paginated items
 * App-level caching enabled (30d), Netlify edge caching enabled via Cache-Control header
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
    const category =
      normalizeItemSearchTokenKey(query.category?.toString() ?? null) || null
    const subcategory =
      normalizeItemSearchTokenKey(query.subcategory?.toString() ?? null) || null
    const advancedFilters = getActiveItemSearchAdvancedFilters(
      resolveItemSearchAdvancedFilters(
        query as Record<string, unknown>,
        type?.toString() ?? null
      ),
      type?.toString() ?? null
    )
    const metadataFilter: Record<string, string | string[]> =
      Object.fromEntries(
        Object.entries(advancedFilters).filter(
          (entry): entry is [string, string | string[]] =>
            typeof entry[1] === 'string' ||
            (Array.isArray(entry[1]) && entry[1].length > 0)
        )
      )
    const hasAdvancedFilters = Object.keys(metadataFilter).length > 0
    const styleParam = query.style?.toString() || null
    const labelParam = query.label?.toString() || null
    const versionParam = query.version?.toString() || null
    const sourceParam = query.source
      ? query.source.toString()
      : query.obtain
        ? query.obtain.toString()
        : null
    const page =
      Number.isNaN(Number(query.page)) || Number(query.page) < 1
        ? 1
        : Number(query.page ?? 1)
    const pageSize = parsePageSize(query.pageSize ?? query.page_size)
    const useCompactPayload = pageSize === TIERLIST_PAGE_SIZE
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
      (styleParam && !styleFilter) ||
      (labelParam && !labelFilter) ||
      (versionParam && obtainTypeRange === null) ||
      (sourceParam && (!obtainIds || obtainIds.length === 0))
    ) {
      return {
        data: [],
        total: 0,
        page,
        totalPages: 0,
      }
    }

    const supabase = useSupabaseDataClient()
    const rpcClient = supabase as unknown as RpcCapableClient

    try {
      const rpcParams: Record<string, unknown> = {
        p_page: page,
        p_page_size: pageSize,
        p_quality: quality ?? null,
        p_type: type && type !== 'all' ? type : null,
        p_style_key: styleFilter?.key ?? null,
        p_label_id: labelFilter?.id ?? null,
        p_obtain_min: obtainTypeRange?.min ?? null,
        p_obtain_max: obtainTypeRange?.max ?? null,
        p_obtain_ids: obtainIds ?? null,
        p_category: category ?? null,
        p_subcategory: subcategory ?? null,
        p_metadata: hasAdvancedFilters ? metadataFilter : null,
      }
      const { data: rpcData, error: rpcError } = await withSupabaseRetry(() =>
        rpcClient.rpc('list_items', rpcParams)
      )

      if (rpcError) {
        throw rpcError
      }

      const pageRows = (rpcData as ItemRow[] | null) ?? []

      const total = normalizeTotalCount(pageRows[0]?.total_count)
      const totalPages = total ? Math.ceil(total / pageSize) : 0

      const resolvedRows = pageRows.filter(
        (row): row is ItemRow & { id: number; quality: number; type: string } =>
          row.id !== null &&
          row.quality !== null &&
          typeof row.type === 'string'
      )

      if (resolvedRows.length === 0) {
        return {
          data: [],
          total,
          page,
          totalPages,
        }
      }

      if (useCompactPayload) {
        return {
          data: resolvedRows.map((row) => ({
            id: row.id,
            quality: row.quality,
          })),
          total,
          page,
          totalPages,
        }
      }

      return {
        data: resolvedRows.map((row) => ({
          id: row.id,
          quality: row.quality,
          type: row.type,
          obtain_type: row.obtain_type ?? null,
          style:
            (row.style_key ? STYLE_BY_KEY.get(row.style_key)?.i18nKey : null) ??
            resolveStyleI18nKeyFromProps(row.props),
          labels: resolveTagI18nKeys(row.tags),
        })),
        total,
        page,
        totalPages,
      }
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'statusCode' in error) {
        throw error
      }
      const message = toErrorMessage(error, 'Failed to fetch items')
      if (isTransientSupabaseError(error)) {
        console.warn(`Failed to fetch items: ${message}`)
        throw createUpstreamUnavailableError('items')
      }
      console.error(`Failed to fetch items: ${message}`)
      throw createInternalError('items')
    }
  },
  {
    cache: {
      maxAge: 60 * 60 * 24 * 30,
      staleMaxAge: 60 * 60 * 24 * 7,
      name: 'items-list',
      getKey: (event) => {
        const version = getGameVersion()
        const query = getQuery(event)
        const page = query.page ? Number(query.page) : 1
        const pageSize = parsePageSize(query.pageSize ?? query.page_size)
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
        return `${version}:items:p${page}:ps${pageSize}:q${quality}:t${type}:c${category}:sc${subcategory}:a${advancedFilters || 'none'}:s${style}:l${label}:v${itemVersion}:src${source}`
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
