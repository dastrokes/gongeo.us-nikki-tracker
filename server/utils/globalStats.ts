import { withSupabaseRetry } from './supabaseRetry'

type MaybeSingleQueryResult = {
  data: unknown
  error: unknown
}

type MaybeSingleQueryBuilder = {
  maybeSingle: () => PromiseLike<MaybeSingleQueryResult>
}

type EqQueryBuilder = {
  eq: (column: string, value: unknown) => MaybeSingleQueryBuilder
}

type SelectQueryBuilder = {
  select: (columns: string) => EqQueryBuilder
}

type SupabaseClient = {
  from: (table: string) => SelectQueryBuilder
}

type BannerScopePayload = GlobalBannerPayload['scopes'][string]
type BannerItemDistributionEntry =
  BannerScopePayload['firstItemDistribution'][number]

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const toNumberRecord = (value: unknown): Record<string, number> => {
  if (!isRecord(value)) return {}

  return Object.entries(value).reduce<Record<string, number>>(
    (result, [key, count]) => {
      if (typeof count === 'number' && Number.isFinite(count)) {
        result[key] = count
      }
      return result
    },
    {}
  )
}

const toBannerItemDistribution = (
  value: unknown
): BannerItemDistributionEntry[] => {
  if (!Array.isArray(value)) return []

  return value.reduce<BannerItemDistributionEntry[]>((result, item) => {
    if (!isRecord(item)) return result
    const itemId = typeof item.itemId === 'string' ? item.itemId : ''
    const users = typeof item.users === 'number' ? item.users : 0

    if (itemId && Number.isFinite(users)) {
      result.push({ itemId, users })
    }
    return result
  }, [])
}

const toCompletionLevels = (
  value: unknown
): GlobalBannerPayload['completionLevels'] => {
  if (!isRecord(value)) return undefined

  const count = (level: unknown) =>
    typeof level === 'number' && Number.isFinite(level) ? level : 0

  return {
    base: count(value.base),
    evo1: count(value.evo1),
    evo2: count(value.evo2),
    evo3: count(value.evo3),
  }
}

const toBannerScopes = (value: unknown): Record<string, BannerScopePayload> => {
  if (!isRecord(value)) return {}

  return Object.entries(value).reduce<Record<string, BannerScopePayload>>(
    (result, [scopeKey, scope]) => {
      if (!isRecord(scope)) return result

      const quality =
        scope.quality === 4 || scope.quality === 5 ? scope.quality : undefined
      const outfitId = typeof scope.outfitId === 'string' ? scope.outfitId : ''
      const itemCount =
        typeof scope.itemCount === 'number' && Number.isFinite(scope.itemCount)
          ? scope.itemCount
          : 0
      if (!quality || !outfitId || itemCount <= 0) return result

      const normalizedScope: BannerScopePayload = {
        scopeKey:
          typeof scope.scopeKey === 'string' && scope.scopeKey
            ? scope.scopeKey
            : scopeKey,
        quality,
        outfitId,
        itemCount,
        users:
          typeof scope.users === 'number' && Number.isFinite(scope.users)
            ? scope.users
            : 0,
        firstItemDistribution: toBannerItemDistribution(
          scope.firstItemDistribution
        ),
      }

      if (
        typeof scope.completedUsers === 'number' &&
        Number.isFinite(scope.completedUsers)
      ) {
        normalizedScope.completedUsers = scope.completedUsers
      }
      if (
        typeof scope.completionRate === 'number' &&
        Number.isFinite(scope.completionRate)
      ) {
        normalizedScope.completionRate = scope.completionRate
      }
      if (isRecord(scope.completionPullDistribution)) {
        normalizedScope.completionPullDistribution = toNumberRecord(
          scope.completionPullDistribution
        )
      }
      if (Array.isArray(scope.fifthItemDistribution)) {
        normalizedScope.fifthItemDistribution = toBannerItemDistribution(
          scope.fifthItemDistribution
        )
      }

      result[normalizedScope.scopeKey] = normalizedScope
      return result
    },
    {}
  )
}

const toCorePayload = (value: unknown): GlobalCorePayload => {
  if (!isRecord(value)) return {}
  return {
    date: typeof value.date === 'string' ? value.date : undefined,
    pulls: typeof value.pulls === 'number' ? value.pulls : 0,
    users: typeof value.users === 'number' ? value.users : 0,
    pullsPerBanner: isRecord(value.pullsPerBanner)
      ? (value.pullsPerBanner as Record<string, [number, number, number]>)
      : {},
    fiveStarDistribution: isRecord(value.fiveStarDistribution)
      ? (value.fiveStarDistribution as Record<string, number>)
      : {},
    fourStarType2Distribution: isRecord(value.fourStarType2Distribution)
      ? (value.fourStarType2Distribution as Record<string, number>)
      : {},
    fourStarType3Distribution: isRecord(value.fourStarType3Distribution)
      ? (value.fourStarType3Distribution as Record<string, number>)
      : {},
  }
}

