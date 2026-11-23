export const WARDROBE_OWNERSHIP_TIERS = [
  'base',
  'evo1',
  'evo2',
  'evo3',
] as const

export type WardrobeOwnershipTier = (typeof WARDROBE_OWNERSHIP_TIERS)[number]

export const getCatalogWardrobeOwnershipTier = (
  index: CatalogLocalIndex | null,
  entity: 'item' | 'outfit',
  id: number,
  ownedItemIds: ReadonlySet<number>
): WardrobeOwnershipTier | null => {
  if (!index || ownedItemIds.size === 0) return null

  const groupIds =
    entity === 'item'
      ? index.itemGroupIdsById.get(id)
      : index.outfitGroupIdsById.get(id)
  if (!groupIds) return null

  const itemIdsByTier = new Map<WardrobeOwnershipTier, number[]>()
  for (const variantId of groupIds) {
    const variantType =
      entity === 'item'
        ? getItemVariantType(
            variantId,
            index.itemById.get(variantId)?.catalogGroupRootId
          )
        : getOutfitVariantType(String(variantId))
    if (variantType === 'glowup') continue

    const itemIds =
      entity === 'item' ? [variantId] : index.outfitItemsById.get(variantId)
    if (!itemIds?.length) return null

    const tierItemIds = itemIdsByTier.get(variantType) ?? []
    tierItemIds.push(...itemIds)
    itemIdsByTier.set(variantType, tierItemIds)
  }
  if (!itemIdsByTier.has('base')) return null

  let currentTier: WardrobeOwnershipTier | null = null
  let missingTier = false
  for (const tier of WARDROBE_OWNERSHIP_TIERS) {
    const itemIds = itemIdsByTier.get(tier)
    if (!itemIds) continue

    const { status } = getWardrobeSetProgress(itemIds, ownedItemIds)
    if (status === 'partial') return null
    if (status === 'missing') {
      missingTier = true
      continue
    }
    if (missingTier) return null
    currentTier = tier
  }

  return currentTier
}
