import { BANNER_DATA } from '~/data/banners'
import type { Banner } from '~/types/banner'
import type { BannerRanking } from '~/types/vote'

/**
 * Get all banners that appeared in version 1.x
 * A banner is considered 1.x if any of its runs has a version starting with "1."
 */
export function getVersion1xBanners(): Banner[] {
  return Object.values(BANNER_DATA).filter((banner) =>
    banner.runs.some((run: { version: string }) => run.version.startsWith('1.'))
  )
}

/**
 * Get banner IDs for version 1.x banners
 */
export function getVersion1xBannerIds(): number[] {
  return getVersion1xBanners().map((banner) => banner.bannerId)
}

/**
 * Get banner IDs for version 1.x banners, excluding permanent banner (ID 1)
 */
export function getVersion1xBannerIdsExcludingPermanent(): number[] {
  return getVersion1xBanners()
    .filter((banner) => banner.bannerId !== 1)
    .map((banner) => banner.bannerId)
}

/**
 * Calculate Elo rating change based on match result
 * Uses standard Elo formula with K-factor of 32
 */
export function calculateEloChange(
  winnerRating: number,
  loserRating: number,
  kFactor: number = 32
): { winnerChange: number; loserChange: number } {
  const expectedWinner =
    1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400))
  const expectedLoser =
    1 / (1 + Math.pow(10, (winnerRating - loserRating) / 400))

  const winnerChange = kFactor * (1 - expectedWinner)
  const loserChange = kFactor * (0 - expectedLoser)

  return { winnerChange, loserChange }
}

/**
 * Calculate exposure-based weights for banners
 * Banners with lower total votes get higher weight
 * Uses dynamic normalization based on min/max votes in the dataset
 * This auto-adjusts as vote counts grow over time
 */
export function calculateExposureWeights(
  rankings: BannerRanking[]
): Map<number, number> {
  const weights = new Map<number, number>()

  if (rankings.length === 0) {
    return weights
  }

  // Find min and max votes for normalization
  const voteCounts = rankings.map((r) => r.total_votes ?? 0)
  const minVotes = Math.min(...voteCounts)
  const maxVotes = Math.max(...voteCounts)
  const voteRange = maxVotes - minVotes

  rankings.forEach((ranking) => {
    const totalVotes = ranking.total_votes ?? 0

    // If all banners have same votes, use uniform weight
    if (voteRange === 0) {
      weights.set(ranking.banner_id, 1.0)
      return
    }

    // Normalize to 0-1 range, then invert (lower votes = higher weight)
    // Add small boost to create more pronounced differences
    const normalized = (totalVotes - minVotes) / voteRange
    const weight = Math.pow(1 - normalized, 2) + 0.1 // Square for emphasis, +0.1 baseline

    weights.set(ranking.banner_id, weight)
  })

  return weights
}

/**
 * Calculate ELO match quality weight between two banners
 * Higher weight for closer ELO ratings
 * Uses dynamic normalization based on actual ELO range in dataset
 *
 * @param elo1 - First banner's ELO rating
 * @param elo2 - Second banner's ELO rating
 * @param eloRange - The range (max - min) of ELO ratings in the dataset
 * @returns Weight between 0 and 1, where 1 = identical ELO, 0 = maximum difference
 */
export function calculateEloMatchQuality(
  elo1: number,
  elo2: number,
  eloRange: number
): number {
  if (eloRange === 0) return 1.0 // All banners have same ELO

  const eloDiff = Math.abs(elo1 - elo2)
  const normalizedDiff = eloDiff / eloRange // 0 to 1

  // Invert so closer ratings = higher weight
  // Use exponential decay for smoother weighting
  return Math.exp(-normalizedDiff * 3) // e^(-3x) gives good decay curve
}

/**
 * Calculate combined weight for second banner selection
 * Combines exposure weight and ELO match quality
 * Uses multiplicative combination: exposure^0.3 * elo_quality^0.7
 */
export function calculateCombinedWeight(
  exposureWeight: number,
  eloQuality: number,
  exposureExponent: number = 0.3,
  eloExponent: number = 0.7
): number {
  return (
    Math.pow(exposureWeight, exposureExponent) *
    Math.pow(eloQuality, eloExponent)
  )
}

/**
 * Select a random banner based on weights using weighted random selection
 */
