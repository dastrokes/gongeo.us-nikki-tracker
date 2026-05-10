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
    const from = (page - 1) * DEFAULT_PAGE_SIZE
    const to = from + DEFAULT_PAGE_SIZE - 1
    const supabase = useSupabaseDataClient()

    try {
      const { data, error, count } = await withSupabaseRetry(() =>
        supabase
          .from('full_makeups')
          .select('id,quality,props,style_key,tags,obtain_type', {
            count: 'exact',
          })
          .order('id', { ascending: true })
          .range(from, to)
      )

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
        return `${version}:full-makeups:p${page}`
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
