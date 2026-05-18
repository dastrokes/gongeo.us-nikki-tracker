type MomoRow = {
  id: number | null
  quality: number | null
  obtain_type?: number | null
  version?: string | null
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
const MOMO_LIST_CACHE_VERSION = 'momo-metadata-v1'

const parsePage = (value: unknown): number => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 1) return 1
  return Math.floor(parsed)
}

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

export default defineCachedApiEventHandler(
  async (event) => {
    const query = getQuery(event)
    const qualityParam = query.quality?.toString().trim() ?? ''
    const qualityParsed = qualityParam ? Number(qualityParam) : null
    const invalidQuality =
      qualityParam.length > 0 && !Number.isFinite(qualityParsed)
    const quality = invalidQuality ? null : qualityParsed
    const sourceParam = query.source
      ? query.source.toString()
      : query.obtain
        ? query.obtain.toString()
        : null
    const versionParam = query.version?.toString().trim() || null
    const page = parsePage(query.page)
    const pageSize = parsePageSize(query.pageSize ?? query.page_size)
    const obtainIds = sourceParam
      ? resolveMomoSourceIdsFromValue(sourceParam)
      : null
    const invalidVersion =
      versionParam !== null &&
      versionParam !== 'all' &&
      getVersionPrefixRange(versionParam) === null

    if (
      invalidQuality ||
      invalidVersion ||
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
        p_obtain_min: null,
        p_obtain_max: null,
        p_obtain_ids: obtainIds ?? null,
        p_version:
          versionParam === null || versionParam === 'all' ? null : versionParam,
      }
      const { data: rpcData, error: rpcError } = await withSupabaseRetry(() =>
        rpcClient.rpc('list_momo', rpcParams)
      )

      if (rpcError) {
        throw rpcError
      }

      const pageRows = (rpcData as MomoRow[] | null) ?? []
      const total = normalizeTotalCount(pageRows[0]?.total_count)
      const totalPages = total ? Math.ceil(total / pageSize) : 0
      const rows = pageRows.filter(
        (row): row is MomoRow & { id: number; quality: number } =>
          typeof row.id === 'number' && typeof row.quality === 'number'
      )

      if (rows.length === 0) {
        return {
          data: [],
          total,
          page,
          totalPages,
        }
      }

      return {
        data: rows.map((row) => ({
          id: row.id,
          quality: row.quality,
          obtain_type: row.obtain_type ?? null,
          version: row.version ?? null,
        })),
        total,
        page,
        totalPages,
      }
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'statusCode' in error) {
        throw error
      }
      const message = toErrorMessage(error, 'Failed to fetch Momo')
      if (isTransientSupabaseError(error)) {
        console.warn(`Failed to fetch Momo: ${message}`)
        throw createUpstreamUnavailableError('Momo')
      }
      console.error(`Failed to fetch Momo: ${message}`)
      throw createInternalError('Momo')
    }
  },
  {
    cache: {
      maxAge: 60 * 60 * 24 * 30,
      staleMaxAge: 60 * 60 * 24 * 7,
      name: 'momo-list',
      getKey: (event) => {
        const version = getGameVersion()
        const query = getQuery(event)
        const page = parsePage(query.page)
        const pageSize = parsePageSize(query.pageSize ?? query.page_size)
        const quality = query.quality?.toString().trim() || 'all'
        const source = query.source
          ? query.source.toString()
          : query.obtain
            ? query.obtain.toString()
            : 'all'
        const momoVersion = query.version?.toString().trim() || 'all'
        return `${version}:${MOMO_LIST_CACHE_VERSION}:momo:p${page}:ps${pageSize}:q${quality}:v${momoVersion}:src${source}`
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
