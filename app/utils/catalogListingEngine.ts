export type CatalogListingEntity = 'item' | 'outfit'
export type StaticCatalogListingEntity =
  | CatalogListingEntity
  | 'makeup'
  | 'momo'

export type ItemOwnershipMode = 'all' | 'owned' | 'missing'
export type OutfitOwnershipMode = 'all' | 'owned' | 'partial' | 'missing'

export type CatalogListingQuery = {
  entity: CatalogListingEntity
  filters: Record<string, unknown>
  page: number
  pageSize: number
  ownershipMode: ItemOwnershipMode | OutfitOwnershipMode
}

export type StaticCatalogListingQuery = {
  entity: StaticCatalogListingEntity
  filters: Record<string, unknown>
  page: number
  pageSize: number
}

export type CatalogListingResult<TEntry> = {
  data: TEntry[]
  total: number
  page: number
  totalPages: number
}

export type CatalogListingIdsResult = {
  ids: number[]
  outfitItems?: Record<string, number[]>
}

export type CatalogListingOutfitRelations = {
  wardrobeOutfitItems?: Record<string, number[]>
}

export type CatalogListingHydratedResult<TEntry> =
  CatalogListingResult<TEntry> & CatalogListingOutfitRelations

type CatalogLocalListingItemQuery = CatalogListingQuery & {
  entity: 'item'
  ownershipMode: ItemOwnershipMode
}

type CatalogLocalListingOutfitQuery = CatalogListingQuery & {
  entity: 'outfit'
  ownershipMode: OutfitOwnershipMode
}

type CatalogLocalListingQuery =
  | CatalogLocalListingItemQuery
  | CatalogLocalListingOutfitQuery

type CatalogListingWardrobeAccess = {
  ownedItemIds?: readonly number[]
  isItemOwned?: (itemId: number) => boolean
  getOutfitProgress?: (itemIds: readonly number[]) => {
    status: OutfitOwnershipMode
  }
}

export const createEmptyCatalogListingResult = <TEntry>(
  page: number,
  extra: CatalogListingOutfitRelations = {}
): CatalogListingHydratedResult<TEntry> => ({
  data: [],
  total: 0,
  page,
  totalPages: 0,
  ...extra,
})

export const getCatalogListingPageIds = (
  ids: readonly number[],
  page: number,
  pageSize: number
) => {
  const start = (page - 1) * pageSize
  return ids.slice(start, start + pageSize)
}

export const getCatalogListingTotalPages = (total: number, pageSize: number) =>
  Math.ceil(total / pageSize)

export const normalizeCatalogListingPage = (value: unknown) => {
  const raw = Array.isArray(value) ? value[0] : value
  const parsed =
    typeof raw === 'number'
      ? raw
      : typeof raw === 'string'
        ? Number(raw)
        : Number.NaN

  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1
}

const hasFilterValue = (value: unknown) =>
  value !== null &&
  value !== undefined &&
  value !== '' &&
  value !== 'all' &&
  (!Array.isArray(value) || value.length > 0)

const getStringFilter = (filters: Record<string, unknown>, key: string) => {
  const value = filters[key]
  return typeof value === 'string' && hasFilterValue(value) ? value : null
}