export function selectBannerByWeight(
  bannerIds: number[],
  weights: Map<number, number>
): number {
  if (bannerIds.length === 0) {
    throw new Error('No banners available')
  }

  // If no weights provided, use uniform distribution
  if (weights.size === 0) {
    return bannerIds[Math.floor(Math.random() * bannerIds.length)]!
  }

  // Calculate total weight
  let totalWeight = 0
  const weightArray: Array<{ id: number; weight: number; cumulative: number }> =
    []

  bannerIds.forEach((id) => {
    const weight = weights.get(id) ?? 1.0
    totalWeight += weight
    weightArray.push({
      id,
      weight,
      cumulative: totalWeight,
    })
  })

  // Select random point
  const random = Math.random() * totalWeight

  // Find which banner this corresponds to
  for (const item of weightArray) {
    if (random <= item.cumulative) {
      return item.id
    }
  }

  // Fallback to last item (shouldn't happen)
  return weightArray[weightArray.length - 1]!.id
}

export interface VoteHistory {
  lastPairs: Array<{ banner1: number; banner2: number }>
  lastBanners: number[]
}

/**
 * Two-stage banner pair selection with history tracking
 * Stage 1: Select first banner based purely on exposure (underexposed items prioritized)
 * Stage 2: Select second banner based on combined exposure + ELO match quality
 * Final: Randomize the order of banner1 and banner2 to avoid position bias
 *
 * History rules:
 * - Single banners should not repeat from last 5 pairs (10 individual banner slots)
 * - Pairs should not repeat from last 10 pairs
 *
 * @param rankings - Banner rankings with ELO and vote counts
 * @param bannerIds - Available banner IDs to choose from
 * @param history - Optional vote history from localStorage
 */
export function selectBannerPair(
  rankings: BannerRanking[],
  bannerIds: number[],
  history?: VoteHistory
): { banner1: number; banner2: number } {
  // Filter out banners that appeared in last 5 pairs (10 individual banner slots)
  const recentBanners = new Set(history?.lastBanners ?? [])
  const eligibleBannerIds = bannerIds.filter((id) => !recentBanners.has(id))

  // If not enough eligible banners, use all banners
  const selectableBannerIds =
    eligibleBannerIds.length >= 2 ? eligibleBannerIds : bannerIds

  // Stage 1: Select first banner based on exposure
  const exposureWeights = calculateExposureWeights(rankings)
  const firstSelected = selectBannerByWeight(
    selectableBannerIds,
    exposureWeights
  )

  // Get first banner's ELO rating
  const firstSelectedRanking = rankings.find(
    (r) => r.banner_id === firstSelected
  )
  const firstSelectedElo = firstSelectedRanking?.elo_rating ?? 1500

  // Calculate ELO range for normalization
  const eloRatings = rankings.map((r) => r.elo_rating ?? 1500)
  const minElo = Math.min(...eloRatings)
  const maxElo = Math.max(...eloRatings)
  const eloRange = maxElo - minElo

  // Stage 2: Select second banner from remaining banners, excluding pairs from last 10
  const recentPairs = new Set(
    (history?.lastPairs ?? []).map((pair) =>
      [pair.banner1, pair.banner2].sort().join('-')
    )
  )

  const remainingBannerIds = selectableBannerIds.filter((id) => {
    if (id === firstSelected) return false

    // Check if this pair was used recently
    const pairKey = [firstSelected, id].sort().join('-')
    return !recentPairs.has(pairKey)
  })

  // If all pairs with firstSelected are recent, use all remaining banners
  const secondStageBannerIds =
    remainingBannerIds.length > 0
      ? remainingBannerIds
      : selectableBannerIds.filter((id) => id !== firstSelected)

  const combinedWeights = new Map<number, number>()

  secondStageBannerIds.forEach((bannerId) => {
    const ranking = rankings.find((r) => r.banner_id === bannerId)
    const bannerElo = ranking?.elo_rating ?? 1500

    const exposureWeight = exposureWeights.get(bannerId) ?? 1.0
    const eloQuality = calculateEloMatchQuality(
      firstSelectedElo,
      bannerElo,
      eloRange
    )
    const combinedWeight = calculateCombinedWeight(exposureWeight, eloQuality)

    combinedWeights.set(bannerId, combinedWeight)
  })

  const secondSelected = selectBannerByWeight(
    secondStageBannerIds,
    combinedWeights
  )

  // Randomize the order to avoid position bias
  const shouldSwap = Math.random() < 0.5

  return shouldSwap
    ? { banner1: secondSelected, banner2: firstSelected }
    : { banner1: firstSelected, banner2: secondSelected }
}
