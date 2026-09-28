type StatsApiRow = {
  banner_id: number
  payload: unknown
  updated_at: string
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

const toFirstItemDistributionRecord = (
  value: unknown
): FirstItemDistribution => {
  if (!isRecord(value)) return {}

  return Object.entries(value).reduce<FirstItemDistribution>(
    (result, [key, items]) => {
      if (!Array.isArray(items)) return result
      result[key] = toBannerItemDistribution(items)
      return result
    },
    {}
  )
}

const fetchStatsRow = async (bannerId: number): Promise<StatsApiRow | null> => {
  const response = await fetch(getDataApiUrl(`/stats/${bannerId}`), {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(10000),
  })

  if (response.status === 404) return null
  if (!response.ok) {
    throw new Error(`Stats data API returned HTTP ${response.status}`)
  }

  const data: unknown = await response.json()
  if (!isRecord(data)) throw new Error('Stats data API returned an invalid row')

  if (
    typeof data.banner_id !== 'number' ||
    !Number.isSafeInteger(data.banner_id) ||
    typeof data.updated_at !== 'string'
  ) {
    throw new Error('Stats data API returned invalid row metadata')
  }

  return {
    banner_id: data.banner_id,
    payload: data.payload,
    updated_at: data.updated_at,
  }
}

const fetchCoreStatsRow = async (): Promise<GlobalCoreStatsRow | null> => {
  const data = await fetchStatsRow(0)
  if (!data) return null

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
  bannerId: number
): Promise<GlobalBannerStatsRow | null> => {
  const data = await fetchStatsRow(bannerId)
  if (!data) return null
  const payload = toBannerPayload(data.payload, bannerId)

  return {
    banner_id: typeof data.banner_id === 'number' ? data.banner_id : bannerId,
    payload,
    firstItemDistribution: toFirstItemDistribution(payload),
    updated_at: typeof data.updated_at === 'string' ? data.updated_at : '',
  }
}

export const getCoreStats = async (): Promise<GlobalCoreStatsRow> => {
  const row = await fetchCoreStatsRow()

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
  bannerId: number
): Promise<GlobalBannerStatsRow> => {
  const row = await fetchBannerStatsRow(bannerId)

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

export const getGlobalLandingStats = async (
  bannerId: number
): Promise<GlobalLandingStatsData> => {
  if (!Number.isSafeInteger(bannerId) || bannerId <= 0) {
    throw new Error('Invalid banner ID for landing stats')
  }

  const response = await fetch(getDataApiUrl(`/stats/${bannerId}/summary`), {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(10000),
  })

  if (response.status === 404) {
    return {
      pulls: 0,
      users: 0,
      bannerId,
      firstItemDistribution: {},
      updatedAt: '',
    }
  }
  if (!response.ok) {
    throw new Error(`Stats summary data API returned HTTP ${response.status}`)
  }

  const data: unknown = await response.json()
  if (
    !isRecord(data) ||
    typeof data.bannerId !== 'number' ||
    !Number.isSafeInteger(data.bannerId) ||
    typeof data.updatedAt !== 'string'
  ) {
    throw new Error('Stats summary data API returned an invalid response')
  }

  return {
    pulls:
      typeof data.pulls === 'number' && Number.isFinite(data.pulls)
        ? data.pulls
        : 0,
    users:
      typeof data.users === 'number' && Number.isFinite(data.users)
        ? data.users
        : 0,
    bannerId: data.bannerId,
    firstItemDistribution: toFirstItemDistributionRecord(
      data.firstItemDistribution
    ),
    updatedAt: data.updatedAt,
  }
}

export const getGlobalBannerSummary = async (
  bannerId: number
): Promise<GlobalBootstrapData> => {
  const banner = await getBannerStats(bannerId)

  return {
    date: banner.payload.date ?? banner.updated_at ?? new Date().toISOString(),
    bannerId: banner.payload.bannerId ?? bannerId,
    firstItemDistribution: banner.firstItemDistribution,
    completionLevels: banner.payload.completionLevels,
  }
}

export const getGlobalBootstrapStats = async (
  latestBannerId: number
): Promise<GlobalBootstrapData> => {
  const [core, latestBanner] = await Promise.all([
    getCoreStats(),
    getBannerStats(latestBannerId),
  ])

  return {
    date: core.payload.date ?? core.updated_at ?? new Date().toISOString(),
    pulls: core.payload.pulls ?? 0,
    users: core.payload.users ?? 0,
    pullsPerBanner: core.payload.pullsPerBanner ?? {},
    fiveStarDistribution: core.payload.fiveStarDistribution ?? {},
    fourStarType2Distribution: core.payload.fourStarType2Distribution ?? {},
    fourStarType3Distribution: core.payload.fourStarType3Distribution ?? {},
    bannerId: latestBanner.payload.bannerId ?? latestBannerId,
    firstItemDistribution: latestBanner.firstItemDistribution,
    completionLevels: latestBanner.payload.completionLevels,
  }
}
