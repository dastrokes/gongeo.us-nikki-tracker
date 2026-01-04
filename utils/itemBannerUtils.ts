import { BANNER_DATA } from '~/data/banners'
import OUTFIT_DATA from '~/data/outfits'
import type { Banner } from '~/types/banner'

/**
 * Find all banners that contain outfits which include a specific item
 * @param itemId - The item ID to search for (as number, e.g., 1021720020)
 * @returns Array of banner objects that contain outfits with this item
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
    const hasOutfit = banner.outfit4StarId.some((id: string) => outfitsWithItem.has(id)) ||
                      banner.outfit5StarId.some((id: string) => outfitsWithItem.has(id))
    
    if (hasOutfit) {
      banners.push(banner)
    }
  }
  
  return banners
}

/**
 * Get the primary (first) banner for an item
 * @param itemId - The item ID to search for (as number, e.g., 1021720020)
 * @returns The first banner containing an outfit with this item, or null if not found
 */
export function getinBannerForItem(itemId: number): Banner | null {
  const banners = findBannersForItem(itemId)
  return banners.length > 0 ? banners[0] ?? null : null
}
