export type CommunityScopeType = 'banners' | 'outfits' | 'items'

export type CommunityScopeFilters = {
  quality?: 2 | 3 | 4 | 5
  version?: string
  style?: string
  label?: string
  source?: string
  type?: string
}

export type CommunityScope = {
  scopeType: CommunityScopeType
  scopeFilters: CommunityScopeFilters
}

export type TierMode = 'banners' | 'outfits' | 'items'

export type CommunityScopeFromTierlistInput = {
  mode: TierMode
  bannerQualityFilter: number | null
  qualityFilter: number | null
  itemTypeFilter: string | null
  versionFilter: string | null
  styleFilter: string | null
  labelFilter: string | null
  obtainFilter: string | null
}

export const COMMUNITY_TIER_KEYS = ['S', 'A', 'B', 'C', 'D', 'F'] as const
export type CommunityAggregateTierKey = (typeof COMMUNITY_TIER_KEYS)[number]
export const COMMUNITY_BAYESIAN_PRIOR_STRENGTH = 12
export const COMMUNITY_MIN_VOTES_FOR_RANKING = 10

export type CommunityAggregateTierCounts = Record<
  CommunityAggregateTierKey,
  number
>

export type CommunityAggregateEntry = {
  entry_id: string
  rank: number
  avg_score: number
  votes: number
  tier_counts: CommunityAggregateTierCounts
}

export type CommunityAggregateModeSnapshot = {
  total_submissions: number
  entries: CommunityAggregateEntry[]
}

export type CommunityAggregateJson = {
  schema_version: number
  generated_at: string
  modes: Partial<Record<TierMode, CommunityAggregateModeSnapshot>>
}

export type CommunityRankedPreviewEntry = {
  entryId: string
  rank: number
  tier: CommunityAggregateTierKey
  votes: number
}

export type CommunityModePreview = {
  rankedEntries: CommunityRankedPreviewEntry[]
  voteByEntryId: Map<string, number>
  tierByEntryId: Map<string, CommunityAggregateTierKey>
  rankByEntryId: Map<string, number>
  unrankedEntryIds: string[]
  hasEntries: boolean
}

const STORAGE_BUCKET = 'gongeous'
const STORAGE_OBJECT_PATH = 'tierlist.json'
const CACHE_TTL_MS = 5 * 60 * 1000

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const normalizeCommunityQuality = (
  value: unknown
): CommunityScopeFilters['quality'] | null => {
  if (value === 2 || value === 3 || value === 4 || value === 5) return value
  return null
}

const normalizeCommunityStringFilter = (value: unknown): string | null => {
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  if (!normalized) return null
  if (normalized.length > 64) return null
  return normalized
}

const toNumber = (value: unknown, fallback = 0): number => {
  const numberValue = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numberValue) ? numberValue : fallback
}

const tierRankIndexByKey: Record<CommunityAggregateTierKey, number> = {
  S: 0,
  A: 1,
  B: 2,
  C: 3,
  D: 4,
  F: 5,
}

const communityTierRatioByKey: Record<CommunityAggregateTierKey, number> = {
  S: 0.1,
  A: 0.2,
  B: 0.25,
  C: 0.2,
  D: 0.15,
  F: 0.1,
}

const createEmptyTierCountMap = (): Record<
  CommunityAggregateTierKey,
  number
> => ({
  S: 0,
  A: 0,
  B: 0,
  C: 0,
  D: 0,
  F: 0,
})

