type WardrobeSummaryCatalogIndex = {
  items: Array<{
    id: number
    quality: number
    type: string
    catalogGroupRootId?: number
  }>
  outfits: Array<{
    id: number
  }>
  makeups: Array<{
    id: number
    type: string
  }>
  momo: Array<{
    id: number
  }>
  outfitItemsById: ReadonlyMap<number, number[]>
  makeupItemsById: ReadonlyMap<number, number[]>
}

export type WardrobeSummaryScope = 'base' | 'all'

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

export type WardrobeSummaryNearCompleteFullMakeup = {
  id: number
  makeupIds: number[]
  missingMakeupIds: number[]
  owned: number
  total: number
  missing: number
  completionPercent: number
}

export type WardrobeSummary = {
  items: WardrobeSummaryProgress
  outfits: WardrobeSummaryOutfitProgress
  makeups: WardrobeSummaryProgress
  fullMakeups: WardrobeSummaryOutfitProgress
  momo: WardrobeSummaryProgress
  qualityRows: WardrobeSummaryQualityRow[]
  typeRows: WardrobeSummaryTypeRow[]
  nearCompleteOutfits: WardrobeSummaryNearCompleteOutfit[]
  nearCompleteFullMakeups: WardrobeSummaryNearCompleteFullMakeup[]
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

const isBaseSummaryItem = (item: { id: number; catalogGroupRootId?: number }) =>
  getItemVariantType(item.id, item.catalogGroupRootId) === 'base'

const isBaseSummaryOutfit = (outfit: { id: number }) =>
  getOutfitVariantType(String(outfit.id)) === 'base'

const isBaseSummaryMakeup = (makeup: { id: number; type: string }) =>
  makeup.type === 'fullMakeup'
    ? !String(makeup.id).endsWith('03')
    : getItemVariantType(makeup.id) === 'base'

export const createWardrobeSummary = ({
  index,
  ownedItemIds,
  ownedMakeupIds = [],
  ownedMomoIds = [],
  nearCompleteLimit = 6,
  scope = 'base',
  regionScope = 'global',
}: {
  index: WardrobeSummaryCatalogIndex
  ownedItemIds: readonly number[]
  ownedMakeupIds?: readonly number[]
  ownedMomoIds?: readonly number[]
  nearCompleteLimit?: number
  scope?: WardrobeSummaryScope
  regionScope?: CatalogRegionScope
}): WardrobeSummary => {
  const normalizedRegionScope = normalizeCatalogRegionScope(regionScope)
  const items = (
    scope === 'all' ? index.items : index.items.filter(isBaseSummaryItem)
  ).filter((item) =>
    isCatalogEntryAvailableInScope('item', item.id, normalizedRegionScope)
  )
  const makeups = (
    scope === 'all' ? index.makeups : index.makeups.filter(isBaseSummaryMakeup)
  ).filter((makeup) =>
    isCatalogEntryAvailableInScope('makeup', makeup.id, normalizedRegionScope)
  )
  const momoEntries = index.momo.filter((momo) =>
    isCatalogEntryAvailableInScope('momo', momo.id, normalizedRegionScope)
  )
  const makeupItems = makeups.filter((makeup) => makeup.type !== 'fullMakeup')
  const itemIdSet = new Set(items.map((item) => item.id))
  const outfits = (
    scope === 'all' ? index.outfits : index.outfits.filter(isBaseSummaryOutfit)
  ).filter((outfit) =>
    normalizeSummaryItemIds(index.outfitItemsById.get(outfit.id) ?? []).some(
      (itemId) => itemIdSet.has(itemId)
    )
  )
  const makeupItemIdSet = new Set(makeupItems.map((makeup) => makeup.id))
  const ownedItemIdSet = new Set(normalizeSummaryItemIds([...ownedItemIds]))
  const ownedMakeupIdSet = new Set(normalizeSummaryItemIds([...ownedMakeupIds]))
  const ownedMomoIdSet = new Set(normalizeSummaryItemIds([...ownedMomoIds]))
  let ownedItemCount = 0
  let ownedMakeupCount = 0
  let ownedMomoCount = 0
  const qualityGroups = new Map<number, { total: number; owned: number }>()
  const typeGroups = new Map<string, { total: number; owned: number }>()

  items.forEach((item) => {
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

  outfits.forEach((outfit) => {
    const itemIds = normalizeSummaryItemIds(
      index.outfitItemsById.get(outfit.id) ?? []
    ).filter((itemId) => itemIdSet.has(itemId))
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

  makeupItems.forEach((makeup) => {
    if (ownedMakeupIdSet.has(makeup.id)) {
      ownedMakeupCount += 1
    }
  })

  let ownedFullMakeupCount = 0
  let partialFullMakeupCount = 0
  let missingFullMakeupCount = 0
  const nearCompleteFullMakeups: WardrobeSummaryNearCompleteFullMakeup[] = []

  makeups
    .filter((makeup) => makeup.type === 'fullMakeup')
    .forEach((makeup) => {
      const makeupIds = normalizeSummaryItemIds(
        index.makeupItemsById.get(makeup.id) ?? []
      ).filter((makeupId) => makeupItemIdSet.has(makeupId))
      const ownedCount = makeupIds.reduce(
        (count, makeupId) => count + (ownedMakeupIdSet.has(makeupId) ? 1 : 0),
        0
      )
      const status =
        ownedCount === makeupIds.length && makeupIds.length > 0
          ? 'owned'
          : ownedCount > 0
            ? 'partial'
            : 'missing'

      if (status === 'owned') {
        ownedFullMakeupCount += 1
      } else if (status === 'partial') {
        partialFullMakeupCount += 1
        const missingMakeupIds = makeupIds.filter(
          (makeupId) => !ownedMakeupIdSet.has(makeupId)
        )

        nearCompleteFullMakeups.push({
          id: makeup.id,
          makeupIds,
          missingMakeupIds,
          owned: ownedCount,
          total: makeupIds.length,
          missing: missingMakeupIds.length,
          completionPercent: getCompletionPercent(ownedCount, makeupIds.length),
        })
      } else {
        missingFullMakeupCount += 1
      }
    })

  momoEntries.forEach((momo) => {
    if (ownedMomoIdSet.has(momo.id)) {
      ownedMomoCount += 1
    }
  })

  return {
    items: createProgress(ownedItemCount, items.length),
    outfits: {
      total: outfits.length,
      owned: ownedOutfitCount,
      partial: partialOutfitCount,
      missing: missingOutfitCount,
      completionPercent: getCompletionPercent(ownedOutfitCount, outfits.length),
    },
    makeups: createProgress(ownedMakeupCount, makeupItems.length),
    fullMakeups: {
      total:
        ownedFullMakeupCount + partialFullMakeupCount + missingFullMakeupCount,
      owned: ownedFullMakeupCount,
      partial: partialFullMakeupCount,
      missing: missingFullMakeupCount,
      completionPercent: getCompletionPercent(
        ownedFullMakeupCount,
        ownedFullMakeupCount + partialFullMakeupCount + missingFullMakeupCount
      ),
    },
    momo: createProgress(ownedMomoCount, momoEntries.length),
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
    nearCompleteFullMakeups: nearCompleteFullMakeups
      .sort(
        (left, right) =>
          left.missing - right.missing ||
          right.completionPercent - left.completionPercent ||
          left.id - right.id
      )
      .slice(0, nearCompleteLimit),
  }
}
