type MakeupRow = {
  id: number
  quality: number
  type: string
  obtain_type: number | null
  style: string | null
  labels: string[]
}

type MakeupRpcRow = {
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
const MAKEUP_TYPES = [
  'fullMakeup',
  'baseMakeup',
  'eyebrows',
  'eyelashes',
  'contactLenses',
  'lips',
] as const
const MAKEUP_TYPE_SET = new Set<string>(MAKEUP_TYPES)

const parsePageSize = (value: unknown): number => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return DEFAULT_PAGE_SIZE
  const normalized = Math.floor(parsed)
  return normalized === TIERLIST_PAGE_SIZE ? normalized : DEFAULT_PAGE_SIZE
}

const normalizeTotalCount = (value: unknown): number => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return 0
  return Math.floor(parsed)
}

const isMakeupType = (
  value?: string | null
): value is (typeof MAKEUP_TYPES)[number] =>
  typeof value === 'string' && MAKEUP_TYPE_SET.has(value)

export default defineCachedApiEventHandler(
  async (event) => {
    const query = getQuery(event)
    const page =
      Number.isNaN(Number(query.page)) || Number(query.page) < 1
        ? 1
        : Number(query.page ?? 1)
    const pageSize = parsePageSize(query.pageSize ?? query.page_size)
    const typeParam = query.type?.toString() || null
    const type = isMakeupType(typeParam) ? typeParam : null
    const hasInvalidType = Boolean(typeParam && !type)
    const qualityParam = query.quality?.toString().trim() ?? ''
    const qualityParsed = qualityParam ? Number(qualityParam) : null
    const invalidQuality =
      qualityParam.length > 0 && !Number.isFinite(qualityParsed)
    const quality = invalidQuality ? null : qualityParsed
    const styleParam = query.style?.toString() || null
    const versionParam = query.version?.toString() || null
    const sourceParam = query.source
      ? query.source.toString()
      : query.obtain
        ? query.obtain.toString()
        : null
    const normalizedStyle = styleParam ? normalizeTraitKey(styleParam) : null
    const styleFilter = normalizedStyle
      ? STYLE_BY_KEY.get(normalizedStyle)
      : null
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
      hasInvalidType ||
      invalidQuality ||
      (styleParam && !styleFilter) ||
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

    const mapMakeupRows = (rows: MakeupRpcRow[]): MakeupRow[] =>
      rows
        .filter(
          (
            row
          ): row is MakeupRpcRow & {
            id: number
            quality: number
            type: string
          } =>
            row.id !== null &&
            row.quality !== null &&
            typeof row.type === 'string'
        )
        .map((row) => ({
          id: row.id,
          quality: row.quality,
          type: row.type,
          obtain_type: row.obtain_type ?? null,
          style:
            (row.style_key ? STYLE_BY_KEY.get(row.style_key)?.i18nKey : null) ??
            resolveStyleI18nKeyFromProps(row.props),
          labels: resolveTagI18nKeys(row.tags),
        }))

    try {
      const { data: rpcData, error: rpcError } = await withSupabaseRetry(() =>
        rpcClient.rpc('list_makeups', {
          p_page: page,
          p_page_size: pageSize,
          p_quality: quality ?? null,
          p_type: type ?? null,
          p_style_key: styleFilter?.key ?? null,
          p_label_id: null,
          p_obtain_min: obtainTypeRange?.min ?? null,
          p_obtain_max: obtainTypeRange?.max ?? null,
          p_obtain_ids: obtainIds ?? null,
        })
      )

      if (rpcError) {
        throw rpcError
      }

      const rows = (rpcData as MakeupRpcRow[] | null) ?? []
      const total = normalizeTotalCount(rows[0]?.total_count)

      return {
        data: mapMakeupRows(rows),
        total,
        page,
        totalPages: total ? Math.ceil(total / pageSize) : 0,
      }
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'statusCode' in error) {
        throw error
      }
      const message = toErrorMessage(error, 'Failed to fetch makeups')
      if (isTransientSupabaseError(error)) {
        console.warn(`Failed to fetch makeups: ${message}`)
        throw createUpstreamUnavailableError('makeups')
      }
      console.error(`Failed to fetch makeups: ${message}`)
      throw createInternalError('makeups')
    }
  },
  {
    cache: {
      maxAge: 60 * 60 * 24 * 30,
      staleMaxAge: 60 * 60 * 24 * 7,
      name: 'makeup-list',
      getKey: (event) => {
        const version = getGameVersion()
        const query = getQuery(event)
        const page = query.page ? Number(query.page) : 1
        const pageSize = parsePageSize(query.pageSize ?? query.page_size)
        const quality = query.quality?.toString() || 'all'
        const type = query.type?.toString() || 'all'
        const style = query.style?.toString() || 'all'
        const itemVersion = query.version?.toString() || 'all'
        const source = query.source
          ? query.source.toString()
          : query.obtain
            ? query.obtain.toString()
            : 'all'
        return `${version}:makeups:p${page}:ps${pageSize}:q${quality}:t${type}:s${style}:v${itemVersion}:src${source}`
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
