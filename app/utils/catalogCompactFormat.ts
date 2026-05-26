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

const decodeCompactItemRows = (
  rows: unknown[][],
  types: readonly string[] = CATALOG_ITEM_TYPES,
  styles: readonly string[] = CATALOG_STYLES
) =>
  rows.flatMap(([ids, quality, typeIndex, styleIndex, labels, obtain]) => {
    const itemIds = unpackCompactIds(ids)

    return itemIds.map((id) => ({
      id,
      quality: Number(quality),
      type: getCompactDictionaryValue(types, typeIndex) ?? '',
      style: expandCompactStyle(styles, styleIndex),
      labels: expandCompactLabels(labels),
      ...(obtain === undefined ? {} : { obtain_type: Number(obtain) }),
      ...(itemIds.length > 1 ? { catalogGroupIds: itemIds } : {}),
    }))
  })

const decodeCompactOutfitRows = (
  rows: unknown[][],
  styles: readonly string[] = CATALOG_STYLES
) =>
  rows.flatMap(([ids, quality, styleIndex, labels, obtain]) =>
    unpackCompactIds(ids).map((id) => ({
      id,
      quality: Number(quality),
      style: expandCompactStyle(styles, styleIndex),
      labels: expandCompactLabels(labels),
      ...(obtain === undefined ? {} : { obtain_type: Number(obtain) }),
    }))
  )

const decodeCompactMakeupRows = (
  rows: unknown[][],
  types: readonly string[] = CATALOG_MAKEUP_TYPES,
  styles: readonly string[] = CATALOG_STYLES
) =>
  rows.flatMap(([ids, quality, typeIndex, styleIndex, obtain]) =>
    unpackCompactIds(ids).map((id) => ({
      id,
      quality: Number(quality),
      type: getCompactDictionaryValue(types, typeIndex) ?? '',
      style: expandCompactStyle(styles, styleIndex),
      labels: [],
      ...(obtain === undefined ? {} : { obtain_type: Number(obtain) }),
    }))
  )

const decodeCompactMomoRows = (rows: unknown[][]) =>
  rows.flatMap(([ids, quality, obtain, version]) =>
    unpackCompactIds(ids).map((id) => ({
      id,
      quality: Number(quality),
      ...(obtain === undefined ? {} : { obtain_type: Number(obtain) }),
      ...(version === undefined ? {} : { version: String(version) }),
    }))
  )

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
