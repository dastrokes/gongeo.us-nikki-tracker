import { BANNER_DATA } from '~/data/banners'
import OUTFIT_DATA from '~/data/outfits'
import type { Banner } from '~/types/banner'

/**
 * Find all banners that contain outfits or deep echo rewards with a specific item
 * @param itemId - The item ID to search for (as number, e.g., 1021720020)
 * @returns Array of banner objects that contain this item via outfits or deep echo rewards
 */
export function findBannersForItem(itemId: number): Banner[] {
  const banners: Banner[] = []
  const itemIdStr = String(itemId)

  // Find all outfits that contain this item
  const outfitsWithItem = new Set<string>()
  for (const [outfitId, outfit] of Object.entries(OUTFIT_DATA)) {
    if (outfit.items.includes(itemIdStr)) {
      outfitsWithItem.add(outfitId)
    }
  }

  // Find banners that contain these outfits
  for (const banner of Object.values(BANNER_DATA)) {
    const hasOutfit =
      banner.outfit4StarId.some((id: string) => outfitsWithItem.has(id)) ||
      banner.outfit5StarId.some((id: string) => outfitsWithItem.has(id))
    const hasDeepEcho = banner.rewardIds?.includes(itemIdStr) ?? false

    if (hasOutfit || hasDeepEcho) {
      banners.push(banner)
    }
  }

  return banners
}

/**
 * Get the banner for an item
 * @param itemId - The item ID to search for (as number, e.g., 1021720020)
 * @returns The banner containing this item (outfit or deep echo reward), or null if not found
 */
export function getinBannerForItem(itemId: number): Banner | null {
  const banners = findBannersForItem(itemId)
  return banners.length > 0 ? (banners[0] ?? null) : null
}
