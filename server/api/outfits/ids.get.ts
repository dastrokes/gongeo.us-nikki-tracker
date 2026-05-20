type OutfitIdRow =
  | number
  | { id?: number | string | null; outfit_id?: number | string | null }

type OutfitItemIdRow = {
  outfit_id?: number | string | null
  item_id?: number | string | null
}

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

const normalizeOutfitIdRows = (rows: unknown): number[] => {
  if (!Array.isArray(rows)) return []

  return normalizeWardrobeItemIds(
    rows.map((row: OutfitIdRow) =>
      typeof row === 'number' ? row : (row.id ?? row.outfit_id)
    )
  )
}

const shouldIncludeItemIds = (value: unknown) => {
  const raw = Array.isArray(value) ? value[0] : value
  return raw === '1' || raw === 'true' || raw === true
}

export default defineCachedApiEventHandler(
  async (event): Promise<WardrobeOutfitIdsResponse> => {
    const query = getQuery(event)
    const includeItemIds = shouldIncludeItemIds(query.includeItemIds)
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
      return { outfitIds: [] }
    }

    const rpcClient = useSupabaseDataClient() as unknown as RpcCapableClient
    const rpcParams = {
      p_quality: quality ?? null,
      p_style_key: styleFilter?.key ?? null,
      p_label_id: labelFilter?.id ?? null,
      p_obtain_min: obtainTypeRange?.min ?? null,
      p_obtain_max: obtainTypeRange?.max ?? null,
      p_obtain_ids: obtainIds ?? null,
    }

    try {
      const data = await fetchAllRpcRows(
        rpcClient,
        'list_outfit_ids',
        rpcParams
      )
      const outfitIds = normalizeOutfitIdRows(data)
      if (!includeItemIds || outfitIds.length === 0) {
        return { outfitIds }
      }

      const relationData = await fetchAllRpcRows(
        rpcClient,
        'list_outfit_item_ids',
        rpcParams
      )

      const outfitItems: Record<string, number[]> = {}
      const itemIds = new Set<number>()

      for (const row of (relationData as OutfitItemIdRow[] | null) ?? []) {
        const outfitId = normalizeWardrobeItemIds([row.outfit_id])[0]
        const itemId = normalizeWardrobeItemIds([row.item_id])[0]
        if (outfitId === undefined || itemId === undefined) continue
        outfitItems[outfitId] ??= []
        outfitItems[outfitId]!.push(itemId)
        itemIds.add(itemId)
      }

      for (const outfitId of outfitIds) {
        const ids = outfitItems[outfitId] ?? []
        if (ids.length === 0) {
          console.error(
            `Missing outfit item relations for outfit id ${outfitId}`
          )
          throw createInternalError('outfit items')
        }
        outfitItems[outfitId] = normalizeWardrobeItemIds(ids)
      }

      return {
        outfitIds,
        itemIds: Array.from(itemIds).sort((left, right) => left - right),
        outfitItems,
      }
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'statusCode' in error) {
        throw error
      }
      const message = toErrorMessage(error, 'Failed to fetch outfit ids')
      if (isTransientSupabaseError(error)) {
        console.warn(`Failed to fetch outfit ids: ${message}`)
        throw createUpstreamUnavailableError('outfits')
      }
      console.error(`Failed to fetch outfit ids: ${message}`)
      throw createInternalError('outfits')
    }
  },
  {
    cache: {
      maxAge: 60 * 60 * 24 * 30,
      staleMaxAge: 60 * 60 * 24 * 7,
      name: 'outfits-ids',
      getKey: (event) => {
        const version = getGameVersion()
        const query = getQuery(event)
        const include = shouldIncludeItemIds(query.includeItemIds) ? '1' : '0'
        const quality = query.quality?.toString() || 'all'
        const style = query.style?.toString() || 'all'
        const label = query.label?.toString() || 'all'
        const outfitVersion = query.version?.toString() || 'all'
        const source = query.source
          ? query.source.toString()
          : query.obtain
            ? query.obtain.toString()
            : 'all'
        return `${version}:outfits:ids:i${include}:q${quality}:s${style}:l${label}:v${outfitVersion}:src${source}`
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
