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

export const getStarCrownBoxThresholds = (outfitId: string) =>
  STAR_CROWN_OUTFITS[outfitId]?.boxPullThresholds ?? []

export const getStarCrownBoxesEarned = (outfitId: string, totalPulls: number) =>
  getStarCrownBoxThresholds(outfitId).filter(
    (threshold) => totalPulls >= threshold
  ).length

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

  // Pear-Pal is assumed to list boxes as they opened, so list order gives
  // the box. suit_piece_index is not a stable piece slot (the same piece came
  // with 2 in the first set and 0 in the second), so it is kept but not used.
  boxList.forEach((box) => {
    const rewards = boxesByBanner[Number(box.card_pool_id)]
    rewards?.push({
      itemId: String(box.reward_item_id),
      round: Number(box.suit_round) || 0,
      source: 'pearpal',
      pieceIndex: Number(box.suit_piece_index),
      boxIndex: rewards.length,
    })
  })

  return boxesByBanner
}

// Manual box rewards from the box editor, one entry per box slot (null = empty
// box, not stored; empty earned boxes still count through the estimate). `roundOf`
// gives each box's set (see getStarCrownBoxRound); without it, the k-th box
// copy of a piece is assumed to fill set k.
export const createManualStarCrownBoxRewards = (
  itemIdsByBox: readonly (string | null)[],
  roundOf?: (boxIndex: number) => number
): StarCrownBoxReward[] => {
  const rewards: StarCrownBoxReward[] = []
  itemIdsByBox.forEach((itemId, boxIndex) => {
    if (!itemId) return
    rewards.push({
      itemId,
      round:
        roundOf?.(boxIndex) ??
        rewards.filter((reward) => reward.itemId === itemId).length,
      source: 'manual',
      boxIndex,
    })
  })
  return rewards
}

export interface StarCrownPiecePull {
  itemId: string
  // 1-based position in the banner's pull history
  pullIndex: number
}

// For each earned box, the pull it opens after: the last pull of the batch
// (same timestamp) that crossed its threshold. Without pull times (Pear-Pal),
// the threshold pull itself.
export const getStarCrownBoxOpenAfter = (
  outfitId: string,
  totalPulls: number,
  chronologicalPullTimes?: readonly string[]
) =>
  getStarCrownBoxThresholds(outfitId)
    .filter((threshold) => totalPulls >= threshold)
    .map((threshold) => {
      const times = chronologicalPullTimes
      if (!times?.length) return threshold
      const time = times[threshold - 1]
      let last = threshold
      while (last < times.length && times[last] === time) last++
      return last
    })

const countPieces = (
  itemIds: readonly string[],
  ownedItemIds: Iterable<string | null>
) => {
  const counts = new Map(itemIds.map((id) => [id, 0]))
  for (const id of ownedItemIds) {
    if (id && counts.has(id)) counts.set(id, counts.get(id)! + 1)
  }
  return counts
}

