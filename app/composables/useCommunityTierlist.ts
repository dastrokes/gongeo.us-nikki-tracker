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

const tierScoreByKey: Record<CommunityAggregateTierKey, number> = {
  S: 5,
  A: 4,
  B: 3,
  C: 2,
  D: 1,
  F: 0,
}

// 0 = pure average tier, 1 = pure plurality tier.
const COMMUNITY_TIER_BALANCE_WEIGHT = 0.5

const clampTierScore = (score: number): number =>
  Math.max(0, Math.min(5, score))

const COMMUNITY_TIER_THRESHOLD_STEP = 0.8 as const

const COMMUNITY_TIER_SCORE_THRESHOLDS: ReadonlyArray<
  readonly [CommunityAggregateTierKey, number]
> = COMMUNITY_TIER_KEYS.map((tier, index, tiers) => {
  const minScore = (tiers.length - 1 - index) * COMMUNITY_TIER_THRESHOLD_STEP
  return [tier, minScore] as const
})

const resolveTierFromScore = (score: number): CommunityAggregateTierKey => {
  const normalizedScore = clampTierScore(score)
  return (
    COMMUNITY_TIER_SCORE_THRESHOLDS.find(
      ([, minScore]) => normalizedScore >= minScore
    )?.[0] ?? 'F'
  )
}

const resolveTiedTier = (
  tiers: readonly CommunityAggregateTierKey[],
  targetScore: number
): CommunityAggregateTierKey => {
  if (tiers.length === 0) return 'C'
  if (tiers.length === 1) return tiers[0]!

  return tiers.reduce((bestTier, tier) => {
    const bestDistance = Math.abs(tierScoreByKey[bestTier] - targetScore)
    const distance = Math.abs(tierScoreByKey[tier] - targetScore)

    if (distance < bestDistance) return tier
    if (distance > bestDistance) return bestTier
    return tierRankIndexByKey[tier] < tierRankIndexByKey[bestTier]
      ? tier
      : bestTier
  })
}

const evaluateCommunityTier = (
  counts: CommunityAggregateTierCounts,
  fallbackScore: number
): { consensusScore: number; absoluteTier: CommunityAggregateTierKey } => {
  let totalVotes = 0
  let weightedScoreSum = 0
  let maxVotes = 0
  let topTiers: CommunityAggregateTierKey[] = []

  COMMUNITY_TIER_KEYS.forEach((tier) => {
    const count = Math.max(0, counts[tier] ?? 0)
    totalVotes += count
    weightedScoreSum += count * tierScoreByKey[tier]

    if (count > maxVotes) {
      maxVotes = count
      topTiers = [tier]
    } else if (count === maxVotes && count > 0) {
      topTiers.push(tier)
    }
  })

  if (totalVotes <= 0)
    return {
      consensusScore: clampTierScore(fallbackScore),
      absoluteTier: resolveTierFromScore(fallbackScore),
    }

  const meanScore = weightedScoreSum / totalVotes
  if (topTiers.length === 0)
    return {
      consensusScore: meanScore,
      absoluteTier: resolveTierFromScore(meanScore),
    }

  const pluralityTier = resolveTiedTier(topTiers, meanScore)
  const pluralityScore = tierScoreByKey[pluralityTier]
  const balanceWeight = Math.max(0, Math.min(1, COMMUNITY_TIER_BALANCE_WEIGHT))
  const consensusScore = clampTierScore(
    meanScore + (pluralityScore - meanScore) * balanceWeight
  )
  const absoluteTier = resolveTierFromScore(consensusScore)

  return {
    consensusScore,
    absoluteTier,
  }
}

export const hasEnoughCommunityVotes = (votes: number): boolean =>
  votes >= COMMUNITY_MIN_VOTES_FOR_RANKING

export const buildCommunityModePreview = (
  modeSnapshot: CommunityAggregateModeSnapshot | null,
  scopeEntryIds: readonly string[]
): CommunityModePreview => {
  const entries = modeSnapshot?.entries ?? []
  const scopeEntryIdSet = new Set(scopeEntryIds)
  const voteByEntryId = new Map<string, number>()

  entries.forEach((entry) => {
    voteByEntryId.set(entry.entry_id, Math.max(0, Math.floor(entry.votes)))
  })

  const rankableEntries = entries.filter(
    (entry) =>
      scopeEntryIdSet.has(entry.entry_id) &&
      hasEnoughCommunityVotes(entry.votes)
  )

  const rankedEntries: CommunityRankedPreviewEntry[] = []
  if (rankableEntries.length > 0) {
    const ranked = rankableEntries
      .map((entry) => {
        const { consensusScore, absoluteTier } = evaluateCommunityTier(
          entry.tier_counts,
          entry.avg_score
        )

        return {
          entry,
          consensusScore,
          absoluteTier,
        }
      })
      .sort((a, b) => {
        const aTierRank = tierRankIndexByKey[a.absoluteTier]
        const bTierRank = tierRankIndexByKey[b.absoluteTier]
        if (aTierRank !== bTierRank) return aTierRank - bTierRank

        if (b.consensusScore !== a.consensusScore)
          return b.consensusScore - a.consensusScore
        if (b.entry.votes !== a.entry.votes)
          return b.entry.votes - a.entry.votes
        if (b.entry.avg_score !== a.entry.avg_score)
          return b.entry.avg_score - a.entry.avg_score
        return a.entry.rank - b.entry.rank
      })

    ranked.forEach((item, index) => {
      rankedEntries.push({
        entryId: item.entry.entry_id,
        rank: index + 1,
        tier: item.absoluteTier,
        votes: item.entry.votes,
      })
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

      const requestUrl = `${config.public.supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${STORAGE_OBJECT_PATH}`
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