const buildCommunityTierQuota = (
  totalEntries: number
): Record<CommunityAggregateTierKey, number> => {
  const counts = createEmptyTierCountMap()
  if (totalEntries <= 0) return counts

  const withFraction = COMMUNITY_TIER_KEYS.map((tier) => {
    const exact = totalEntries * communityTierRatioByKey[tier]
    const base = Math.floor(exact)
    counts[tier] = base
    return {
      tier,
      fraction: exact - base,
    }
  })

  let assigned = COMMUNITY_TIER_KEYS.reduce(
    (sum, tier) => sum + counts[tier],
    0
  )
  let remaining = totalEntries - assigned

  withFraction.sort((a, b) => {
    if (b.fraction !== a.fraction) return b.fraction - a.fraction
    return (
      COMMUNITY_TIER_KEYS.indexOf(a.tier) - COMMUNITY_TIER_KEYS.indexOf(b.tier)
    )
  })

  let index = 0
  while (remaining > 0 && withFraction.length > 0) {
    const targetTier = withFraction[index % withFraction.length]?.tier
    if (!targetTier) break
    counts[targetTier] += 1
    remaining -= 1
    index += 1
  }

  if (totalEntries >= 6) {
    ;(['S', 'F'] as const).forEach((targetTier) => {
      if (counts[targetTier] > 0) return

      const donorTier = [...COMMUNITY_TIER_KEYS]
        .filter((tier) => tier !== targetTier && counts[tier] > 1)
        .sort((a, b) => {
          if (counts[b] !== counts[a]) return counts[b] - counts[a]
          return (
            Math.abs(
              COMMUNITY_TIER_KEYS.indexOf(a) -
                COMMUNITY_TIER_KEYS.indexOf(targetTier)
            ) -
            Math.abs(
              COMMUNITY_TIER_KEYS.indexOf(b) -
                COMMUNITY_TIER_KEYS.indexOf(targetTier)
            )
          )
        })[0]

      if (!donorTier) return
      counts[donorTier] -= 1
      counts[targetTier] += 1
    })
  }

  assigned = COMMUNITY_TIER_KEYS.reduce((sum, tier) => sum + counts[tier], 0)
  if (assigned < totalEntries) {
    counts.F += totalEntries - assigned
  } else if (assigned > totalEntries) {
    counts.F = Math.max(0, counts.F - (assigned - totalEntries))
  }

  return counts
}

export const hasEnoughCommunityVotes = (votes: number): boolean =>
  Math.max(0, Math.floor(votes)) >= COMMUNITY_MIN_VOTES_FOR_RANKING

export const buildCommunityModePreview = (
  modeSnapshot: CommunityAggregateModeSnapshot | null,
  scopeEntryIds: readonly string[]
): CommunityModePreview => {
  const entries = modeSnapshot?.entries ?? []
  const voteByEntryId = new Map<string, number>()

  entries.forEach((entry) => {
    voteByEntryId.set(entry.entry_id, Math.max(0, Math.floor(entry.votes)))
  })

  const rankableEntries = entries.filter((entry) =>
    hasEnoughCommunityVotes(entry.votes)
  )

  const rankedEntries: CommunityRankedPreviewEntry[] = []
  if (rankableEntries.length > 0) {
    const totalVotes = rankableEntries.reduce(
      (sum, entry) => sum + Math.max(0, entry.votes),
      0
    )
    const weightedScoreSum = rankableEntries.reduce(
      (sum, entry) => sum + Math.max(0, entry.votes) * entry.avg_score,
      0
    )
    const priorMean =
      totalVotes > 0
        ? weightedScoreSum / totalVotes
        : rankableEntries.reduce((sum, entry) => sum + entry.avg_score, 0) /
          rankableEntries.length

    const ranked = rankableEntries
      .map((entry) => {
        const votes = Math.max(0, entry.votes)
        const bayesianScore =
          (votes * entry.avg_score +
            COMMUNITY_BAYESIAN_PRIOR_STRENGTH * priorMean) /
          (votes + COMMUNITY_BAYESIAN_PRIOR_STRENGTH)

        return {
          entry,
          bayesianScore,
        }
      })
      .sort((a, b) => {
        if (b.bayesianScore !== a.bayesianScore)
          return b.bayesianScore - a.bayesianScore
        if (b.entry.votes !== a.entry.votes)
          return b.entry.votes - a.entry.votes
        if (b.entry.avg_score !== a.entry.avg_score)
          return b.entry.avg_score - a.entry.avg_score
        return a.entry.rank - b.entry.rank
      })

    const quotaByTier = buildCommunityTierQuota(ranked.length)
    let cursor = 0

    COMMUNITY_TIER_KEYS.forEach((tier) => {
      const tierQuota = quotaByTier[tier]
      for (
        let tierIndex = 0;
        tierIndex < tierQuota && cursor < ranked.length;
        tierIndex += 1
      ) {
        const rankedEntry = ranked[cursor]
        if (!rankedEntry) break
        rankedEntries.push({
          entryId: rankedEntry.entry.entry_id,
          rank: cursor + 1,
          tier,
          votes: rankedEntry.entry.votes,
        })
        cursor += 1
      }
    })
  }

  const tierByEntryId = new Map<string, CommunityAggregateTierKey>()
  const rankByEntryId = new Map<string, number>()
  rankedEntries.forEach((entry) => {
    tierByEntryId.set(entry.entryId, entry.tier)
    rankByEntryId.set(entry.entryId, entry.rank)
  })

  const unrankedEntryIds = scopeEntryIds.filter((entryId) => {
    const votes = voteByEntryId.get(entryId) ?? 0
    return !hasEnoughCommunityVotes(votes)
  })

  return {
    rankedEntries,
    voteByEntryId,
    tierByEntryId,
    rankByEntryId,
    unrankedEntryIds,
    hasEntries: rankedEntries.length > 0 || unrankedEntryIds.length > 0,
  }
}