const toBannerPayload = (
  value: unknown,
  bannerId: number
): GlobalBannerPayload => {
  if (!isRecord(value)) {
    return {
      bannerId,
      users: 0,
      totalPulls: 0,
      overallPullDistribution: {},
      scopes: {},
    }
  }

  return {
    date: typeof value.date === 'string' ? value.date : undefined,
    bannerId: typeof value.bannerId === 'number' ? value.bannerId : bannerId,
    bannerType:
      value.bannerType === 1 || value.bannerType === 2 || value.bannerType === 3
        ? value.bannerType
        : undefined,
    users:
      typeof value.users === 'number' && Number.isFinite(value.users)
        ? value.users
        : 0,
    totalPulls:
      typeof value.totalPulls === 'number' && Number.isFinite(value.totalPulls)
        ? value.totalPulls
        : 0,
    overallPullDistribution: toNumberRecord(value.overallPullDistribution),
    completionLevels: toCompletionLevels(value.completionLevels),
    scopes: toBannerScopes(value.scopes),
  }
}

const toFirstItemDistribution = (
  payload: GlobalBannerPayload
): FirstItemDistribution => {
  return Object.values(payload.scopes).reduce<FirstItemDistribution>(
    (result, scope) => {
      const dataKey =
        payload.bannerType === 2 && scope.quality === 4
          ? `${payload.bannerId}_4`
          : payload.bannerId.toString()

      result[dataKey] ??= scope.firstItemDistribution.map((item) => ({
        users: item.users,
        itemId: item.itemId,
      }))

      return result
    },
    {}
  )
}

const fetchCoreStatsRow = async (
  supabase: SupabaseClient
): Promise<GlobalCoreStatsRow | null> => {
  const { data, error } = await withSupabaseRetry(() =>
    supabase
      .from('user_global_stats')
      .select('banner_id,payload,updated_at')
      .eq('banner_id', 0)
      .maybeSingle()
  )

  if (error) throw error
  if (!isRecord(data)) return null

  const payload = toCorePayload(data.payload)

  return {
    banner_id:
      typeof data.banner_id === 'number' && data.banner_id >= 0
        ? data.banner_id
        : 0,
    payload,
    updated_at: typeof data.updated_at === 'string' ? data.updated_at : '',
  }
}

const fetchBannerStatsRow = async (
  supabase: SupabaseClient,
  bannerId: number
): Promise<GlobalBannerStatsRow | null> => {
  const { data, error } = await withSupabaseRetry(() =>
    supabase
      .from('user_global_stats')
      .select('banner_id,payload,updated_at')
      .eq('banner_id', bannerId)
      .maybeSingle()
  )

  if (error) throw error
  if (!isRecord(data)) return null
  const payload = toBannerPayload(data.payload, bannerId)

  return {
    banner_id: typeof data.banner_id === 'number' ? data.banner_id : bannerId,
    payload,
    firstItemDistribution: toFirstItemDistribution(payload),
    updated_at: typeof data.updated_at === 'string' ? data.updated_at : '',
  }
}

export const getCoreStats = async (
  supabase: unknown
): Promise<GlobalCoreStatsRow> => {
  const supabaseClient = supabase as SupabaseClient
  const row = await fetchCoreStatsRow(supabaseClient)

  if (!row) {
    return {
      banner_id: 0,
      payload: {
        pulls: 0,
        users: 0,
        pullsPerBanner: {},
        fiveStarDistribution: {},
        fourStarType2Distribution: {},
        fourStarType3Distribution: {},
      },
      updated_at: '',
    }
  }

  return row
}

export const getBannerStats = async (
  supabase: unknown,
  bannerId: number
): Promise<GlobalBannerStatsRow> => {
  const supabaseClient = supabase as SupabaseClient
  const row = await fetchBannerStatsRow(supabaseClient, bannerId)

  if (!row) {
    return {
      banner_id: bannerId,
      payload: {
        bannerId,
        users: 0,
        totalPulls: 0,
        overallPullDistribution: {},
        scopes: {},
      },
      firstItemDistribution: {},
      updated_at: '',
    }
  }

  return row
}
