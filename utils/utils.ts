import type { BannerData } from '~/types/banner'
import { BANNER_DATA } from '~/data/banners'
import type { Outfit } from '~/types/outfit'
import OUTFIT_DATA, { type OutfitKey } from '~/data/outfits'

export function getBannerOutfitIds(bannerId: number) {
  const banner = (BANNER_DATA as BannerData)[bannerId]
  if (!banner) return { outfit4StarId: [], outfit5StarId: [] }
  return {
    outfit4StarId: banner.outfit4StarId || [],
    outfit5StarId: banner.outfit5StarId || [],
  }
}

export function getOutfitData(outfitId: string): Outfit | null {
  try {
    return OUTFIT_DATA[outfitId as OutfitKey] || null
  } catch (error) {
    console.error(`Failed to load outfit ${outfitId}:`, error)
    return null
  }
}
