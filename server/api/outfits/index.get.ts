type OutfitRow = {
  id: number | null
  quality: number | null
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
 * API endpoint for fetching paginated outfits
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
        p_style_key: styleFilter?.key ?? null,
        p_label_id: labelFilter?.id ?? null,
        p_obtain_min: obtainTypeRange?.min ?? null,
        p_obtain_max: obtainTypeRange?.max ?? null,
        p_obtain_ids: obtainIds ?? null,
      }
      const { data: rpcData, error: rpcError } = await withSupabaseRetry(() =>
        rpcClient.rpc('list_outfits', rpcParams)
      )

      if (rpcError) {
        throw rpcError
      }

      const pageRows = (rpcData as OutfitRow[] | null) ?? []
      const total = normalizeTotalCount(pageRows[0]?.total_count)
      const totalPages = total ? Math.ceil(total / pageSize) : 0

      if (useCompactPayload && total > TIERLIST_PAGE_SIZE) {
        return {
          data: [],
          total,
          page,
          totalPages,
        }
      }

      if (pageRows.length === 0) {
        return {
          data: [],
          total,
          page,
          totalPages,
        }
      }

      if (useCompactPayload) {
        const compactRows = pageRows.filter(
          (row): row is OutfitRow & { id: number; quality: number } =>
            row.id !== null && row.quality !== null
        )

        return {
          data: compactRows.map((row) => ({
            id: row.id,
            quality: row.quality,
          })),
          total,
          page,
          totalPages,
        }
      }

      const resolvedRows = pageRows.filter(
        (row): row is OutfitRow & { id: number; quality: number } =>
          row.id !== null && row.quality !== null
      )

      return {
        data: resolvedRows.map((row) => ({
          id: row.id,
          quality: row.quality,
          style:
            (row.style_key ? STYLE_BY_KEY.get(row.style_key)?.i18nKey : null) ??
            resolveStyleI18nKeyFromProps(row.props),
          labels: resolveTagI18nKeys(row.tags),
          obtain_type: row.obtain_type ?? null,
        })),
        total,
        page,
        totalPages,
      }
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'statusCode' in error) {
        throw error
      }
      const message = toErrorMessage(error, 'Failed to fetch outfits')
      if (isTransientSupabaseError(error)) {
        console.warn(`Failed to fetch outfits: ${message}`)
        throw createUpstreamUnavailableError('outfits')
      }
      console.error(`Failed to fetch outfits: ${message}`)
      throw createInternalError('outfits')
    }
  },
  {
    cache: {
      maxAge: 60 * 60 * 24 * 30,
      staleMaxAge: 60 * 60 * 24 * 7,
      name: 'outfits-list',
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
        const style = query.style?.toString() || 'all'
        const label = query.label?.toString() || 'all'
        const outfitVersion = query.version?.toString() || 'all'
        const source = query.source
          ? query.source.toString()
          : query.obtain
            ? query.obtain.toString()
            : 'all'
        return `${version}:outfits:p${page}:ps${pageSize}:q${quality}:s${style}:l${label}:v${outfitVersion}:src${source}`
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
