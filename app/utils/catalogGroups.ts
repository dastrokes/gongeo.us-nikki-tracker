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
