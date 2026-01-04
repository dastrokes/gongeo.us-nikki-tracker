import { BANNER_DATA } from '~/data/banners'
import type { Banner } from '~/types/banner'

/**
 * Find all banners that contain a specific outfit ID
 * @param outfitId - The outfit ID to search for (as string, e.g., '10126')
 * @returns Array of banner objects that contain this outfit
 */
export function findBannersForOutfit(outfitId: string): Banner[] {
  const banners: Banner[] = []
  
  for (const banner of Object.values(BANNER_DATA)) {
    if (
      banner.outfit4StarId.includes(outfitId) ||
      banner.outfit5StarId.includes(outfitId)
    ) {
      banners.push(banner)
    }
  }
  
  return banners
}

/**
 * Get the primary (first) banner for an outfit
 * @param outfitId - The outfit ID to search for (as string, e.g., '10126')
 * @returns The first banner containing this outfit, or null if not found
 */
export function getBannerForOutfit(outfitId: string): Banner | null {
  const banners = findBannersForOutfit(outfitId)
  return banners[0] ?? null
}