const getNumberFilter = (filters: Record<string, unknown>, key: string) => {
  const value = filters[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

const matchesQuality = (
  entry: { quality: number },
  filters: Record<string, unknown>
) => {
  const quality = getNumberFilter(filters, 'quality')
  return quality === null || entry.quality === quality
}

const matchesStyle = (
  entry: { style: string | null },
  filters: Record<string, unknown>
) => {
  const style = getStringFilter(filters, 'style')
  if (!style) return true

  return resolveStyleKeyFromI18nKey(entry.style) === style
}

const matchesLabel = (
  entry: { labels: string[] },
  filters: Record<string, unknown>
) => {
  const label = getStringFilter(filters, 'label')
  if (!label) return true

  const definition = TAG_BY_KEY.get(label)
  const expected = definition?.i18nKey ?? label
  return entry.labels.includes(expected) || entry.labels.includes(label)
}

const matchesVersion = (
  entry: { obtain_type?: number | null },
  filters: Record<string, unknown>
) => {
  const version = getStringFilter(filters, 'version')
  if (!version) return true

  const entryVersion = getVersionFromId(entry.obtain_type)
  return entryVersion ? matchesVersionFilter(entryVersion, version) : false
}

const matchesSource = (
  entry: { obtain_type?: number | null },
  filters: Record<string, unknown>
) => {
  const source = getStringFilter(filters, 'source')
  if (!source) return true

  const sourceIds = resolveObtainIdsFromValue(source)
  return Boolean(
    entry.obtain_type !== null &&
    entry.obtain_type !== undefined &&
    sourceIds?.includes(entry.obtain_type)
  )
}

const matchesMomoVersion = (
  entry: { version?: string | null },
  filters: Record<string, unknown>
) => {
  const version = getStringFilter(filters, 'version')
  if (!version) return true

  return entry.version ? matchesVersionFilter(entry.version, version) : false
}

const matchesMomoSource = (
  entry: { obtain_type?: number | null },
  filters: Record<string, unknown>
) => {
  const source = getStringFilter(filters, 'source')
  if (!source) return true

  const sourceIds = resolveMomoSourceIdsFromValue(source)
  return Boolean(
    entry.obtain_type !== null &&
    entry.obtain_type !== undefined &&
    sourceIds?.includes(entry.obtain_type)
  )
}

const matchesStableCatalogFilters = (
  entry: ItemListEntry | OutfitListEntry,
  filters: Record<string, unknown>
) =>
  matchesQuality(entry, filters) &&
  matchesStyle(entry, filters) &&
  matchesLabel(entry, filters) &&
  matchesVersion(entry, filters) &&
  matchesSource(entry, filters)

const matchesItemStableFilters = (
  item: CatalogLocalItem,
  filters: Record<string, unknown>
) => {
  if (!matchesStableCatalogFilters(item, filters)) return false

  const type = getStringFilter(filters, 'type')
  return !type || item.type === type
}

const MAKEUP_TYPE_ORDER = new Map([
  ['fullMakeup', 0],
  ['baseMakeup', 1],
  ['eyebrows', 2],
  ['eyelashes', 3],
  ['contactLenses', 4],
  ['lips', 5],
])

const resolveObtainVersionPrefix = (obtainType?: number | null) => {
  if (obtainType === null || obtainType === undefined) return null

  const parsed = Number(String(obtainType).slice(0, 3))
  return Number.isFinite(parsed) ? parsed : null
}

const compareByObtainOrder = (
  left: { id: number; quality: number; obtain_type?: number | null },
  right: { id: number; quality: number; obtain_type?: number | null }
) => {
  const leftVersion = resolveObtainVersionPrefix(left.obtain_type)
  const rightVersion = resolveObtainVersionPrefix(right.obtain_type)

  if (leftVersion !== rightVersion) {
    if (leftVersion === null) return 1
    if (rightVersion === null) return -1
    return rightVersion - leftVersion
  }

  if (left.quality !== right.quality) {
    return right.quality - left.quality
  }

  const leftObtain = left.obtain_type
  const rightObtain = right.obtain_type
  if (leftObtain !== rightObtain) {
    if (leftObtain === null || leftObtain === undefined) return 1
    if (rightObtain === null || rightObtain === undefined) return -1
    return leftObtain - rightObtain
  }

  return left.id - right.id
}

const sortMakeupsForFilters = (
  makeups: CatalogLocalMakeup[],
  filters: Record<string, unknown>
) => {
  const type = getStringFilter(filters, 'type')

  return [...makeups].sort((left, right) => {
    if (!type) {
      const leftOrder = MAKEUP_TYPE_ORDER.get(left.type) ?? 999
      const rightOrder = MAKEUP_TYPE_ORDER.get(right.type) ?? 999
      return leftOrder - rightOrder || right.id - left.id
    }

    if (type === 'fullMakeup') {
      return left.id - right.id
    }

    return compareByObtainOrder(left, right)
  })
}

export const itemListingRequiresAttributeMatches = (
  filters: Record<string, unknown>
) =>
  hasFilterValue(filters.category) ||
  hasFilterValue(filters.subcategory) ||
  Object.entries(
    getActiveItemSearchAdvancedFilters(
      filters as ItemSearchAdvancedFilters,
      getStringFilter(filters, 'type')
    )
  ).some(([, value]) =>
    hasActiveItemSearchAdvancedFilterValue(
      value as ItemSearchAdvancedFilterValue
    )
  )

const filterItemIdsByOwnership = (
  itemIds: number[],
  mode: ItemOwnershipMode,
  wardrobe: CatalogListingWardrobeAccess
) => {
  if (mode === 'all') return itemIds

  const ownedItemIds = wardrobe.ownedItemIds
    ? new Set(wardrobe.ownedItemIds)
    : null

  if (!ownedItemIds && !wardrobe.isItemOwned) {
    throw new Error('Item wardrobe ownership is unavailable')
  }

  return itemIds.filter((itemId) => {
    const owned = ownedItemIds
      ? ownedItemIds.has(itemId)
      : wardrobe.isItemOwned!(itemId)
    return mode === 'owned' ? owned : !owned
  })
}

const toOutfitItemsRecord = (
  outfitIds: readonly number[],
  outfitItemsById: ReadonlyMap<number, number[]>
) =>
  Object.fromEntries(
    outfitIds.map((outfitId) => [
      String(outfitId),
      outfitItemsById.get(outfitId) ?? [],
    ])
  )

const getLocalItemMatchingIds = ({
  query,
  index,
  attributeMatchingIds,
  wardrobe,
}: {
  query: CatalogLocalListingItemQuery
  index: CatalogLocalIndex
  attributeMatchingIds?: readonly number[] | null
  wardrobe: CatalogListingWardrobeAccess
}) => {
  if (
    itemListingRequiresAttributeMatches(query.filters) &&
    !attributeMatchingIds
  ) {
    throw new Error('Item attribute filters are unavailable')
  }

  const attributeMatchingIdSet = attributeMatchingIds
    ? new Set(attributeMatchingIds)
    : null
  const stableFiltered = index.items.filter((item) =>
    matchesItemStableFilters(item, query.filters)
  )
  const attributeFiltered = attributeMatchingIdSet
    ? stableFiltered.filter((item) => attributeMatchingIdSet.has(item.id))
    : stableFiltered

  return filterItemIdsByOwnership(
    attributeFiltered.map((item) => item.id),
    query.ownershipMode,
    wardrobe
  )
}

const getLocalOutfitMatchingIds = ({
  query,
  index,
  wardrobe,
}: {
  query: CatalogLocalListingOutfitQuery
  index: CatalogLocalIndex
  wardrobe: CatalogListingWardrobeAccess
}) => {
  const stableFiltered = index.outfits.filter((outfit) =>
    matchesStableCatalogFilters(outfit, query.filters)
  )
  const outfitIds = stableFiltered.map((outfit) => outfit.id)

  if (query.ownershipMode === 'all') return outfitIds
  if (!wardrobe.getOutfitProgress) {
    throw new Error('Outfit wardrobe progress is unavailable')
  }

  return outfitIds.filter((outfitId) => {
    const progress = wardrobe.getOutfitProgress!(
      index.outfitItemsById.get(outfitId) ?? []
    )
    return progress.status === query.ownershipMode
  })
}

export const getLocalCatalogListingMatchingIds = ({
  query,
  index,
  attributeMatchingIds,
  wardrobe,
}: {
  query: CatalogLocalListingQuery
  index: CatalogLocalIndex
  attributeMatchingIds?: readonly number[] | null
  wardrobe: CatalogListingWardrobeAccess
}): CatalogListingIdsResult => {
  if (query.entity === 'item') {
    return {
      ids: getLocalItemMatchingIds({
        query,
        index,
        attributeMatchingIds,
        wardrobe,
      }),
    }
  }

  const ids = getLocalOutfitMatchingIds({ query, index, wardrobe })
  return {
    ids,
    outfitItems: toOutfitItemsRecord(ids, index.outfitItemsById),
  }
}

export const getLocalCatalogListing = <
  TEntry extends ItemListEntry | OutfitListEntry,
>({
  query,
  index,
  attributeMatchingIds,
  wardrobe,
}: {
  query: CatalogLocalListingQuery
  index: CatalogLocalIndex
  attributeMatchingIds?: readonly number[] | null
  wardrobe: CatalogListingWardrobeAccess
}): CatalogListingHydratedResult<TEntry> => {
  const idResult = getLocalCatalogListingMatchingIds({
    query,
    index,
    attributeMatchingIds,
    wardrobe,
  })
  const pageIds = getCatalogListingPageIds(
    idResult.ids,
    query.page,
    query.pageSize
  )

  const data =
    query.entity === 'item'
      ? pageIds
          .map((itemId) => index.itemById.get(itemId))
          .filter((item): item is CatalogLocalItem => Boolean(item))
      : pageIds
          .map((outfitId) => index.outfitById.get(outfitId))
          .filter((outfit): outfit is CatalogLocalOutfit => Boolean(outfit))

  return {
    data: data as TEntry[],
    total: idResult.ids.length,
    page: query.page,
    totalPages: getCatalogListingTotalPages(
      idResult.ids.length,
      query.pageSize
    ),
    ...(query.entity === 'outfit'
      ? {
          wardrobeOutfitItems: toOutfitItemsRecord(
            pageIds,
            index.outfitItemsById
          ),
        }
      : {}),
  }
}

const filterStaticItemIds = ({
  query,
  index,
  attributeMatchingIds,
}: {
  query: StaticCatalogListingQuery
  index: CatalogLocalIndex
  attributeMatchingIds?: readonly number[] | null
}) => {
  if (
    itemListingRequiresAttributeMatches(query.filters) &&
    !attributeMatchingIds
  ) {
    throw new Error('Item attribute filters are unavailable')
  }

  const attributeMatchingIdSet = attributeMatchingIds
    ? new Set(attributeMatchingIds)
    : null
  const stableFiltered = index.items.filter((item) =>
    matchesItemStableFilters(item, query.filters)
  )
  const attributeFiltered = attributeMatchingIdSet
    ? stableFiltered.filter((item) => attributeMatchingIdSet.has(item.id))
    : stableFiltered

  return attributeFiltered.map((item) => item.id)
}

const filterStaticOutfitIds = ({
  query,
  index,
}: {
  query: StaticCatalogListingQuery
  index: CatalogLocalIndex
}) =>
  index.outfits
    .filter((outfit) => matchesStableCatalogFilters(outfit, query.filters))
    .map((outfit) => outfit.id)

const filterStaticMakeupIds = ({
  query,
  index,
}: {
  query: StaticCatalogListingQuery
  index: CatalogLocalIndex
}) =>
  sortMakeupsForFilters(
    index.makeups.filter((makeup) => {
      if (!matchesStableCatalogFilters(makeup, query.filters)) return false

      const type = getStringFilter(query.filters, 'type')
      return !type || makeup.type === type
    }),
    query.filters
  ).map((makeup) => makeup.id)

const filterStaticMomoIds = ({
  query,
  index,
}: {
  query: StaticCatalogListingQuery
  index: CatalogLocalIndex
}) =>
  index.momo
    .filter(
      (momo) =>
        matchesQuality(momo, query.filters) &&
        matchesMomoVersion(momo, query.filters) &&
        matchesMomoSource(momo, query.filters)
    )
    .map((momo) => momo.id)

export const getLocalStaticCatalogListing = <
  TEntry extends ItemListEntry | OutfitListEntry | MomoListEntry,
>({
  query,
  index,
  attributeMatchingIds,
}: {
  query: StaticCatalogListingQuery
  index: CatalogLocalIndex
  attributeMatchingIds?: readonly number[] | null
}): CatalogListingHydratedResult<TEntry> => {
  let ids: number[]
  switch (query.entity) {
    case 'item':
      ids = filterStaticItemIds({ query, index, attributeMatchingIds })
      break
    case 'outfit':
      ids = filterStaticOutfitIds({ query, index })
      break
    case 'makeup':
      ids = filterStaticMakeupIds({ query, index })
      break
    case 'momo':
      ids = filterStaticMomoIds({ query, index })
      break
  }
  const pageIds = getCatalogListingPageIds(ids, query.page, query.pageSize)

  const data =
    query.entity === 'item'
      ? pageIds
          .map((itemId) => index.itemById.get(itemId))
          .filter((item): item is CatalogLocalItem => Boolean(item))
      : query.entity === 'outfit'
        ? pageIds
            .map((outfitId) => index.outfitById.get(outfitId))
            .filter((outfit): outfit is CatalogLocalOutfit => Boolean(outfit))
        : query.entity === 'makeup'
          ? pageIds
              .map((makeupId) => index.makeupById.get(makeupId))
              .filter((makeup): makeup is CatalogLocalMakeup => Boolean(makeup))
          : pageIds
              .map((momoId) => index.momoById.get(momoId))
              .filter((momo): momo is CatalogLocalMomo => Boolean(momo))

  return {
    data: data as TEntry[],
    total: ids.length,
    page: query.page,
    totalPages: getCatalogListingTotalPages(ids.length, query.pageSize),
  }
}
