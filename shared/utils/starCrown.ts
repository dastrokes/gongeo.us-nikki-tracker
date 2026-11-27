// Star Crown (game quality 8). Catalog data keeps quality 8; banner data puts
// these outfits on the 5-star pull track, which game pull history reports.
export const STAR_CROWN_QUALITY = 8

export const isStarCrownQuality = (quality?: number | null) =>
  quality === STAR_CROWN_QUALITY

// Each Deep-Sea Treasure Box claimed at these Resonance counts grants one
// missing piece. Box pieces are absent from game pull history, so completion
// adds the boxes earned by the banner's pull count.
const STAR_CROWN_OUTFITS: Record<string, { boxPullThresholds: number[] }> = {
  // Where Stars Shine Again (banner 83, 3.0)
  '10529': { boxPullThresholds: [50, 110, 200, 240] },
}

export const isStarCrownOutfit = (outfitId: string | number) =>
  String(outfitId) in STAR_CROWN_OUTFITS

export const getStarCrownBoxPieceCount = (
  outfitId: string,
  totalPulls: number
) =>
  STAR_CROWN_OUTFITS[outfitId]?.boxPullThresholds.filter(
    (threshold) => totalPulls >= threshold
  ).length ?? 0

export const getObtainedOutfitPieceCount = (
  outfitId: string,
  pulledPieceCount: number,
  totalItems: number,
  totalPulls: number
) =>
  Math.min(
    totalItems,
    pulledPieceCount + getStarCrownBoxPieceCount(outfitId, totalPulls)
  )
