type WardrobeSummaryCatalogIndex = {
  items: Array<{
    id: number
    quality: number
    type: string
  }>
  outfits: Array<{
    id: number
  }>
  outfitItemsById: ReadonlyMap<number, number[]>
}

export type WardrobeSummaryProgress = {
  total: number
  owned: number
  missing: number
  completionPercent: number
}

export type WardrobeSummaryOutfitProgress = {
  total: number
  owned: number
  partial: number
  missing: number
  completionPercent: number
}

export type WardrobeSummaryQualityRow = WardrobeSummaryProgress & {
  quality: number
}

export type WardrobeSummaryTypeRow = WardrobeSummaryProgress & {
  type: string
}

export type WardrobeSummaryNearCompleteOutfit = {
  id: number
  itemIds: number[]
  missingItemIds: number[]
  owned: number
  total: number
  missing: number
  completionPercent: number
}

export type WardrobeSummary = {
  items: WardrobeSummaryProgress
  outfits: WardrobeSummaryOutfitProgress
  qualityRows: WardrobeSummaryQualityRow[]
  typeRows: WardrobeSummaryTypeRow[]
  nearCompleteOutfits: WardrobeSummaryNearCompleteOutfit[]
}

const getCompletionPercent = (owned: number, total: number) =>
  total > 0 ? Math.round((owned / total) * 100) : 0

const normalizeSummaryItemIds = (values: unknown): number[] => {
  if (!Array.isArray(values)) return []

  return Array.from(
    new Set(
      values
        .map((value) => {
          const parsed =
            typeof value === 'number'
              ? value
              : typeof value === 'string'
                ? Number(value)
                : null

          return parsed !== null && Number.isInteger(parsed) && parsed > 0
            ? parsed
            : null
        })
        .filter((value): value is number => value !== null)
    )
  ).sort((left, right) => left - right)
}

const createProgress = (
  owned: number,
  total: number
): WardrobeSummaryProgress => {
  const missing = Math.max(total - owned, 0)

  return {
    total,
    owned,
    missing,
    completionPercent: getCompletionPercent(owned, total),
  }
}

const incrementGroup = <TKey extends string | number>(
  groups: Map<TKey, { total: number; owned: number }>,
  key: TKey,
  owned: boolean
) => {
  const current = groups.get(key) ?? { total: 0, owned: 0 }
  current.total += 1
  if (owned) {
    current.owned += 1
  }
  groups.set(key, current)
}

export const createWardrobeSummary = ({
  index,
  ownedItemIds,
  nearCompleteLimit = 6,
}: {
  index: WardrobeSummaryCatalogIndex
  ownedItemIds: readonly number[]
  nearCompleteLimit?: number
}): WardrobeSummary => {
  const ownedItemIdSet = new Set(normalizeSummaryItemIds([...ownedItemIds]))
  let ownedItemCount = 0
  const qualityGroups = new Map<number, { total: number; owned: number }>()
  const typeGroups = new Map<string, { total: number; owned: number }>()

  index.items.forEach((item) => {
    const owned = ownedItemIdSet.has(item.id)
    if (owned) {
      ownedItemCount += 1
    }

    incrementGroup(qualityGroups, item.quality, owned)
    incrementGroup(typeGroups, item.type, owned)
  })

  let ownedOutfitCount = 0
  let partialOutfitCount = 0
  let missingOutfitCount = 0
  const nearCompleteOutfits: WardrobeSummaryNearCompleteOutfit[] = []

  index.outfits.forEach((outfit) => {
    const itemIds = normalizeSummaryItemIds(
      index.outfitItemsById.get(outfit.id) ?? []
    )
    const ownedCount = itemIds.reduce(
      (count, itemId) => count + (ownedItemIdSet.has(itemId) ? 1 : 0),
      0
    )
    const status =
      ownedCount === itemIds.length && itemIds.length > 0
        ? 'owned'
        : ownedCount > 0
          ? 'partial'
          : 'missing'

    if (status === 'owned') {
      ownedOutfitCount += 1
    } else if (status === 'partial') {
      partialOutfitCount += 1
      const missingItemIds = itemIds.filter(
        (itemId) => !ownedItemIdSet.has(itemId)
      )

      nearCompleteOutfits.push({
        id: outfit.id,
        itemIds,
        missingItemIds,
        owned: ownedCount,
        total: itemIds.length,
        missing: missingItemIds.length,
        completionPercent: getCompletionPercent(ownedCount, itemIds.length),
      })
    } else {
      missingOutfitCount += 1
    }
  })

  return {
    items: createProgress(ownedItemCount, index.items.length),
    outfits: {
      total: index.outfits.length,
      owned: ownedOutfitCount,
      partial: partialOutfitCount,
      missing: missingOutfitCount,
      completionPercent: getCompletionPercent(
        ownedOutfitCount,
        index.outfits.length
      ),
    },
    qualityRows: Array.from(qualityGroups.entries())
      .map(([quality, progress]) => ({
        quality,
        ...createProgress(progress.owned, progress.total),
      }))
      .sort((left, right) => right.quality - left.quality),
    typeRows: Array.from(typeGroups.entries())
      .map(([type, progress]) => ({
        type,
        ...createProgress(progress.owned, progress.total),
      }))
      .sort(
        (left, right) =>
          right.total - left.total ||
          right.owned - left.owned ||
          left.type.localeCompare(right.type)
      ),
    nearCompleteOutfits: nearCompleteOutfits
      .sort(
        (left, right) =>
          left.missing - right.missing ||
          right.completionPercent - left.completionPercent ||
          left.id - right.id
      )
      .slice(0, nearCompleteLimit),
  }
}
