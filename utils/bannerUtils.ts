import { BANNER_DATA } from '~/data/banners'
import OUTFIT_DATA from '~/data/outfits'
import type { Banner } from '~/types/banner'

const bannerContainsOutfit = (banner: Banner, outfitId: string) =>
  banner.outfit4StarId.includes(outfitId) ||
  banner.outfit5StarId.includes(outfitId)

const getOutfitsContainingItem = (itemId: string) => {
  const outfitsWithItem = new Set<string>()
  for (const [outfitId, outfit] of Object.entries(OUTFIT_DATA)) {
    if (outfit.items.includes(itemId)) {
      outfitsWithItem.add(outfitId)
    }
  }
  return outfitsWithItem
}

/**
 * Find all banners that contain a specific outfit ID
 * @param outfitId - The outfit ID to search for (as string, e.g., '10126')
 * @returns Array of banner objects that contain this outfit
 */
export function findBannersForOutfit(outfitId: string): Banner[] {
  const banners: Banner[] = []

  for (const banner of Object.values(BANNER_DATA)) {
    if (bannerContainsOutfit(banner, outfitId)) {
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

/**
 * Find all banners that contain outfits or deep echo rewards with a specific item
 * @param itemId - The item ID to search for (as number or string, e.g., 1021720020)
 * @returns Array of banner objects that contain this item via outfits or deep echo rewards
 */
export function findBannersForItem(itemId: number | string): Banner[] {
  const banners: Banner[] = []
  const itemIdStr = String(itemId)
  const outfitsWithItem = getOutfitsContainingItem(itemIdStr)

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
 * @param itemId - The item ID to search for (as number or string, e.g., 1021720020)
 * @returns The banner containing this item (outfit or deep echo reward), or null if not found
 */
export function getBannerForItem(itemId: number | string): Banner | null {
  const banners = findBannersForItem(itemId)
  return banners.length > 0 ? (banners[0] ?? null) : null
}
