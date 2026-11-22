type CatalogGroupEntity = 'item' | 'outfit' | 'makeup' | 'momo'

const getCatalogGroupMap = (
  index: CatalogLocalIndex,
  entity: CatalogGroupEntity
) => {
  if (entity === 'item') return index.itemGroupIdsById
  if (entity === 'outfit') return index.outfitGroupIdsById
  if (entity === 'makeup') return index.makeupGroupIdsById
  return index.momoGroupIdsById
}

export const getCatalogGroupIds = (
  index: CatalogLocalIndex | null | undefined,
  entity: CatalogGroupEntity,
  id: number
) => (index ? (getCatalogGroupMap(index, entity).get(id) ?? [id]) : [id])

export const getCatalogGroupIdsByVariantType = (
  index: CatalogLocalIndex | null | undefined,
  entity: CatalogGroupEntity,
  id: number,
  getVariantType: (id: number) => VariantType,
  variantType: VariantType
) =>
  getCatalogGroupIds(index, entity, id).filter(
    (relatedId) => getVariantType(relatedId) === variantType
  )

export const getCatalogGroupIdsByVariantRank = (
  index: CatalogLocalIndex | null | undefined,
  entity: CatalogGroupEntity,
  id: number,
  getVariantType: (id: number) => VariantType,
  predicate: (rank: number, variantType: VariantType, id: number) => boolean,
  getRank: (variantType: VariantType) => number
) =>
  getCatalogGroupIds(index, entity, id).filter((relatedId) => {
    const variantType = getVariantType(relatedId)
    return predicate(getRank(variantType), variantType, relatedId)
  })

const OUTFIT_VARIANT_RANK: Record<VariantType, number> = {
  base: 0,
  glowup: 1,
  evo1: 2,
  evo2: 3,
  evo3: 4,
}

export const getOutfitVariantRank = (variantType: VariantType) =>
  OUTFIT_VARIANT_RANK[variantType]

export const getOutfitOwnershipMarkIds = (
  index: CatalogLocalIndex | null,
  outfitId: number
) => {
  const variant = getOutfitVariantType(String(outfitId))
  if (variant === 'base') return [outfitId]

  const prerequisiteIds = getCatalogGroupIdsByVariantRank(
    index,
    'outfit',
    outfitId,
    (id) => getOutfitVariantType(String(id)),
    (rank, type) => type !== 'glowup' && rank < getOutfitVariantRank(variant),
    getOutfitVariantRank
  )
  return [outfitId, ...prerequisiteIds]
}
