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
 * Calculate exposure weights for banners
 * Banners with lower exposure get higher weight
 */
export function calculateExposureWeights(
  rankings: BannerRanking[],
  baseWeight: number = 1.0
): Map<number, number> {
  const weights = new Map<number, number>()

  if (rankings.length === 0) {
    return weights
  }

  // Find max exposure to normalize
  const maxExposure = Math.max(...rankings.map((r) => r.exposure_count ?? 0), 1)

  rankings.forEach((ranking) => {
    // Inverse relationship: lower exposure = higher weight
    // Add 1 to avoid division by zero
    const exposureCount = ranking.exposure_count ?? 0
    const exposureRatio = exposureCount / (maxExposure + 1)
    const weight = baseWeight * (1 + (1 - exposureRatio))
    weights.set(ranking.banner_id, weight)
  })

  return weights
}

/**
 * Select a random banner based on exposure weights
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