// Pieces box `boxIndex` could have given, following the game rules:
// - a box gives a piece the current set is missing when it opens (pulls up to
//   its batch plus earlier boxes);
// - a piece a later box picked for the same set is out;
// - pulls skip pieces the current set already has (assumed from pull data),
//   so a piece pulled later while that set was still incomplete is out.
export const getStarCrownBoxOptions = (
  itemIds: readonly string[],
  piecePulls: readonly StarCrownPiecePull[],
  boxOpenAfter: readonly number[],
  picks: readonly (string | null)[],
  boxIndex: number
): string[] => {
  const openAfter = boxOpenAfter[boxIndex]
  if (openAfter === undefined) return []
  const ordered = [...piecePulls].sort((a, b) => a.pullIndex - b.pullIndex)
  // Piece counts when box `index` opens: pulls up to its batch plus the
  // boxes before it, with `candidate` as this box's piece.
  const countsAt = (index: number, candidate: string | null) =>
    countPieces(itemIds, [
      ...ordered
        .filter((pull) => pull.pullIndex <= (boxOpenAfter[index] ?? 0))
        .map((pull) => pull.itemId),
      ...picks
        .slice(0, index)
        .map((id, j) => (j === boxIndex ? candidate : id)),
    ])
  const counts = countsAt(boxIndex, null)
  const round = Math.min(...counts.values())
  const missing = itemIds.filter((id) => counts.get(id) === round)

  // A later box's piece must still be missing from its own set once this box
  // gives `candidate`. Empty boxes in between are unknown, so later boxes are
  // only checked while every box before them is filled.
  const conflictsWithLaterBoxes = (candidate: string) =>
    picks.some((id, index) => {
      if (!id || index <= boxIndex) return false
      if (picks.slice(0, index).some((pick, j) => j !== boxIndex && !pick)) {
        return false
      }
      const later = countsAt(index, candidate)
      return later.get(id) !== Math.min(...later.values())
    })

  // Walk later pulls while the set is incomplete.
  const pulledLater = new Set<string>()
  const later = new Map(counts)
  for (const pull of ordered) {
    if (pull.pullIndex <= openAfter || !later.has(pull.itemId)) continue
    if (Math.min(...later.values()) > round) break
    if (later.get(pull.itemId) === round) pulledLater.add(pull.itemId)
    later.set(pull.itemId, later.get(pull.itemId)! + 1)
  }

  const options = missing.filter(
    (id) => !pulledLater.has(id) && !conflictsWithLaterBoxes(id)
  )
  // Inconsistent data (e.g. manual edits): fall back to the missing pieces.
  return options.length > 0 ? options : missing
}

// Auto-fill: when the never-pulled pieces fit in the earned boxes, they are
// the box pieces (in box order, which may be swapped). Otherwise which pieces
// came from boxes is unknown and the boxes stay empty.
export const inferStarCrownBoxPieces = (
  itemIds: readonly string[],
  piecePulls: readonly StarCrownPiecePull[],
  boxOpenAfter: readonly number[]
): (string | null)[] => {
  const pulled = new Set(piecePulls.map((pull) => pull.itemId))
  const neverPulled = itemIds.filter((id) => !pulled.has(id))
  const picks: (string | null)[] = []
  if (neverPulled.length > boxOpenAfter.length) {
    return boxOpenAfter.map(() => null)
  }
  boxOpenAfter.forEach((_, boxIndex) => {
    const options = getStarCrownBoxOptions(
      itemIds,
      piecePulls,
      boxOpenAfter,
      picks,
      boxIndex
    )
    picks.push(
      options.find((id) => neverPulled.includes(id) && !picks.includes(id)) ??
        null
    )
  })
  return picks
}

// A stored boxIndex is used only when it is a whole number 0 or above; data
// from JSON imports or cloud backups is not type-checked.
export const getValidStarCrownBoxIndex = (reward: StarCrownBoxReward) =>
  Number.isInteger(reward.boxIndex) && reward.boxIndex! >= 0
    ? reward.boxIndex!
    : null

export interface StarCrownBoxEntry {
  itemId: string
  boxIndex: number
}

// Stored box rewards as box slots, in box order. Rows without a boxIndex use
// their row order.
export const getStarCrownBoxEntries = (
  rewards: StarCrownBoxReward[] | undefined
): StarCrownBoxEntry[] =>
  (rewards ?? [])
    .filter(isStarCrownBoxReward)
    .map((reward, index) => ({
      itemId: reward.itemId,
      boxIndex: getValidStarCrownBoxIndex(reward) ?? index,
    }))
    .sort((a, b) => a.boxIndex - b.boxIndex)

