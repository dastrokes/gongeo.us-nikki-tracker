type CompactCatalogPayload = {
  v?: number
  t?: string[]
  s?: string[]
  r?: unknown[][]
}

const CATALOG_ITEM_TYPES = [
  'hair',
  'outerwear',
  'shoes',
  'hairAccessories',
  'headwear',
  'earrings',
  'neckwear',
  'chokers',
  'dresses',
  'chestAccessories',
  'handhelds',
  'socks',
  'gloves',
  'faceDecorations',
  'backpieces',
  'tops',
  'bracelets',
  'armDecorations',
  'pendants',
  'bottoms',
  'bodyPaint',
  'rings',
] as const
const CATALOG_MAKEUP_TYPES = [
  'fullMakeup',
  'baseMakeup',
  'eyebrows',
  'eyelashes',
  'contactLenses',
  'lips',
] as const
const CATALOG_STYLES = ['sweet', 'sexy', 'fresh', 'cool', 'elegant'] as const

const isCompactCatalogPayload = (
  value: unknown
): value is CompactCatalogPayload =>
  !!value &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  (value as CompactCatalogPayload).v === 1 &&
  Array.isArray((value as CompactCatalogPayload).r)

const isCompactRowPayload = (value: unknown): value is unknown[][] =>
  Array.isArray(value) && (value.length === 0 || Array.isArray(value[0]))

const unpackCompactIds = (ids: unknown): number[] => {
  if (Array.isArray(ids)) {
    return ids.filter((id): id is number => typeof id === 'number')
  }

  return typeof ids === 'number' ? [ids] : []
}

const expandCompactStyle = (
  styles: readonly string[] | undefined,
  index: unknown
) => {
  if (index === null || index === undefined) return null
  if (typeof index !== 'number') return null

  const style = styles?.[index]
  return style ? `style.${style}` : null
}

const expandCompactLabels = (labels: unknown) =>
  Array.isArray(labels)
    ? labels.map((label) =>
        typeof label === 'number' ? `label.${label}.name` : String(label)
      )
    : []

const getCompactDictionaryValue = (
  dictionary: readonly string[] | undefined,
  index: unknown
) => (typeof index === 'number' ? dictionary?.[index] : undefined)

const normalizeCompactFamilyRoot = (value: unknown) =>
  typeof value === 'number' && Number.isSafeInteger(value) ? value : undefined

const hasCompactValue = (value: unknown) =>
  value !== undefined && value !== null

const decodeCompactItemRows = (
  rows: unknown[][],
  types: readonly string[] = CATALOG_ITEM_TYPES,
  styles: readonly string[] = CATALOG_STYLES
) =>
  rows.flatMap(
    ([ids, quality, typeIndex, styleIndex, labels, obtain, familyRootId]) => {
      const itemIds = unpackCompactIds(ids)
      const catalogGroupRootId = normalizeCompactFamilyRoot(familyRootId)

      return itemIds.map((id) => ({
        id,
        quality: Number(quality),
        type: getCompactDictionaryValue(types, typeIndex) ?? '',
        style: expandCompactStyle(styles, styleIndex),
        labels: expandCompactLabels(labels),
        ...(hasCompactValue(obtain) ? { obtain_type: Number(obtain) } : {}),
        ...(itemIds.length > 1 ? { catalogGroupIds: itemIds } : {}),
        ...(catalogGroupRootId === undefined ? {} : { catalogGroupRootId }),
      }))
    }
  )

const decodeCompactOutfitRows = (
  rows: unknown[][],
  styles: readonly string[] = CATALOG_STYLES
) =>
  rows.flatMap(([ids, quality, styleIndex, labels, obtain, familyRootId]) => {
    const outfitIds = unpackCompactIds(ids)
    const catalogGroupRootId = normalizeCompactFamilyRoot(familyRootId)

    return outfitIds.map((id) => ({
      id,
      quality: Number(quality),
      style: expandCompactStyle(styles, styleIndex),
      labels: expandCompactLabels(labels),
      ...(hasCompactValue(obtain) ? { obtain_type: Number(obtain) } : {}),
      ...(outfitIds.length > 1 ? { catalogGroupIds: outfitIds } : {}),
      ...(catalogGroupRootId === undefined ? {} : { catalogGroupRootId }),
    }))
  })

const decodeCompactMakeupRows = (
  rows: unknown[][],
  types: readonly string[] = CATALOG_MAKEUP_TYPES,
  styles: readonly string[] = CATALOG_STYLES
) =>
  rows.flatMap(
    ([ids, quality, typeIndex, styleIndex, obtain, familyRootId]) => {
      const makeupIds = unpackCompactIds(ids)
      const catalogGroupRootId = normalizeCompactFamilyRoot(familyRootId)

      return makeupIds.map((id) => ({
        id,
        quality: Number(quality),
        type: getCompactDictionaryValue(types, typeIndex) ?? '',
        style: expandCompactStyle(styles, styleIndex),
        labels: [],
        ...(hasCompactValue(obtain) ? { obtain_type: Number(obtain) } : {}),
        ...(makeupIds.length > 1 ? { catalogGroupIds: makeupIds } : {}),
        ...(catalogGroupRootId === undefined ? {} : { catalogGroupRootId }),
      }))
    }
  )

