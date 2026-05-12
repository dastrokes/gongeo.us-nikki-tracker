type FullMakeupRow = {
  id: number | null
  quality: number | null
  props: Array<number | string> | null
  style_key?: string | null
  tags: Array<number | string> | null
  obtain_type?: number | null
}

const DEFAULT_PAGE_SIZE = 18

const normalizeTotalCount = (value: unknown): number => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return 0
  return Math.floor(parsed)
}

export default defineCachedApiEventHandler(
  async (event) => {
    const query = getQuery(event)
    const page =
      Number.isNaN(Number(query.page)) || Number(query.page) < 1
        ? 1
        : Number(query.page ?? 1)
    const parsedPageSize = Number(query.pageSize)
    const pageSize =
      Number.isFinite(parsedPageSize) && parsedPageSize > 0
        ? Math.min(Math.floor(parsedPageSize), 200)
        : DEFAULT_PAGE_SIZE
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
    const labelParam = query.label?.toString() || null
    const normalizedStyle = styleParam ? normalizeTraitKey(styleParam) : null
    const styleFilter = normalizedStyle
      ? STYLE_BY_KEY.get(normalizedStyle)
      : null
    const normalizedLabel = labelParam ? normalizeTraitKey(labelParam) : null
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
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    const supabase = useSupabaseDataClient()

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

    try {
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
        if (labelFilter) {
          builder = builder.contains('tags', [labelFilter.id])
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

      if (error) {
        throw error
      }

      const total = normalizeTotalCount(count)
      const rows = ((data as FullMakeupRow[] | null) ?? []).filter(
        (row): row is FullMakeupRow & { id: number; quality: number } =>
          row.id !== null && row.quality !== null
      )

      return {
        data: rows.map((row) => ({
          id: row.id,
          quality: row.quality,
          type: 'fullMakeup',
          obtain_type: row.obtain_type ?? null,
          style:
            (row.style_key ? STYLE_BY_KEY.get(row.style_key)?.i18nKey : null) ??
            resolveStyleI18nKeyFromProps(row.props),
          labels: resolveTagI18nKeys(row.tags),
        })),
        total,
        page,
        totalPages: total ? Math.ceil(total / DEFAULT_PAGE_SIZE) : 0,
      }
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'statusCode' in error) {
        throw error
      }
      const message = toErrorMessage(error, 'Failed to fetch full makeups')
      if (isTransientSupabaseError(error)) {
        console.warn(`Failed to fetch full makeups: ${message}`)
        throw createUpstreamUnavailableError('full makeups')
      }
      console.error(`Failed to fetch full makeups: ${message}`)
      throw createInternalError('full makeups')
    }
  },
  {
    cache: {
      maxAge: 60 * 60 * 24 * 30,
      staleMaxAge: 60 * 60 * 24 * 7,
      name: 'full-makeup-list',
      getKey: (event) => {
        const version = getGameVersion()
        const query = getQuery(event)
        const page = query.page ? Number(query.page) : 1
        const pageSize = query.pageSize?.toString() || String(DEFAULT_PAGE_SIZE)
        const quality = query.quality?.toString() || 'all'
        const style = query.style?.toString() || 'all'
        const label = query.label?.toString() || 'all'
        const itemVersion = query.version?.toString() || 'all'
        const source = query.source
          ? query.source.toString()
          : query.obtain
            ? query.obtain.toString()
            : 'all'
        return `${version}:full-makeup:p${page}:ps${pageSize}:q${quality}:s${style}:l${label}:v${itemVersion}:src${source}`
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
