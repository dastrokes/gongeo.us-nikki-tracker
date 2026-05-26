export type CatalogItemPieceFilter = 'all' | 'outfit' | 'individual'
export type CatalogMakeupKindFilter = 'all' | 'full' | 'individual'

export const resolveCatalogItemPieceFilter = (
  value?: string | null
): CatalogItemPieceFilter =>
  value === 'outfit' || value === 'individual' ? value : 'all'

export const catalogItemPieceFilterRequiresOutfitItems = (
  value?: string | null
) => resolveCatalogItemPieceFilter(value) !== 'all'

export const resolveCatalogMakeupKindFilter = (
  value?: string | null
): CatalogMakeupKindFilter =>
  value === 'full'
    ? value
    : value === 'individual' || value === 'parts'
      ? 'individual'
      : 'all'

export const matchesCatalogItemPieceFilter = (
  itemId: number,
  filter: CatalogItemPieceFilter,
  outfitItemIds: ReadonlySet<number>
) => {
  if (filter === 'all') return true

  const isOutfitPiece = outfitItemIds.has(itemId)
  return filter === 'outfit' ? isOutfitPiece : !isOutfitPiece
}

export const matchesCatalogMakeupKindFilter = (
  makeupId: number,
  type: string | null | undefined,
  filter: CatalogMakeupKindFilter,
  fullMakeupComponentIds: ReadonlySet<number>
) => {
  if (filter === 'all') return true

  const isFullMakeup = type === 'fullMakeup'
  const isFullMakeupComponent = fullMakeupComponentIds.has(makeupId)
  return filter === 'full'
    ? isFullMakeup || isFullMakeupComponent
    : !isFullMakeup && !isFullMakeupComponent
}
