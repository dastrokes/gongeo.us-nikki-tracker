import {
  COMMUNITY_TIER_KEYS,
  type TierMode,
} from '../../shared/utils/communityTierlistScope'

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

type CommunityPublication = {
  generated_at: string
  source_captured_at: string
}

type CommunityModeCache = {
  snapshot: CommunityAggregateModeSnapshot | null
  publication: CommunityPublication | null
  fetchedAt: number | null
  retryAfter: number | null
  status: 'idle' | 'pending' | 'success' | 'error'
  error: string | null
}

const COMMUNITY_SNAPSHOT_TTL_MS = 24 * 60 * 60 * 1000
const COMMUNITY_RETRY_COOLDOWN_MS = 60 * 1000

// Requests run only in the browser; callers opening the same view share work.
const aggregateRequests = new Map<TierMode, Promise<void>>()

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

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

export const useCommunityTierlist = (activeMode: Ref<TierMode>) => {
  const cache = useState<Partial<Record<TierMode, CommunityModeCache>>>(
    'community-tierlist-aggregate:data-api',
    () => ({})
  )
  const aggregateStatus = computed(
    () => cache.value[activeMode.value]?.status ?? 'idle'
  )
  const aggregateError = computed(
    () => cache.value[activeMode.value]?.error ?? null
  )
  const publication = computed(
    () => cache.value[activeMode.value]?.publication ?? null
  )
  const entryIndexes = new WeakMap<
    CommunityAggregateModeSnapshot,
    Map<string, CommunityAggregateEntry>
  >()

  const fetchAggregateJson = async (): Promise<void> => {
    if (!import.meta.client) return
    const mode = activeMode.value
    const pending = aggregateRequests.get(mode)
    if (pending) return pending

    const previous = cache.value[mode]
    const now = Date.now()
    const age = previous?.fetchedAt == null ? null : now - previous.fetchedAt
    if (
      previous?.snapshot &&
      age !== null &&
      age >= 0 &&
      age < COMMUNITY_SNAPSHOT_TTL_MS
    ) {
      return
    }
    if (previous?.retryAfter != null && now < previous.retryAfter) return

    cache.value[mode] = {
      snapshot: previous?.snapshot ?? null,
      publication: previous?.publication ?? null,
      fetchedAt: previous?.fetchedAt ?? null,
      retryAfter: null,
      status: 'pending',
      error: null,
    }
    const request = (async () => {
      try {
        const response = await $fetch<unknown>(
          getDataApiUrl(`/tierlists/${mode}`),
          { retry: 0, timeout: 15000 }
        )
        if (
          !isRecord(response) ||
          response.schema_version !== 2 ||
          response.mode !== mode ||
          typeof response.generated_at !== 'string' ||
          !Number.isFinite(Date.parse(response.generated_at)) ||
          typeof response.source_captured_at !== 'string' ||
          !Number.isFinite(Date.parse(response.source_captured_at)) ||
          !isRecord(response.payload) ||
          !Number.isSafeInteger(response.payload.total_submissions) ||
          (response.payload.total_submissions as number) < 0 ||
          !Array.isArray(response.payload.entries)
        )
          throw new Error('Invalid community snapshot')
        const snapshot = normalizeMode(response.payload)
        if (snapshot.entries.length !== response.payload.entries.length)
          throw new Error('Invalid community entries')
        cache.value[mode] = {
          snapshot,
          publication: {
            generated_at: response.generated_at,
            source_captured_at: response.source_captured_at,
          },
          fetchedAt: Date.now(),
          retryAfter: null,
          status: 'success',
          error: null,
        }
      } catch {
        cache.value[mode] = {
          snapshot: previous?.snapshot ?? null,
          publication: previous?.publication ?? null,
          fetchedAt: previous?.fetchedAt ?? null,
          retryAfter: Date.now() + COMMUNITY_RETRY_COOLDOWN_MS,
          status: 'error',
          error: 'tierlist.community_insights.error',
        }
      }
    })()
    aggregateRequests.set(mode, request)
    try {
      await request
    } finally {
      aggregateRequests.delete(mode)
    }
  }

  const getModeSnapshot = (
    mode: TierMode
  ): CommunityAggregateModeSnapshot | null => {
    return cache.value[mode]?.snapshot ?? null
  }

  const getEntrySnapshot = (
    modeSnapshot: CommunityAggregateModeSnapshot | null,
    entryId: string
  ): CommunityAggregateEntry | null => {
    if (!modeSnapshot) return null
    let index = entryIndexes.get(modeSnapshot)
    if (!index) {
      index = new Map()
      for (const entry of modeSnapshot.entries) {
        if (!index.has(entry.entry_id)) index.set(entry.entry_id, entry)
      }
      entryIndexes.set(modeSnapshot, index)
    }
    return index.get(entryId) ?? null
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
    aggregateStatus,
    aggregateError,
    publication,
    fetchAggregateJson,
    getModeSnapshot,
    getEntrySnapshot,
    getHigherThanPercent,
  }
}
