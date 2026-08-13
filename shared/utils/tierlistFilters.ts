export type TierlistMode =
  'banners' | 'outfits' | 'items' | 'makeups' | 'momo' | 'props'

export const supportsTierlistStyleFilter = (mode: TierlistMode): boolean =>
  mode === 'items' || mode === 'outfits' || mode === 'makeups'

export const normalizeTierlistStyleFilter = (
  mode: TierlistMode,
  value: string | null
): string | null => (supportsTierlistStyleFilter(mode) ? value : null)
