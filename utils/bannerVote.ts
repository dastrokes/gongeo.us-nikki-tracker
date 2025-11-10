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
 * Uses formula: weight = 1 / (total_votes + 1)
 */
export function calculateExposureWeights(
  rankings: BannerRanking[]
): Map<number, number> {
  const weights = new Map<number, number>()

  if (rankings.length === 0) {
    return weights
  }

  rankings.forEach((ranking) => {
    const totalVotes = ranking.total_votes ?? 0
    const weight = 1 / (totalVotes + 1)
    weights.set(ranking.banner_id, weight)
  })

  return weights
}

/**
 * Calculate ELO match quality weight between two banners
 * Higher weight for closer ELO ratings
 * Uses formula: weight = 1 / (1 + |ELO_diff| / scale_factor)
 */
export function calculateEloMatchQuality(
  elo1: number,
  elo2: number,
  scaleFactor: number = 100
): number {
  const eloDiff = Math.abs(elo1 - elo2)
  return 1 / (1 + eloDiff / scaleFactor)
}

/**
 * Calculate combined weight for second banner selection
 * Combines exposure weight and ELO match quality
 * Uses multiplicative combination: exposure^0.3 * elo_quality^0.7
 */
export function calculateCombinedWeight(
  exposureWeight: number,
  eloQuality: number,
  exposureExponent: number = 1.0,
  eloExponent: number = 0.0
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

/**
 * Two-stage banner pair selection
 * Stage 1: Select first banner based purely on exposure (underexposed items prioritized)
 * Stage 2: Select second banner based on combined exposure + ELO match quality
 */
export function selectBannerPair(
  rankings: BannerRanking[],
  bannerIds: number[]
): { banner1: number; banner2: number } {
  // Stage 1: Select first banner based on exposure
  const exposureWeights = calculateExposureWeights(rankings)
  const banner1 = selectBannerByWeight(bannerIds, exposureWeights)

  // Get first banner's ELO rating
  const banner1Ranking = rankings.find((r) => r.banner_id === banner1)
  const banner1Elo = banner1Ranking?.elo_rating ?? 1500

  // Stage 2: Select second banner from remaining banners
  const remainingBannerIds = bannerIds.filter((id) => id !== banner1)
  const combinedWeights = new Map<number, number>()

  remainingBannerIds.forEach((bannerId) => {
    const ranking = rankings.find((r) => r.banner_id === bannerId)
    const bannerElo = ranking?.elo_rating ?? 1500

    const exposureWeight = exposureWeights.get(bannerId) ?? 1.0
    const eloQuality = calculateEloMatchQuality(banner1Elo, bannerElo)
    const combinedWeight = calculateCombinedWeight(exposureWeight, eloQuality)

    combinedWeights.set(bannerId, combinedWeight)
  })

  const banner2 = selectBannerByWeight(remainingBannerIds, combinedWeights)

  return { banner1, banner2 }
}

/**
 * Generate a fingerprint for anonymous voting using FingerprintJS
 * This provides a more reliable and accurate browser fingerprint
 */
export async function generateVoterFingerprint(): Promise<string> {
  if (typeof window === 'undefined') {
    return 'server-' + Date.now().toString()
  }

  try {
    const FingerprintJS = await import('@fingerprintjs/fingerprintjs')
    const fp = await FingerprintJS.load()
    const result = await fp.get()
    return result.visitorId
  } catch (error) {
    console.error('Failed to generate fingerprint:', error)
    // Fallback to timestamp-based ID
    return (
      'fallback-' +
      Date.now().toString() +
      '-' +
      Math.random().toString(36).substring(7)
    )
  }
}