const createEmptyTierCounts = (): CommunityAggregateTierCounts => ({
  S: 0,
  A: 0,
  B: 0,
  C: 0,
  D: 0,
  F: 0,
})

const normalizeTierCounts = (value: unknown): CommunityAggregateTierCounts => {
  const output = createEmptyTierCounts()
  if (!isRecord(value)) return output

  COMMUNITY_TIER_KEYS.forEach((tierKey) => {
    output[tierKey] = Math.max(0, Math.floor(toNumber(value[tierKey], 0)))
  })
  return output
}

const normalizeEntry = (value: unknown): CommunityAggregateEntry | null => {
  if (!isRecord(value) || typeof value.entry_id !== 'string') return null

  const entryId = value.entry_id.trim()
  if (!entryId) return null

  return {
    entry_id: entryId,
    rank: Math.max(1, Math.floor(toNumber(value.rank, 1))),
    avg_score: Number(toNumber(value.avg_score, 0).toFixed(4)),
    votes: Math.max(0, Math.floor(toNumber(value.votes, 0))),
    tier_counts: normalizeTierCounts(value.tier_counts),
  }
}

const normalizeMode = (value: unknown): CommunityAggregateModeSnapshot => {
  if (!isRecord(value)) {
    return {
      total_submissions: 0,
      entries: [],
    }
  }

  const entriesSource = Array.isArray(value.entries) ? value.entries : []
  const entries = entriesSource
    .map((entry) => normalizeEntry(entry))
    .filter((entry): entry is CommunityAggregateEntry => Boolean(entry))
    .sort((a, b) => a.rank - b.rank)

  return {
    total_submissions: Math.max(
      0,
      Math.floor(toNumber(value.total_submissions, 0))
    ),
    entries,
  }
}

const normalizeAggregateJson = (
  value: unknown
): CommunityAggregateJson | null => {
  if (!isRecord(value)) return null

  const generatedAt =
    typeof value.generated_at === 'string' ? value.generated_at : ''
  const modesSource = isRecord(value.modes) ? value.modes : {}

  const modes: Partial<Record<TierMode, CommunityAggregateModeSnapshot>> = {
    banners: normalizeMode(modesSource.banners),
    outfits: normalizeMode(modesSource.outfits),
    items: normalizeMode(modesSource.items),
  }

  return {
    schema_version: Math.max(1, Math.floor(toNumber(value.schema_version, 1))),
    generated_at: generatedAt,
    modes,
  }
}

