type ItemIdRow =
  | number
  | { id?: number | string | null; item_id?: number | string | null }

type RpcCapableClient = {
  rpc: (
    fn: string,
    args?: Record<string, unknown>
  ) => {
    range: (
      from: number,
      to: number
    ) => PromiseLike<{ data: unknown; error: unknown }>
  }
}

const RPC_PAGE_SIZE = 1000

const fetchAllRpcRows = async (
  rpcClient: RpcCapableClient,
  fn: string,
  args: Record<string, unknown>
) => {
  const rows: unknown[] = []
  let from = 0

  for (;;) {
    const to = from + RPC_PAGE_SIZE - 1
    const { data, error } = await withSupabaseRetry(() =>
      rpcClient.rpc(fn, args).range(from, to)
    )

    if (error) {
      throw error
    }

    if (!Array.isArray(data) || data.length === 0) {
      break
    }

    rows.push(...data)

    if (data.length < RPC_PAGE_SIZE) {
      break
    }

    from += RPC_PAGE_SIZE
  }

  return rows
}

const normalizeIdRows = (rows: unknown): number[] => {
  if (!Array.isArray(rows)) return []

  return normalizeWardrobeItemIds(
    rows.map((row: ItemIdRow) =>
      typeof row === 'number' ? row : (row.id ?? row.item_id)
    )
  )
}

export default defineCachedApiEventHandler(
  async (event): Promise<WardrobeItemIdsResponse> => {
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
      return { itemIds: [] }
    }

    const rpcClient = useSupabaseDataClient() as unknown as RpcCapableClient
    const rpcParams = {
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

    try {
      const data = await fetchAllRpcRows(rpcClient, 'list_item_ids', rpcParams)
      return { itemIds: normalizeIdRows(data) }
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'statusCode' in error) {
        throw error
      }
      const message = toErrorMessage(error, 'Failed to fetch item ids')
      if (isTransientSupabaseError(error)) {
        console.warn(`Failed to fetch item ids: ${message}`)
        throw createUpstreamUnavailableError('items')
      }
      console.error(`Failed to fetch item ids: ${message}`)
      throw createInternalError('items')
    }
  },
  {
    cache: {
      maxAge: 60 * 60 * 24 * 30,
      staleMaxAge: 60 * 60 * 24 * 7,
      name: 'items-ids',
      getKey: (event) => {
        const version = getGameVersion()
        const query = getQuery(event)
        const quality = query.quality?.toString() || 'all'
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
        return `${version}:items:ids:q${quality}:t${type}:c${category}:sc${subcategory}:a${advancedFilters || 'none'}:s${style}:l${label}:v${itemVersion}:src${source}`
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
