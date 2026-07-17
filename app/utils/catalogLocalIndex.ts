export type CatalogLocalItem = ItemListEntry & {
  catalogGroupIds?: number[]
  catalogGroupRootId?: number
}
export type CatalogLocalOutfit = OutfitListEntry & {
  catalogGroupIds?: number[]
  catalogGroupRootId?: number
}
export type CatalogLocalMakeup = ItemListEntry & {
  catalogGroupIds?: number[]
  catalogGroupRootId?: number
}
export type CatalogLocalMomo = MomoListEntry & {
  catalogGroupIds?: number[]
  catalogGroupRootId?: number
}

export type CatalogLocalIndex = {
  items: CatalogLocalItem[]
  itemById: Map<number, CatalogLocalItem>
  itemGroupIdsById: Map<number, number[]>
  outfits: CatalogLocalOutfit[]
  outfitById: Map<number, CatalogLocalOutfit>
  outfitGroupIdsById: Map<number, number[]>
  makeups: CatalogLocalMakeup[]
  makeupById: Map<number, CatalogLocalMakeup>
  makeupGroupIdsById: Map<number, number[]>
  momo: CatalogLocalMomo[]
  momoById: Map<number, CatalogLocalMomo>
  momoGroupIdsById: Map<number, number[]>
  outfitItemsById: Map<number, number[]>
  makeupItemsById: Map<number, number[]>
  fullMakeupIdsByMakeupId: Map<number, number[]>
  fullMakeupIdsByOutfitId: Map<number, number[]>
  outfitIdsByFullMakeupId: Map<number, number[]>
  momoIdsByOutfitId: Map<number, number[]>
  outfitIdsByMomoId: Map<number, number[]>
}

const invertRelations = (relations: Map<number, number[]>) => {
  const inverse = new Map<number, number[]>()

  for (const [parentId, childIds] of relations) {
    for (const childId of childIds) {
      const parentIds = inverse.get(childId) ?? []
      parentIds.push(parentId)
      inverse.set(childId, parentIds)
    }
  }

  for (const parentIds of inverse.values()) {
    parentIds.sort((left, right) => left - right)
  }

  return inverse
}

const buildEntityGroupIdsById = <
  T extends {
    id: number
    catalogGroupIds?: number[]
    catalogGroupRootId?: number
  },
>(
  rows: readonly T[]
) => {
  const validIds = new Set(rows.map((row) => row.id))
  const familyIdsByRoot = new Map<number, number[]>()

  for (const row of rows) {
    if (row.catalogGroupRootId === undefined) continue
    const familyIds = familyIdsByRoot.get(row.catalogGroupRootId) ?? []
    familyIds.push(row.id)
    familyIdsByRoot.set(row.catalogGroupRootId, familyIds)
  }

  return new Map(
    rows.map((row) => {
      const rootedIds =
        row.catalogGroupRootId === undefined
          ? []
          : (familyIdsByRoot.get(row.catalogGroupRootId) ?? [])
      const legacyIds =
        row.catalogGroupIds?.filter((id) => validIds.has(id)) ?? []
      const ids = rootedIds.length > 0 ? rootedIds : legacyIds
      return [row.id, ids.length > 0 ? ids : [row.id]]
    })
  )
}

export const createCatalogLocalIndex = ({
  items,
  outfits,
  makeups,
  momo,
  outfitItems,
  makeupItems,
  makeupOutfits,
  momoOutfits,
}: {
  items?: readonly CatalogLocalItem[] | null
  outfits?: readonly CatalogLocalOutfit[] | null
  makeups?: readonly CatalogLocalMakeup[] | null
  momo?: readonly CatalogLocalMomo[] | null
  outfitItems: Record<string, number[]> | null | undefined
  makeupItems?: Record<string, number[]> | null | undefined
  makeupOutfits?: Record<string, number[]> | null | undefined
  momoOutfits?: Record<string, number[]> | null | undefined
}): CatalogLocalIndex => {
  const itemRows = Array.from(items ?? [])
  const outfitRows = Array.from(outfits ?? [])
  const makeupRows = Array.from(makeups ?? [])
  const momoRows = Array.from(momo ?? [])
  const outfitItemsById = new Map<number, number[]>()
  const makeupItemsById = new Map<number, number[]>()
  const fullMakeupIdsByOutfitId = new Map<number, number[]>()
  const momoIdsByOutfitId = new Map<number, number[]>()

  for (const [rawOutfitId, rawItemIds] of Object.entries(outfitItems ?? {})) {
    const outfitId = Number(rawOutfitId)
    if (!Number.isSafeInteger(outfitId)) continue

    outfitItemsById.set(outfitId, Array.from(rawItemIds))
  }

  for (const [rawMakeupId, rawItemIds] of Object.entries(makeupItems ?? {})) {
    const makeupId = Number(rawMakeupId)
    if (!Number.isSafeInteger(makeupId)) continue

    makeupItemsById.set(makeupId, Array.from(rawItemIds))
  }

  for (const [rawOutfitId, rawMakeupIds] of Object.entries(
    makeupOutfits ?? {}
  )) {
    const outfitId = Number(rawOutfitId)
    if (!Number.isSafeInteger(outfitId)) continue

    fullMakeupIdsByOutfitId.set(outfitId, Array.from(rawMakeupIds))
  }

  for (const [rawOutfitId, rawMomoIds] of Object.entries(momoOutfits ?? {})) {
    const outfitId = Number(rawOutfitId)
    if (!Number.isSafeInteger(outfitId)) continue

    momoIdsByOutfitId.set(outfitId, Array.from(rawMomoIds))
  }

  return {
    items: itemRows,
    itemById: new Map(itemRows.map((item) => [item.id, item])),
    itemGroupIdsById: buildEntityGroupIdsById(itemRows),
    outfits: outfitRows,
    outfitById: new Map(outfitRows.map((outfit) => [outfit.id, outfit])),
    outfitGroupIdsById: buildEntityGroupIdsById(outfitRows),
    makeups: makeupRows,
    makeupById: new Map(makeupRows.map((makeup) => [makeup.id, makeup])),
    makeupGroupIdsById: buildEntityGroupIdsById(makeupRows),
    momo: momoRows,
    momoById: new Map(momoRows.map((momo) => [momo.id, momo])),
    momoGroupIdsById: buildEntityGroupIdsById(momoRows),
    outfitItemsById,
    makeupItemsById,
    fullMakeupIdsByMakeupId: invertRelations(makeupItemsById),
    fullMakeupIdsByOutfitId,
    outfitIdsByFullMakeupId: invertRelations(fullMakeupIdsByOutfitId),
    momoIdsByOutfitId,
    outfitIdsByMomoId: invertRelations(momoIdsByOutfitId),
  }
}
