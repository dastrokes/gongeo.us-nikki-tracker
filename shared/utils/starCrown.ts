// Star Crown (game quality 8). Catalog data keeps quality 8; banner data puts
// these outfits on the 5-star pull track, which game pull history reports.
export const STAR_CROWN_QUALITY = 8

export const isStarCrownQuality = (quality?: number | null) =>
  quality === STAR_CROWN_QUALITY

// A Deep-Sea Treasure Box is claimed at each of these Resonance counts and
// opens once the pull (or 10-pull) that crossed the threshold finishes. Each
// box grants one piece the current set is missing. Box pieces never appear in
// game pull history and do not count as pulls or toward pity.
const STAR_CROWN_OUTFITS: Record<string, { boxPullThresholds: number[] }> = {
  // Where Stars Shine Again (banner 83, 3.0)
  '10529': { boxPullThresholds: [50, 110, 200, 240] },
}

export const isStarCrownOutfit = (outfitId: string | number) =>
  String(outfitId) in STAR_CROWN_OUTFITS

export const getStarCrownBoxesEarned = (outfitId: string, totalPulls: number) =>
  STAR_CROWN_OUTFITS[outfitId]?.boxPullThresholds.filter(
    (threshold) => totalPulls >= threshold
  ).length ?? 0

// `obtainedAt` of processed box reward rows, which have no pull time.
export const STAR_CROWN_BOX_OBTAINED_AT = 'box'

export const isStarCrownBoxReward = (
  value: unknown
): value is StarCrownBoxReward => {
  if (!value || typeof value !== 'object') return false
  const row = value as Partial<StarCrownBoxReward>
  return (
    typeof row.itemId === 'string' &&
    typeof row.round === 'number' &&
    (row.source === 'pearpal' || row.source === 'manual')
  )
}

// Convert Pear-Pal `cloth_random_box_list` rewards into box rewards by banner.
// Every listed banner gets an entry, empty when Pear-Pal reports no boxes, so a
// re-import replaces that banner's stored rewards (including manual ones).
export const getStarCrownBoxesFromPearpal = (
  boxList: PearpalClothRandomBoxItem[],
  bannerIds: number[]
): Record<number, StarCrownBoxReward[]> => {
  const boxesByBanner: Record<number, StarCrownBoxReward[]> =
    Object.fromEntries(bannerIds.map((bannerId) => [bannerId, []]))

  boxList.forEach((box) => {
    boxesByBanner[Number(box.card_pool_id)]?.push({
      itemId: String(box.reward_item_id),
      round: Number(box.suit_round) || 0,
      source: 'pearpal',
      pieceIndex: Number(box.suit_piece_index),
    })
  })

  return boxesByBanner
}

// Manual box reward for a piece: the k-th box copy of a piece is assumed to
// fill set k (a box gives a piece the current set is missing).
export const createManualStarCrownBoxReward = (
  itemId: string,
  existingRewards: StarCrownBoxReward[]
): StarCrownBoxReward => ({
  itemId,
  round: existingRewards.filter((reward) => reward.itemId === itemId).length,
  source: 'manual',
})

export const getStarCrownBoxItemIds = (
  rewards: StarCrownBoxReward[] | undefined
) => (rewards ?? []).filter(isStarCrownBoxReward).map((reward) => reward.itemId)

// `obtainedPieceCount` is the number of distinct outfit pieces from pulls,
// manual edits and recorded box rewards. Only when no box reward is recorded
// for the outfit are earned boxes estimated from the banner's pull count.
export const getObtainedOutfitPieceCount = (
  outfitId: string,
  obtainedPieceCount: number,
  totalItems: number,
  totalPulls: number,
  hasBoxRecords: boolean
) =>
  Math.min(
    totalItems,
    obtainedPieceCount +
      (hasBoxRecords ? 0 : getStarCrownBoxesEarned(outfitId, totalPulls))
  )

// Star Crown outfits sit on the 5-star pull track, so tracker data stores
// them as quality 5; display them with the Star Crown quality instead.
export const getDisplayQuality = (
  quality: number,
  outfitId: string | number
) => (isStarCrownOutfit(outfitId) ? STAR_CROWN_QUALITY : quality)
