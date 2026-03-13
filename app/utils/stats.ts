import { BANNER_DATA } from '~~/data/banners'
import OUTFIT_DATA, { type OutfitKey } from '~~/data/outfits'

export function computeGlobalStats(
  processed: Record<string, ProcessedBanner>
): GlobalStats {
  const globalStats: GlobalStats = {
    totalPulls: 0,
    total4StarItems: 0,
    total5StarItems: 0,
    total4StarOnlyItems: 0,
    avg5StarPulls: 0,
    avg4StarPulls: 0,
    avg4StarOnlyPulls: 0,
  }

  let total4StarPulls = 0
  let total5StarPulls = 0
  let total4StarOnlyPulls = 0
  let fourStarCount = 0
  let fiveStarCount = 0
  let fourStarOnlyCount = 0

  Object.values(processed).forEach((banner) => {
    if (!banner?.stats) return

    globalStats.totalPulls += banner.stats.totalPulls

    if (banner.bannerType !== 1) {
      // Mixed/limited banners contribute 4★ and 5★ stats
      globalStats.total4StarItems += banner.stats.total4StarItems
      globalStats.total5StarItems += banner.stats.total5StarItems
    }

    // 4★-only items accumulate separately and also add to overall 4★-only totals
    globalStats.total4StarOnlyItems += banner.stats.total4StarOnlyItems

    if (banner.bannerType === 2) {
      // Limited 5★ with 4★
      total4StarPulls += banner.stats.total4StarPulls
      total5StarPulls += banner.stats.total5StarPulls
      fourStarCount += banner.stats.total4StarItems
      fiveStarCount += banner.stats.total5StarItems
    } else if (banner.bannerType === 3) {
      // 4★-only banners
      total4StarOnlyPulls += banner.stats.total4StarOnlyPulls
      fourStarOnlyCount += banner.stats.total4StarOnlyItems
    }
  })

  globalStats.avg4StarPulls =
    fourStarCount > 0 ? total4StarPulls / fourStarCount : 0
  globalStats.avg5StarPulls =
    fiveStarCount > 0 ? total5StarPulls / fiveStarCount : 0
  globalStats.avg4StarOnlyPulls =
    fourStarOnlyCount > 0 ? total4StarOnlyPulls / fourStarOnlyCount : 0

  return globalStats
}

// Map banner id to its outfit ids
export function getBannerOutfitIds(bannerId: number) {
  const banner = (BANNER_DATA as BannerData)[bannerId]
  if (!banner) return { outfit4StarId: [], outfit5StarId: [] }
  return {
    outfit4StarId: banner.outfit4StarId || [],
    outfit5StarId: banner.outfit5StarId || [],
  }
}

// Safe access to outfit data
export function getOutfitData(outfitId: string): Outfit | null {
  try {
    return OUTFIT_DATA[outfitId as OutfitKey] || null
  } catch (error) {
    console.error(`Failed to load outfit ${outfitId}:`, error)
    return null
  }
}

// Helper to derive outfit ID from an item ID
export function getOutfitIdFromItemId(itemId: string): string {
  const last4Digits = itemId.slice(-4)
  return `1${last4Digits}`
}
