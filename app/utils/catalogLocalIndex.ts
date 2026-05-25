export type CatalogLocalItem = ItemListEntry
export type CatalogLocalOutfit = OutfitListEntry
export type CatalogLocalMakeup = ItemListEntry
export type CatalogLocalMomo = MomoListEntry

export type CatalogLocalIndex = {
  items: CatalogLocalItem[]
  itemById: Map<number, CatalogLocalItem>
  outfits: CatalogLocalOutfit[]
  outfitById: Map<number, CatalogLocalOutfit>
  makeups: CatalogLocalMakeup[]
  makeupById: Map<number, CatalogLocalMakeup>
  momo: CatalogLocalMomo[]
  momoById: Map<number, CatalogLocalMomo>
  outfitItemsById: Map<number, number[]>
  makeupItemsById: Map<number, number[]>
  fullMakeupIdsByOutfitId: Map<number, number[]>
  momoIdsByOutfitId: Map<number, number[]>
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
    outfits: outfitRows,
    outfitById: new Map(outfitRows.map((outfit) => [outfit.id, outfit])),
    makeups: makeupRows,
    makeupById: new Map(makeupRows.map((makeup) => [makeup.id, makeup])),
    momo: momoRows,
    momoById: new Map(momoRows.map((momo) => [momo.id, momo])),
    outfitItemsById,
    makeupItemsById,
    fullMakeupIdsByOutfitId,
    momoIdsByOutfitId,
  }
}
