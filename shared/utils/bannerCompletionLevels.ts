export type BannerOutfitVariantLevel =
  | 'base'
  | 'glowup'
  | 'evo1'
  | 'evo2'
  | 'evo3'

export type BannerOutfitVariantLevelInput = {
  quality: number
  totalPulls: number
  outfitCompletion: number
  manualEvoLevel: number
}

export const getBannerOutfitVariantLevels = ({
  quality,
  totalPulls,
  outfitCompletion,
  manualEvoLevel,
}: BannerOutfitVariantLevelInput): BannerOutfitVariantLevel[] => {
  if (outfitCompletion < 1 && manualEvoLevel < 1) return []

  const levels: BannerOutfitVariantLevel[] = ['base', 'glowup']

  if (quality === 5) {
    if (totalPulls >= 180 || manualEvoLevel >= 2) levels.push('evo1')
    if (totalPulls >= 230 || manualEvoLevel >= 3) levels.push('evo2')
    if (outfitCompletion >= 2 || manualEvoLevel >= 4) levels.push('evo3')
    return levels
  }

  if (quality === 4 && outfitCompletion >= 2) {
    levels.push('evo1')
  }

  return levels
}

export const toBannerDisplayLevelKey = (level: BannerOutfitVariantLevel) => {
  if (level === 'base') return '0'
  if (level === 'glowup') return '1'
  if (level === 'evo1') return '2'
  if (level === 'evo2') return '3'
  return '4'
}
