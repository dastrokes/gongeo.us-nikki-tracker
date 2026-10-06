import { BANNER_DATA } from '../../data/banners'
import type { BannerWishlistData } from '../types/bannerWishlist'

export const createEmptyBannerWishlist = (): BannerWishlistData => ({
  version: 1,
  entries: [],
})

export const normalizeBannerWishlist = (value: unknown): BannerWishlistData => {
  if (
    !value ||
    typeof value !== 'object' ||
    !('version' in value) ||
    value.version !== 1 ||
    !('entries' in value) ||
    !Array.isArray(value.entries)
  ) {
    throw new Error('Invalid banner wish list')
  }

  const entries = new Map<number, BannerWishlistData['entries'][number]>()
  for (const entry of value.entries) {
    if (!entry || typeof entry !== 'object') continue
    const banner = BANNER_DATA[entry.bannerId]
    if (!Number.isInteger(entry.bannerId) || !banner) continue
    entries.set(banner.bannerId, {
      bannerId: banner.bannerId,
    })
  }
  return { version: 1, entries: [...entries.values()] }
}