// `obtainedPieceCount` is the number of distinct outfit pieces from pulls,
// manual edits and recorded box rewards. Boxes earned by the pull count but
// not recorded still count as one missing piece each. Recorded boxes beyond
// the pull count (Pear-Pal totals can run short) are canon and add nothing.
export const getObtainedOutfitPieceCount = (
  outfitId: string,
  obtainedPieceCount: number,
  totalItems: number,
  totalPulls: number,
  recordedBoxCount: number
) =>
  Math.min(
    totalItems,
    obtainedPieceCount +
      Math.max(
        0,
        getStarCrownBoxesEarned(outfitId, totalPulls) - recordedBoxCount
      )
  )

// Star Crown outfits sit on the 5-star pull track, so tracker data stores
// them as quality 5; display them with the Star Crown quality instead.
export const getDisplayQuality = (
  quality: number,
  outfitId: string | number
) => (isStarCrownOutfit(outfitId) ? STAR_CROWN_QUALITY : quality)

// Box pieces inferred from pull history for a banner's Star Crown outfits,
// used when no box rewards are stored (game import without Pear-Pal data).
export const inferBannerStarCrownBoxEntries = (
  outfits: readonly { id: string; items: readonly string[] }[],
  pulls: readonly StarCrownPiecePull[],
  totalPulls: number,
  chronologicalPullTimes?: readonly string[]
) =>
  outfits
    .filter((outfit) => isStarCrownOutfit(outfit.id))
    .flatMap((outfit) =>
      inferStarCrownBoxPieces(
        outfit.items,
        pulls.filter(
          (pull) => pull.pullIndex > 0 && outfit.items.includes(pull.itemId)
        ),
        getStarCrownBoxOpenAfter(outfit.id, totalPulls, chronologicalPullTimes)
      ).flatMap((itemId, boxIndex): StarCrownBoxEntry[] =>
        itemId ? [{ itemId, boxIndex }] : []
      )
    )

// The set (0 = first) box `boxIndex` fills: the lowest piece count when it
// opens, from pulls up to its batch plus the boxes before it.
export const getStarCrownBoxRound = (
  itemIds: readonly string[],
  piecePulls: readonly StarCrownPiecePull[],
  boxOpenAfter: readonly number[],
  picks: readonly (string | null)[],
  boxIndex: number
) => {
  const openAfter = boxOpenAfter[boxIndex] ?? 0
  const counts = countPieces(itemIds, [
    ...piecePulls
      .filter((pull) => pull.pullIndex <= openAfter)
      .map((pull) => pull.itemId),
    ...picks.slice(0, boxIndex),
  ])
  return Math.min(...counts.values())
}

// Pull each box (by box index) opened after, for placing box copies among
// pulls. Boxes beyond the pull count (Pear-Pal totals run short) use their
// threshold.
export const getStarCrownBoxPositions = (
  outfitIds: readonly string[],
  boxIndexes: readonly number[],
  totalPulls: number,
  chronologicalPullTimes?: readonly string[]
) => {
  const outfitId = outfitIds.find(isStarCrownOutfit)
  if (!outfitId) return []
  const openAfter = getStarCrownBoxOpenAfter(
    outfitId,
    totalPulls,
    chronologicalPullTimes
  )
  const thresholds = getStarCrownBoxThresholds(outfitId)
  return boxIndexes.map(
    (index) => openAfter[index] ?? thresholds[index] ?? Number.POSITIVE_INFINITY
  )
}

// Chronological pulls with each box copy placed right after the pull its box
// opened after, so copy numbers (×2) follow the order pieces were obtained.
export const interleaveStarCrownBoxPulls = <T extends { pullIndex: number }>(
  chronologicalPulls: readonly T[],
  boxPulls: readonly T[],
  positions: readonly number[]
) => {
  const result: T[] = []
  let boxIndex = 0
  for (const pull of chronologicalPulls) {
    while (
      boxIndex < boxPulls.length &&
      (positions[boxIndex] ?? Number.POSITIVE_INFINITY) < pull.pullIndex
    ) {
      result.push(boxPulls[boxIndex++]!)
    }
    result.push(pull)
  }
  result.push(...boxPulls.slice(boxIndex))
  return result
}
