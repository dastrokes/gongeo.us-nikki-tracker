import {
  matchesSourceDetailFilter,
  type SourceDetailEntity,
} from '../../shared/utils/sourceDetailFilters'

export type CatalogListingEntity = 'item' | 'outfit'
export type StaticCatalogListingEntity =
  | CatalogListingEntity
  | 'makeup'
  | 'momo'

export type ItemOwnershipMode = 'all' | 'owned' | 'missing'
export type OutfitOwnershipMode = 'all' | 'owned' | 'partial' | 'missing'
export type MakeupOwnershipMode = 'all' | 'owned' | 'partial' | 'missing'
export type MomoOwnershipMode = 'all' | 'owned' | 'missing'

export type CatalogListingQuery = {
  entity: CatalogListingEntity
  filters: Record<string, unknown>
  page: number
  pageSize: number
  ownershipMode: ItemOwnershipMode | OutfitOwnershipMode
  regionScope?: CatalogRegionScope
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

export type CatalogListingMakeupRelations = {
  wardrobeMakeupItems?: Record<string, number[]>
}

export type CatalogListingHydratedResult<TEntry> =
  CatalogListingResult<TEntry> &
    CatalogListingOutfitRelations &
    CatalogListingMakeupRelations

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

export type CatalogListingWardrobeAccess = {
  ownedItemIds?: readonly number[]
  ownedMakeupIds?: readonly number[]
  ownedMomoIds?: readonly number[]
  isItemOwned?: (itemId: number) => boolean
  getOutfitProgress?: (itemIds: readonly number[]) => {
    status: OutfitOwnershipMode
  }
  getFullMakeupProgress?: (makeupIds: readonly number[]) => {
    status: MakeupOwnershipMode
  }
}

export type StaticCatalogListingQuery = {
  entity: StaticCatalogListingEntity
  filters: Record<string, unknown>
  page: number
  pageSize: number
  regionScope?: CatalogRegionScope
  ownershipMode?:
    | ItemOwnershipMode
    | OutfitOwnershipMode
    | MakeupOwnershipMode
    | MomoOwnershipMode
  wardrobe?: CatalogListingWardrobeAccess
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

type CatalogVariationFilter =
  | 'base'
  | 'all'
  | 'glowup'
  | 'evo1'
  | 'evo2'
  | 'evo3'
  | 'all-evos'

const catalogVariationFilters = new Set<CatalogVariationFilter>([
  'base',
  'all',
  'glowup',
  'evo1',
  'evo2',
  'evo3',
  'all-evos',
])

const getCatalogVariationFilter = (
  filters: Record<string, unknown>
): CatalogVariationFilter => {
  const value = filters.variations
  if (value === true || value === 'show' || value === 'true' || value === '1') {
    return 'all'
  }

  return catalogVariationFilters.has(value as CatalogVariationFilter)
    ? (value as CatalogVariationFilter)
    : 'base'
}

const matchesCatalogVariationFilter = (
  filters: Record<string, unknown>,
  variantType: VariantType
) => {
  const variationFilter = getCatalogVariationFilter(filters)

  if (variationFilter === 'all') return true
  if (variationFilter === 'all-evos') return variantType.startsWith('evo')
  return variantType === variationFilter
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
  filters: Record<string, unknown>,
  entity: SourceDetailEntity
) =>
  matchesQuality(entry, filters) &&
  matchesStyle(entry, filters) &&
  matchesLabel(entry, filters) &&
  matchesVersion(entry, filters) &&
  matchesSource(entry, filters) &&
  matchesSourceDetailFilter(entry, filters, entity)

const matchesOutfitStableFilters = (
  outfit: CatalogLocalOutfit,
  filters: Record<string, unknown>
) =>
  matchesStableCatalogFilters(outfit, filters, 'outfit') &&
  matchesCatalogVariationFilter(
    filters,
    getOutfitVariantType(String(outfit.id))
  )

const matchesItemStableFilters = (
  item: CatalogLocalItem,
  filters: Record<string, unknown>
) => {
  if (!matchesStableCatalogFilters(item, filters, 'item')) return false
  if (!matchesCatalogVariationFilter(filters, getItemVariantType(item.id))) {
    return false
  }

  const type = getStringFilter(filters, 'type')
  return !type || item.type === type
}

const matchesItemAttributeFilters = (
  item: CatalogLocalItem,
  attributeMatchingIdSet: ReadonlySet<number>,
  itemGroupIdsById: ReadonlyMap<number, readonly number[]>
) =>
  attributeMatchingIdSet.has(item.id) ||
  attributeMatchingIdSet.has(Number(getBaseItemId(item.id))) ||
  (itemGroupIdsById.get(item.id) ?? []).some((itemId) =>
    attributeMatchingIdSet.has(itemId)
  )

const getFullMakeupVariantType = (id: number): VariantType =>
  String(id).endsWith('03') ? 'evo3' : 'base'

const matchesMakeupVariationFilter = (
  makeup: CatalogLocalMakeup,
  filters: Record<string, unknown>
) =>
  matchesCatalogVariationFilter(
    filters,
    makeup.type === 'fullMakeup'
      ? getFullMakeupVariantType(makeup.id)
      : getItemVariantType(makeup.id)
  )

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
      if (leftOrder !== rightOrder) return leftOrder - rightOrder
      return compareByObtainOrder(left, right)
    }

    if (type === 'fullMakeup') {
      return right.id - left.id
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

const filterDirectIdsByOwnership = (
  ids: number[],
  mode: ItemOwnershipMode | MomoOwnershipMode,
  ownedIds: readonly number[] | undefined,
  unavailableMessage: string
) => {
  if (mode === 'all') return ids
  if (!ownedIds) throw new Error(unavailableMessage)

  const ownedIdSet = new Set(ownedIds)
  return ids.filter((id) => {
    const owned = ownedIdSet.has(id)
    return mode === 'owned' ? owned : !owned
  })
}

const getCatalogQueryRegionScope = (
  query: Pick<CatalogListingQuery | StaticCatalogListingQuery, 'regionScope'>
) => normalizeCatalogRegionScope(query.regionScope)

const getRegionScopedItemIds = (
  itemIds: readonly number[],
  scope: CatalogRegionScope
) => filterCatalogIdsByRegionScope('item', itemIds, scope)

const getRegionScopedMakeupIds = (
  makeupIds: readonly number[],
  scope: CatalogRegionScope
) => filterCatalogIdsByRegionScope('makeup', makeupIds, scope)

const getOutfitItemIdsForScope = (
  index: CatalogLocalIndex,
  scope: CatalogRegionScope
) => {
  const outfitItemIds = new Set<number>()

  index.outfitItemsById.forEach((itemIds) => {
    getRegionScopedItemIds(itemIds, scope).forEach((itemId) => {
      outfitItemIds.add(itemId)
    })
  })

  return outfitItemIds
}

const getFullMakeupComponentIdsForScope = (
  index: CatalogLocalIndex,
  scope: CatalogRegionScope
) => {
  const makeupIds = new Set<number>()

  index.makeupItemsById.forEach((componentIds) => {
    getRegionScopedMakeupIds(componentIds, scope).forEach((makeupId) => {
      makeupIds.add(makeupId)
    })
  })

  return makeupIds
}

const toOutfitItemsRecord = (
  outfitIds: readonly number[],
  outfitItemsById: ReadonlyMap<number, number[]>,
  regionScope: CatalogRegionScope = 'global'
) =>
  Object.fromEntries(
    outfitIds.map((outfitId) => [
      String(outfitId),
      getRegionScopedItemIds(outfitItemsById.get(outfitId) ?? [], regionScope),
    ])
  )

const toMakeupItemsRecord = (
  makeupIds: readonly number[],
  makeupItemsById: ReadonlyMap<number, number[]>,
  regionScope: CatalogRegionScope = 'global'
) =>
  Object.fromEntries(
    makeupIds.map((makeupId) => [
      String(makeupId),
      getRegionScopedMakeupIds(
        makeupItemsById.get(makeupId) ?? [],
        regionScope
      ),
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
  const regionScope = getCatalogQueryRegionScope(query)
  const pieceFilter = resolveCatalogItemPieceFilter(
    getStringFilter(query.filters, 'piece')
  )
  const outfitItemIds =
    pieceFilter === 'all' ? null : getOutfitItemIdsForScope(index, regionScope)
  const stableFiltered = index.items.filter(
    (item) =>
      matchesItemStableFilters(item, query.filters) &&
      isCatalogEntryAvailableInScope('item', item.id, regionScope) &&
      (!outfitItemIds ||
        matchesCatalogItemPieceFilter(item.id, pieceFilter, outfitItemIds))
  )
  const attributeFiltered = attributeMatchingIdSet
    ? stableFiltered.filter((item) =>
        matchesItemAttributeFilters(
          item,
          attributeMatchingIdSet,
          index.itemGroupIdsById
        )
      )
    : stableFiltered

  return filterItemIdsByOwnership(
    attributeFiltered.map((item) => item.id),
    query.ownershipMode,
    wardrobe
  )
}

export const getLocalCatalogItemMatchingIds = ({
  filters,
  index,
  attributeMatchingIds,
}: {
  filters: Record<string, unknown>
  index: CatalogLocalIndex
  attributeMatchingIds?: readonly number[] | null
}) =>
  getLocalItemMatchingIds({
    query: {
      entity: 'item',
      filters,
      page: 1,
      pageSize: Number.MAX_SAFE_INTEGER,
      ownershipMode: 'all',
    },
    index,
    attributeMatchingIds,
    wardrobe: {},
  })

const getLocalOutfitMatchingIds = ({
  query,
  index,
  wardrobe,
}: {
  query: CatalogLocalListingOutfitQuery
  index: CatalogLocalIndex
  wardrobe: CatalogListingWardrobeAccess
}) => {
  const regionScope = getCatalogQueryRegionScope(query)
  const stableFiltered = index.outfits.filter(
    (outfit) =>
      matchesOutfitStableFilters(outfit, query.filters) &&
      getRegionScopedItemIds(
        index.outfitItemsById.get(outfit.id) ?? [],
        regionScope
      ).length > 0
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
    outfitItems: toOutfitItemsRecord(
      ids,
      index.outfitItemsById,
      getCatalogQueryRegionScope(query)
    ),
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
            index.outfitItemsById,
            getCatalogQueryRegionScope(query)
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
  const regionScope = getCatalogQueryRegionScope(query)
  const pieceFilter = resolveCatalogItemPieceFilter(
    getStringFilter(query.filters, 'piece')
  )
  const outfitItemIds =
    pieceFilter === 'all' ? null : getOutfitItemIdsForScope(index, regionScope)
  const stableFiltered = index.items.filter(
    (item) =>
      matchesItemStableFilters(item, query.filters) &&
      isCatalogEntryAvailableInScope('item', item.id, regionScope) &&
      (!outfitItemIds ||
        matchesCatalogItemPieceFilter(item.id, pieceFilter, outfitItemIds))
  )
  const attributeFiltered = attributeMatchingIdSet
    ? stableFiltered.filter((item) =>
        matchesItemAttributeFilters(
          item,
          attributeMatchingIdSet,
          index.itemGroupIdsById
        )
      )
    : stableFiltered

  const ownershipMode =
    query.entity === 'item' && query.ownershipMode !== 'partial'
      ? (query.ownershipMode ?? 'all')
      : 'all'

  return filterItemIdsByOwnership(
    attributeFiltered.map((item) => item.id),
    ownershipMode,
    query.wardrobe ?? {}
  )
}

const filterStaticOutfitIds = ({
  query,
  index,
}: {
  query: StaticCatalogListingQuery
  index: CatalogLocalIndex
}) => {
  const outfitIds = index.outfits
    .filter(
      (outfit) =>
        matchesOutfitStableFilters(outfit, query.filters) &&
        getRegionScopedItemIds(
          index.outfitItemsById.get(outfit.id) ?? [],
          getCatalogQueryRegionScope(query)
        ).length > 0
    )
    .map((outfit) => outfit.id)

  const ownershipMode =
    query.entity === 'outfit' ? (query.ownershipMode ?? 'all') : 'all'
  if (ownershipMode === 'all') return outfitIds

  const wardrobe = query.wardrobe ?? {}
  if (!wardrobe.getOutfitProgress) {
    throw new Error('Outfit wardrobe progress is unavailable')
  }

  return outfitIds.filter((outfitId) => {
    const progress = wardrobe.getOutfitProgress!(
      getRegionScopedItemIds(
        index.outfitItemsById.get(outfitId) ?? [],
        getCatalogQueryRegionScope(query)
      )
    )
    return progress.status === ownershipMode
  })
}

const filterStaticMakeupIds = ({
  query,
  index,
}: {
  query: StaticCatalogListingQuery
  index: CatalogLocalIndex
}) => {
  const kindFilter = resolveCatalogMakeupKindFilter(
    getStringFilter(query.filters, 'kind')
  )
  const regionScope = getCatalogQueryRegionScope(query)
  const fullMakeupComponentIds =
    kindFilter === 'all'
      ? null
      : getFullMakeupComponentIdsForScope(index, regionScope)
  const makeupIds = sortMakeupsForFilters(
    index.makeups.filter((makeup) => {
      if (!matchesStableCatalogFilters(makeup, query.filters, 'makeup')) {
        return false
      }
      if (
        fullMakeupComponentIds &&
        !matchesCatalogMakeupKindFilter(
          makeup.id,
          makeup.type,
          kindFilter,
          fullMakeupComponentIds
        )
      ) {
        return false
      }
      if (!isCatalogEntryAvailableInScope('makeup', makeup.id, regionScope)) {
        return false
      }

      const type = getStringFilter(query.filters, 'type')
      if (type && makeup.type !== type) return false

      return matchesMakeupVariationFilter(makeup, query.filters)
    }),
    query.filters
  ).map((makeup) => makeup.id)

  const ownershipMode =
    query.entity === 'makeup'
      ? ((query.ownershipMode ?? 'all') as MakeupOwnershipMode)
      : 'all'
  if (ownershipMode === 'all') return makeupIds

  const wardrobe = query.wardrobe ?? {}
  const ownedMakeupIds = wardrobe.ownedMakeupIds
  const ownedMakeupIdSet = ownedMakeupIds ? new Set(ownedMakeupIds) : null

  if (!ownedMakeupIdSet && !wardrobe.getFullMakeupProgress) {
    throw new Error('Makeup wardrobe progress is unavailable')
  }

  return makeupIds.filter((makeupId) => {
    const makeup = index.makeupById.get(makeupId)
    if (!makeup) return false
    if (
      !isCatalogEntryAvailableInScope(
        'makeup',
        makeup.id,
        getCatalogQueryRegionScope(query)
      )
    ) {
      return false
    }

    if (makeup.type !== 'fullMakeup') {
      if (!ownedMakeupIdSet) {
        throw new Error('Makeup wardrobe ownership is unavailable')
      }

      const owned = ownedMakeupIdSet.has(makeupId)
      return ownershipMode === 'owned'
        ? owned
        : ownershipMode === 'missing' && !owned
    }

    const componentIds = getRegionScopedMakeupIds(
      index.makeupItemsById.get(makeupId) ?? [],
      getCatalogQueryRegionScope(query)
    )
    const progress = wardrobe.getFullMakeupProgress
      ? wardrobe.getFullMakeupProgress(componentIds)
      : getWardrobeSetProgress(componentIds, ownedMakeupIdSet!)

    return progress.status === ownershipMode
  })
}

const filterStaticMomoIds = ({
  query,
  index,
}: {
  query: StaticCatalogListingQuery
  index: CatalogLocalIndex
}) => {
  const momoIds = index.momo
    .filter(
      (momo) =>
        matchesQuality(momo, query.filters) &&
        matchesMomoVersion(momo, query.filters) &&
        matchesMomoSource(momo, query.filters) &&
        isCatalogEntryAvailableInScope(
          'momo',
          momo.id,
          getCatalogQueryRegionScope(query)
        )
    )
    .map((momo) => momo.id)

  const ownershipMode =
    query.entity === 'momo' && query.ownershipMode !== 'partial'
      ? ((query.ownershipMode ?? 'all') as MomoOwnershipMode)
      : 'all'

  return filterDirectIdsByOwnership(
    momoIds,
    ownershipMode,
    query.wardrobe?.ownedMomoIds,
    'Momo wardrobe ownership is unavailable'
  )
}

export const getLocalStaticCatalogListingMatchingIds = ({
  query,
  index,
  attributeMatchingIds,
}: {
  query: StaticCatalogListingQuery
  index: CatalogLocalIndex
  attributeMatchingIds?: readonly number[] | null
}): CatalogListingIdsResult & CatalogListingMakeupRelations => {
  switch (query.entity) {
    case 'item':
      return {
        ids: filterStaticItemIds({ query, index, attributeMatchingIds }),
      }
    case 'outfit': {
      const ids = filterStaticOutfitIds({ query, index })
      return {
        ids,
        outfitItems: toOutfitItemsRecord(
          ids,
          index.outfitItemsById,
          getCatalogQueryRegionScope(query)
        ),
      }
    }
    case 'makeup': {
      const ids = filterStaticMakeupIds({ query, index })
      return {
        ids,
        wardrobeMakeupItems: toMakeupItemsRecord(
          ids,
          index.makeupItemsById,
          getCatalogQueryRegionScope(query)
        ),
      }
    }
    case 'momo':
      return {
        ids: filterStaticMomoIds({ query, index }),
      }
  }
}

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
  const idResult = getLocalStaticCatalogListingMatchingIds({
    query,
    index,
    attributeMatchingIds,
  })
  const ids = idResult.ids
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
    ...(query.entity === 'makeup'
      ? {
          wardrobeMakeupItems: toMakeupItemsRecord(
            pageIds,
            index.makeupItemsById,
            getCatalogQueryRegionScope(query)
          ),
        }
      : {}),
  }
}