const buildStorageJsonUrl = (supabaseUrl: string): string => {
  const baseUrl = supabaseUrl.replace(/\/+$/, '')
  const encodedBucket = encodeURIComponent(STORAGE_BUCKET)
  const encodedPath = STORAGE_OBJECT_PATH.split('/')
    .map((part) => encodeURIComponent(part))
    .join('/')

  return `${baseUrl}/storage/v1/object/public/${encodedBucket}/${encodedPath}`
}

export const resolveCommunityScope = (
  scopeType: unknown,
  scopeFilters: unknown
): CommunityScope | null => {
  if (
    scopeType !== 'banners' &&
    scopeType !== 'outfits' &&
    scopeType !== 'items'
  )
    return null
  if (!isRecord(scopeFilters)) return null

  const keys = Object.keys(scopeFilters)
  const supportedKeys =
    scopeType === 'banners'
      ? ['quality', 'version']
      : scopeType === 'outfits'
        ? ['quality', 'version', 'style', 'label', 'source']
        : ['quality', 'version', 'style', 'label', 'source', 'type']
  const supportedKeySet = new Set(supportedKeys)
  const unsupportedKeys = keys.filter((key) => !supportedKeySet.has(key))
  if (unsupportedKeys.length > 0) return null

  const normalizedFilters: CommunityScopeFilters = {}

  if ('quality' in scopeFilters) {
    const quality = normalizeCommunityQuality(scopeFilters.quality)
    if (!quality) return null
    if (scopeType === 'banners' && quality !== 4 && quality !== 5) return null
    normalizedFilters.quality = quality
  }

  if ('version' in scopeFilters) {
    const version = normalizeCommunityStringFilter(scopeFilters.version)
    if (!version) return null
    normalizedFilters.version = version
  }

  if (scopeType === 'outfits' || scopeType === 'items') {
    if ('style' in scopeFilters) {
      const style = normalizeCommunityStringFilter(scopeFilters.style)
      if (!style) return null
      normalizedFilters.style = style
    }

    if ('label' in scopeFilters) {
      const label = normalizeCommunityStringFilter(scopeFilters.label)
      if (!label) return null
      normalizedFilters.label = label
    }

    if ('source' in scopeFilters) {
      const source = normalizeCommunityStringFilter(scopeFilters.source)
      if (!source) return null
      normalizedFilters.source = source
    }
  }

  if (scopeType === 'items' && 'type' in scopeFilters) {
    const type = normalizeCommunityStringFilter(scopeFilters.type)
    if (!type) return null
    normalizedFilters.type = type
  }

  return {
    scopeType,
    scopeFilters: normalizedFilters,
  }
}

export const resolveCommunityScopeFromTierlistFilters = (
  input: CommunityScopeFromTierlistInput
): CommunityScope | null => {
  if (input.mode === 'banners') {
    const scopeFilters: CommunityScopeFilters = {}
    if (input.bannerQualityFilter === 5 || input.bannerQualityFilter === 4) {
      scopeFilters.quality = input.bannerQualityFilter
    } else if (input.bannerQualityFilter !== null) {
      return null
    }
    if (input.versionFilter) {
      scopeFilters.version = input.versionFilter
    }

    return {
      scopeType: 'banners',
      scopeFilters,
    }
  }

  if (input.mode === 'outfits') {
    const scopeFilters: CommunityScopeFilters = {}
    if (
      input.qualityFilter === 5 ||
      input.qualityFilter === 4 ||
      input.qualityFilter === 3 ||
      input.qualityFilter === 2
    ) {
      scopeFilters.quality = input.qualityFilter
    } else if (input.qualityFilter !== null) {
      return null
    }
    if (input.versionFilter) {
      scopeFilters.version = input.versionFilter
    }
    if (input.styleFilter) {
      scopeFilters.style = input.styleFilter
    }
    if (input.labelFilter) {
      scopeFilters.label = input.labelFilter
    }
    if (input.obtainFilter) {
      scopeFilters.source = input.obtainFilter
    }

    return {
      scopeType: 'outfits',
      scopeFilters,
    }
  }

  if (input.mode === 'items') {
    const scopeFilters: CommunityScopeFilters = {}
    if (
      input.qualityFilter === 5 ||
      input.qualityFilter === 4 ||
      input.qualityFilter === 3 ||
      input.qualityFilter === 2
    ) {
      scopeFilters.quality = input.qualityFilter
    } else if (input.qualityFilter !== null) {
      return null
    }
    if (input.versionFilter) {
      scopeFilters.version = input.versionFilter
    }
    if (input.styleFilter) {
      scopeFilters.style = input.styleFilter
    }
    if (input.labelFilter) {
      scopeFilters.label = input.labelFilter
    }
    if (input.obtainFilter) {
      scopeFilters.source = input.obtainFilter
    }
    if (input.itemTypeFilter) {
      scopeFilters.type = input.itemTypeFilter
    }

    return {
      scopeType: 'items',
      scopeFilters,
    }
  }

  return null
}

