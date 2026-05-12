type MakeupRow = {
  id: number
  quality: number
  type: string
  obtain_type: number | null
  style: string | null
  labels: string[]
}

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

type FullMakeupRow = {
  id: number | null
  quality: number | null
  props: Array<number | string> | null
  style_key?: string | null
  tags: Array<number | string> | null
  obtain_type?: number | null
}

type RpcCapableClient = {
  rpc: (
    fn: string,
    args?: Record<string, unknown>
  ) => PromiseLike<{ data: unknown; error: unknown }>
}

const DEFAULT_PAGE_SIZE = 18
const TIERLIST_PAGE_SIZE = 200
const AGGREGATE_SLOT_PAGE_SIZE = 500
const MAKEUP_TYPES = [
  'fullMakeup',
  'baseMakeup',
  'eyebrows',
  'eyelashes',
  'contactLenses',
  'lips',
] as const
const MAKEUP_TYPE_SET = new Set<string>(MAKEUP_TYPES)
const MAKEUP_ORDER = new Map(
  MAKEUP_TYPES.map((type, index) => [type, index] as const)
)

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

    const mapFullMakeupRows = (rows: FullMakeupRow[]): MakeupRow[] =>
      rows
        .filter(
          (row): row is FullMakeupRow & { id: number; quality: number } =>
            row.id !== null && row.quality !== null
        )
        .map((row) => ({
          id: row.id,
          quality: row.quality,
          type: 'fullMakeup',
          obtain_type: row.obtain_type ?? null,
          style:
            (row.style_key ? STYLE_BY_KEY.get(row.style_key)?.i18nKey : null) ??
            resolveStyleI18nKeyFromProps(row.props),
          labels: resolveTagI18nKeys(row.tags),
        }))

    const mapItemRows = (rows: ItemRow[]): MakeupRow[] =>
      rows
        .filter(
          (row): row is ItemRow & { id: number; quality: number; type: string } =>
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

    const fetchFullMakeups = async (
      requestedPage: number,
      requestedPageSize: number
    ) => {
      const from = (requestedPage - 1) * requestedPageSize
      const to = from + requestedPageSize - 1
      const { data, error, count } = await withSupabaseRetry(() => {
        let builder = supabase
          .from('full_makeups')
          .select('id,quality,props,style_key,tags,obtain_type', {
            count: 'exact',
          })

        if (quality !== null && quality !== undefined) {
          builder = builder.eq('quality', quality)
        }
        if (styleFilter) {
          builder = builder.eq('style_key', styleFilter.key)
        }
        if (obtainTypeRange) {
          builder = builder
            .gte('obtain_type', obtainTypeRange.min)
            .lte('obtain_type', obtainTypeRange.max)
        }
        if (obtainIds && obtainIds.length > 0) {
          builder = builder.in('obtain_type', obtainIds)
        }

        return builder.order('id', { ascending: true }).range(from, to)
      })

      if (error) throw error

      const total = normalizeTotalCount(count)
      return {
        data: mapFullMakeupRows((data as FullMakeupRow[] | null) ?? []),
        total,
      }
    }

    const fetchItemsForType = async (
      makeupType: string,
      requestedPage: number,
      requestedPageSize: number
    ) => {
      const { data: rpcData, error: rpcError } = await withSupabaseRetry(() =>
        rpcClient.rpc('list_items', {
          p_page: requestedPage,
          p_page_size: requestedPageSize,
          p_quality: quality ?? null,
          p_type: makeupType,
          p_style_key: styleFilter?.key ?? null,
          p_label_id: null,
          p_obtain_min: obtainTypeRange?.min ?? null,
          p_obtain_max: obtainTypeRange?.max ?? null,
          p_obtain_ids: obtainIds ?? null,
          p_category: null,
          p_subcategory: null,
          p_metadata: null,
        })
      )

      if (rpcError) throw rpcError

      const rows = (rpcData as ItemRow[] | null) ?? []
      return {
        data: mapItemRows(rows),
        total: normalizeTotalCount(rows[0]?.total_count),
      }
    }

    const fetchAllRowsForType = async (makeupType: string) => {
      const firstPage =
        makeupType === 'fullMakeup'
          ? await fetchFullMakeups(1, AGGREGATE_SLOT_PAGE_SIZE)
          : await fetchItemsForType(makeupType, 1, AGGREGATE_SLOT_PAGE_SIZE)
      const totalPages = Math.ceil(
        firstPage.total / AGGREGATE_SLOT_PAGE_SIZE
      )

      if (totalPages <= 1) return firstPage

      const remainingPages = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, index) =>
          makeupType === 'fullMakeup'
            ? fetchFullMakeups(index + 2, AGGREGATE_SLOT_PAGE_SIZE)
            : fetchItemsForType(
                makeupType,
                index + 2,
                AGGREGATE_SLOT_PAGE_SIZE
              )
        )
      )

      return {
        data: [
          ...firstPage.data,
          ...remainingPages.flatMap((response) => response.data),
        ],
        total: firstPage.total,
      }
    }

    try {
      if (type) {
        const response =
          type === 'fullMakeup'
            ? await fetchFullMakeups(page, pageSize)
            : await fetchItemsForType(type, page, pageSize)

        return {
          data: response.data,
          total: response.total,
          page,
          totalPages: response.total ? Math.ceil(response.total / pageSize) : 0,
        }
      }

      const responses = await Promise.all(
        MAKEUP_TYPES.map((makeupType) => fetchAllRowsForType(makeupType))
      )
      const data = responses
        .flatMap((response) => response.data)
        .sort((a, b) => {
          const orderA = isMakeupType(a.type) ? MAKEUP_ORDER.get(a.type) ?? 999 : 999
          const orderB = isMakeupType(b.type) ? MAKEUP_ORDER.get(b.type) ?? 999 : 999
          if (orderA !== orderB) return orderA - orderB
          return b.id - a.id
        })
      const total = data.length
      const from = (page - 1) * pageSize

      return {
        data: data.slice(from, from + pageSize),
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
