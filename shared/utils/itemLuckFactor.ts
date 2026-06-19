type ItemLuckDistributionEntry = {
  itemId: string
  users: number
}

type WeightedScore = {
  score: number
  probability: number
}

export type ItemLuckFactorResult = {
  percentile: number
  luckScore: number
  tier: number
  sampleSize: number
  itemCount: number
  usedItemCount: number
}

type ItemLuckFactorInput = {
  userFirstItems: string[]
  outfitItemIds: string[]
  firstItemDistribution: ItemLuckDistributionEntry[]
  maxItems?: number
  minUserItems?: number
  minSampleSize?: number
}

const getLuckTier = (percentile: number) => {
  if (percentile < 100 / 6) return 1
  if (percentile < 200 / 6) return 2
  if (percentile < 300 / 6) return 3
  if (percentile < 400 / 6) return 4
  if (percentile < 500 / 6) return 5
  return 6
}

const scoreItems = (itemIds: string[], weights: Map<string, number>) => {
  let remainingWeight = 1
  let score = 0
  let used = 0

  for (const itemId of itemIds) {
    const weight = weights.get(itemId)
    if (!weight || remainingWeight <= 0) continue

    score += -Math.log(weight / remainingWeight)
    remainingWeight -= weight
    used++
  }

  return used > 0 ? score / used : null
}

const enumerateScores = (
  itemIds: string[],
  weights: Map<string, number>,
  length: number
) => {
  const scores: WeightedScore[] = []

  const visit = (
    available: string[],
    picked: string[],
    remainingWeight: number,
    probability: number
  ) => {
    if (picked.length === length) {
      const score = scoreItems(picked, weights)
      if (score !== null) scores.push({ score, probability })
      return
    }

    available.forEach((itemId, index) => {
      const weight = weights.get(itemId) ?? 0
      if (weight <= 0 || remainingWeight <= 0) return

      visit(
        available.filter((_, itemIndex) => itemIndex !== index),
        [...picked, itemId],
        remainingWeight - weight,
        probability * (weight / remainingWeight)
      )
    })
  }

  visit(itemIds, [], 1, 1)
  return scores
}

export const calculateItemLuckFactor = ({
  userFirstItems,
  outfitItemIds,
  firstItemDistribution,
  maxItems = 4,
  minUserItems = 2,
  minSampleSize = 30,
}: ItemLuckFactorInput): ItemLuckFactorResult | null => {
  const outfitItems = [...new Set(outfitItemIds)]
  const outfitItemSet = new Set(outfitItems)
  const counts = new Map(
    firstItemDistribution
      .filter((item) => outfitItemSet.has(item.itemId) && item.users > 0)
      .map((item) => [item.itemId, item.users])
  )
  const sampleSize = [...counts.values()].reduce((sum, count) => sum + count, 0)

  if (outfitItems.length < minUserItems || sampleSize < minSampleSize) {
    return null
  }

  const denominator = sampleSize + outfitItems.length
  const weights = new Map(
    outfitItems.map((itemId) => [
      itemId,
      ((counts.get(itemId) ?? 0) + 1) / denominator,
    ])
  )
  const validUserItems = userFirstItems.filter((itemId) =>
    outfitItemSet.has(itemId)
  )
  const usedItemCount = Math.min(maxItems, validUserItems.length)

  if (usedItemCount < minUserItems) return null

  const pickedItems = validUserItems.slice(0, usedItemCount)
  const userScore = scoreItems(pickedItems, weights)
  if (userScore === null) return null

  const epsilon = 1e-12
  const distribution = enumerateScores(outfitItems, weights, usedItemCount)
  const percentile = distribution.reduce((sum, entry) => {
    if (entry.score < userScore - epsilon) return sum + entry.probability
    if (Math.abs(entry.score - userScore) <= epsilon) {
      return sum + entry.probability / 2
    }
    return sum
  }, 0)
  const luckScore = Math.max(0, Math.min(100, Math.round(percentile * 100)))

  return {
    percentile: luckScore,
    luckScore,
    tier: getLuckTier(luckScore),
    sampleSize,
    itemCount: outfitItems.length,
    usedItemCount,
  }
}