export const useCommunityTierlist = () => {
  const config = useRuntimeConfig()
  const aggregateData = useState<CommunityAggregateJson | null>(
    'community-tierlist-aggregate:data',
    () => null
  )
  const aggregateStatus = useState<'idle' | 'pending' | 'success' | 'error'>(
    'community-tierlist-aggregate:status',
    () => 'idle'
  )
  const aggregateError = useState<string | null>(
    'community-tierlist-aggregate:error',
    () => null
  )
  const lastFetchedAt = useState<number>(
    'community-tierlist-aggregate:fetched-at',
    () => 0
  )

  const fetchAggregateJson = async (force = false): Promise<void> => {
    if (!import.meta.client) return
    if (aggregateStatus.value === 'pending') return

    const hasFreshCache =
      !force &&
      aggregateData.value !== null &&
      Date.now() - lastFetchedAt.value < CACHE_TTL_MS
    if (hasFreshCache) return

    try {
      aggregateStatus.value = 'pending'
      aggregateError.value = null

      const requestUrl = buildStorageJsonUrl(config.public.supabaseUrl)
      const payload = await $fetch<unknown>(requestUrl, {
        method: 'GET',
      })
      const normalized = normalizeAggregateJson(payload)
      if (!normalized) {
        throw new Error('Invalid community aggregate JSON payload')
      }

      aggregateData.value = normalized
      aggregateStatus.value = 'success'
      lastFetchedAt.value = Date.now()
    } catch (error) {
      aggregateStatus.value = 'error'
      aggregateError.value =
        error instanceof Error
          ? error.message
          : 'Failed to load community aggregate data'
    }
  }

  const getModeSnapshot = (
    mode: TierMode
  ): CommunityAggregateModeSnapshot | null => {
    return aggregateData.value?.modes?.[mode] ?? null
  }

  const getEntrySnapshot = (
    modeSnapshot: CommunityAggregateModeSnapshot | null,
    entryId: string
  ): CommunityAggregateEntry | null => {
    if (!modeSnapshot) return null
    return (
      modeSnapshot.entries.find((entry) => entry.entry_id === entryId) ?? null
    )
  }

  const getHigherThanPercent = (
    entry: CommunityAggregateEntry | null,
    userTier: CommunityAggregateTierKey | null
  ): number | null => {
    if (!entry || !userTier || entry.votes <= 0) return null

    const rankedTierIndex = tierRankIndexByKey[userTier]
    const lowerRankCount = COMMUNITY_TIER_KEYS.reduce((acc, tierKey) => {
      if (tierRankIndexByKey[tierKey] <= rankedTierIndex) return acc
      return acc + (entry.tier_counts[tierKey] ?? 0)
    }, 0)

    return Math.round((lowerRankCount / entry.votes) * 100)
  }

  return {
    aggregateData: readonly(aggregateData),
    aggregateStatus: readonly(aggregateStatus),
    aggregateError: readonly(aggregateError),
    fetchAggregateJson,
    getModeSnapshot,
    getEntrySnapshot,
    getHigherThanPercent,
  }
}
