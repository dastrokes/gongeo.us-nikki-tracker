export const getPearpalCompletedOutfitItemIds = (
  suitIds: readonly (string | number)[],
  index: Pick<CatalogLocalIndex, 'outfitById' | 'outfitItemsById' | 'itemById'>
): number[] => {
  const itemIds = new Set<number>()

  for (const rawSuitId of suitIds) {
    const suitId = Number(rawSuitId)
    if (!Number.isSafeInteger(suitId) || !index.outfitById.has(suitId)) continue

    for (const itemId of index.outfitItemsById.get(suitId) ?? []) {
      if (index.itemById.has(itemId)) itemIds.add(itemId)
    }
  }

  return [...itemIds]
}