const decodeCompactMomoRows = (rows: unknown[][]) =>
  rows.flatMap(([ids, quality, obtain, version, familyRootId]) => {
    const momoIds = unpackCompactIds(ids)
    const catalogGroupRootId = normalizeCompactFamilyRoot(familyRootId)

    return momoIds.map((id) => ({
      id,
      quality: Number(quality),
      ...(hasCompactValue(obtain) ? { obtain_type: Number(obtain) } : {}),
      ...(hasCompactValue(version) ? { version: String(version) } : {}),
      ...(momoIds.length > 1 ? { catalogGroupIds: momoIds } : {}),
      ...(catalogGroupRootId === undefined ? {} : { catalogGroupRootId }),
    }))
  })

const decodeCompactRelationRows = (rows: unknown[][]) =>
  Object.fromEntries(
    rows.map(([outfitId, itemIds]) => [
      String(outfitId),
      Array.isArray(itemIds)
        ? itemIds.filter(
            (itemId): itemId is number => typeof itemId === 'number'
          )
        : [],
    ])
  )

export const decodeItemDyesPayload = (payload: unknown): ItemDyeCatalog => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('Catalog palettes payload is malformed')
  }

  const raw = payload as {
    palettes?: unknown
    items?: unknown
    raw?: unknown
    areas?: unknown
  }
  if (
    !raw.palettes ||
    typeof raw.palettes !== 'object' ||
    Array.isArray(raw.palettes) ||
    !Array.isArray(raw.items) ||
    !Array.isArray(raw.raw) ||
    !Array.isArray(raw.areas)
  ) {
    throw new Error('Catalog palettes payload is malformed')
  }

  const palettes: ItemDyeCatalog['palettes'] = {}
  for (const [paletteId, palette] of Object.entries(raw.palettes)) {
    const colors = (palette as { colors?: unknown })?.colors
    if (
      !Array.isArray(colors) ||
      colors.length !== 8 ||
      colors.some((color) => typeof color !== 'string')
    ) {
      throw new Error(`Catalog dye palette ${paletteId} is malformed`)
    }
    palettes[paletteId] = { colors }
  }

  const decodeItems = (rows: unknown[]) => {
    const items: Record<string, ItemDyeUnlockGroups> = {}
    for (const row of rows) {
      if (!Array.isArray(row) || row.length !== 6) {
        throw new Error('Catalog palettes row is malformed')
      }

      const ids = unpackCompactIds(row[0])
      const groups = row.slice(1).map((group) => {
        if (
          !Array.isArray(group) ||
          group.some((paletteId) => typeof paletteId !== 'number')
        ) {
          throw new Error('Catalog palettes group is malformed')
        }
        return group as number[]
      }) as ItemDyeUnlockGroups

      if (ids.length === 0) {
        throw new Error('Catalog palettes row has no item IDs')
      }
      for (const id of ids) items[String(id)] = groups
    }
    return items
  }

  const areas: ItemDyeCatalog['areas'] = {}
  for (const row of raw.areas) {
    if (
      !Array.isArray(row) ||
      row.length !== 3 ||
      typeof row[1] !== 'number' ||
      !Array.isArray(row[2]) ||
      row[2].some((area) => typeof area !== 'number')
    ) {
      throw new Error('Catalog dye area row is malformed')
    }

    const ids = unpackCompactIds(row[0])
    if (ids.length === 0) {
      throw new Error('Catalog dye area row has no item IDs')
    }
    for (const id of ids) {
      areas[String(id)] = {
        primaryCount: row[1],
        customOrder: row[2] as number[],
      }
    }
  }

  const items = decodeItems(raw.items)
  const rawItems = decodeItems(raw.raw)
  for (const [itemId, groups] of Object.entries(items)) {
    rawItems[itemId] ??= [
      [5, 6, 3, 4, 2, 1],
      groups[1],
      groups[2],
      groups[3],
      groups[4],
    ]
  }

  return {
    palettes,
    items,
    rawItems,
    areas,
  }
}

export const decodeCatalogPartPayload = (
  part: CatalogIndexPartKey,
  payload: unknown
) => {
  if (
    part === 'outfitItems' ||
    part === 'makeupItems' ||
    part === 'makeupOutfits' ||
    part === 'momoOutfits'
  ) {
    return isCompactCatalogPayload(payload)
      ? decodeCompactRelationRows(payload.r!)
      : isCompactRowPayload(payload)
        ? decodeCompactRelationRows(payload)
        : payload
  }

  if (Array.isArray(payload) && !isCompactRowPayload(payload)) return payload

  switch (part) {
    case 'items':
      return isCompactCatalogPayload(payload)
        ? decodeCompactItemRows(payload.r!, payload.t, payload.s)
        : isCompactRowPayload(payload)
          ? decodeCompactItemRows(payload)
          : payload
    case 'outfits':
      return isCompactCatalogPayload(payload)
        ? decodeCompactOutfitRows(payload.r!, payload.s)
        : isCompactRowPayload(payload)
          ? decodeCompactOutfitRows(payload)
          : payload
    case 'makeups':
      return isCompactCatalogPayload(payload)
        ? decodeCompactMakeupRows(payload.r!, payload.t, payload.s)
        : isCompactRowPayload(payload)
          ? decodeCompactMakeupRows(payload)
          : payload
    case 'momo':
      return isCompactCatalogPayload(payload)
        ? decodeCompactMomoRows(payload.r!)
        : isCompactRowPayload(payload)
          ? decodeCompactMomoRows(payload)
          : payload
    default:
      return payload
  }
}
